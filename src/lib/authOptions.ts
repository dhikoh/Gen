import { NextAuthOptions } from "next-auth";
import { encode as defaultEncode, decode as defaultDecode } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { applyRateLimit } from "@/lib/rateLimit";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/id/auth",
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
        
        // Rate limiting login
        const ip = req.headers?.["x-forwarded-for"] || "127.0.0.1";
        const isAllowed = await applyRateLimit(`login_${ip}_${credentials.identifier}`, 5, 60); // 5 tries per minute
        if (!isAllowed) {
          throw new Error("Terlalu banyak percobaan login. Silakan coba lagi nanti.");
        }

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: { equals: credentials.identifier, mode: "insensitive" } },
              { username: { equals: credentials.identifier, mode: "insensitive" } },
              { phoneNumber: credentials.identifier }
            ]
          }
        });

        if (!user) {
          throw new Error("Invalid credentials");
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isValid) {
          throw new Error("Invalid credentials");
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
          rememberMe: credentials.rememberMe === "true"
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.rememberMe = user.rememberMe;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
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
