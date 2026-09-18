import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      registrationStatus?: string;
      mustChangePassword?: boolean;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    role: string;
    registrationStatus?: string;
    rememberMe?: boolean;
    mustChangePassword?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: string;
    registrationStatus?: string;
    rememberMe?: boolean;
    mustChangePassword?: boolean;
    checkedAt?: number;
    passwordChangedAt?: string | null;
  }
}
