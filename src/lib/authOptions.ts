import { NextAuthOptions } from "next-auth";
import { encode as defaultEncode, decode as defaultDecode } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/db";
import { getClientIp, applyDualRateLimit } from "@/lib/rateLimit";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Username/Email/Phone", type: "text" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember Me", type: "checkbox" }
      },
      async authorize(credentials, req) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error("Missing credentials");
        }
        
        // Rate limiting login: dual bucket (per-IP dan per-identifier) - P0-5
        const ip = getClientIp(req);
        const isAllowed = await applyDualRateLimit(
          "login",
          ip,
          credentials.identifier,
          5,
          60 // 5 tries per minute
        );
        if (!isAllowed) {
          throw new Error("RATE_LIMITED");
        }

        const cleanId = credentials.identifier.trim();
        const lowerId = cleanId.toLowerCase();

        // P0-8: Case-insensitive lookup via normalized columns with fallback
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { emailLower: lowerId },
              { usernameLower: lowerId },
              { phoneNormalized: cleanId },
              { email: { equals: cleanId, mode: "insensitive" } },
              { username: { equals: cleanId, mode: "insensitive" } },
              { phoneNumber: cleanId }
            ]
          }
        });

        if (!user) {
          throw new Error("INVALID_CREDENTIALS");
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isValid) {
          throw new Error("INVALID_CREDENTIALS");
        }

        if (user.role !== "SUPERADMIN" && user.registrationStatus === "PENDING_APPROVAL") {
          throw new Error("PENDING_APPROVAL");
        }

        if (user.role !== "SUPERADMIN" && user.registrationStatus === "REJECTED") {
          throw new Error("REJECTED");
        }

        // Self-healing subscription logic
        if (user.subscriptionStatus === "ACTIVE" && user.subscriptionExpiresAt && user.subscriptionExpiresAt < new Date()) {
          await prisma.user.update({
            where: { id: user.id },
            data: { subscriptionStatus: "EXPIRED" }
          });
          user.subscriptionStatus = "EXPIRED";
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          registrationStatus: user.registrationStatus,
          rememberMe: credentials.rememberMe === "true",
          mustChangePassword: user.mustChangePassword
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.registrationStatus = user.registrationStatus;
        token.rememberMe = user.rememberMe;
        token.mustChangePassword = user.mustChangePassword;
        token.checkedAt = Date.now();
        return token;
      }

      // P0-6: Revalidasi berkala ke DB (> 5 menit)
      const now = Date.now();
      const lastCheck = typeof token.checkedAt === "number" ? token.checkedAt : 0;
      if (token.id && now - lastCheck > 5 * 60 * 1000) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              role: true,
              registrationStatus: true,
              mustChangePassword: true,
              passwordChangedAt: true,
            }
          });

          // Jika user hilang atau registrasi ditolak/belum approved, gugurkan sesi
          if (!dbUser || (dbUser.role !== "SUPERADMIN" && dbUser.registrationStatus !== "APPROVED")) {
            token.id = "";
            token.role = "USER";
            return token;
          }

          // Jika password telah diganti setelah token diterbitkan, gugurkan sesi lama
          if (dbUser.passwordChangedAt && token.iat) {
            const pwChangedMs = new Date(dbUser.passwordChangedAt).getTime();
            const tokenIssuedMs = (token.iat as number) * 1000;
            if (pwChangedMs > tokenIssuedMs) {
              token.id = "";
              token.role = "USER";
              return token;
            }
          }

          token.role = dbUser.role;
          token.registrationStatus = dbUser.registrationStatus;
          token.mustChangePassword = dbUser.mustChangePassword;
          token.checkedAt = now;
        } catch (err) {
          console.error("JWT DB revalidation error:", err);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (!token.id) {
        session.user.id = "";
        return session;
      }
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      session.user.registrationStatus = token.registrationStatus as string;
      session.user.mustChangePassword = token.mustChangePassword as boolean;
      return session;
    }
  },
  jwt: {
    async encode(params) {
      const token = params.token;
      if (token && token.rememberMe === false) {
        return defaultEncode({ ...params, maxAge: 24 * 60 * 60 }); // 1 day
      }
      return defaultEncode({ ...params, maxAge: 30 * 24 * 60 * 60 }); // 30 days
    },
    async decode(params) {
      return defaultDecode(params);
    }
  }
};
