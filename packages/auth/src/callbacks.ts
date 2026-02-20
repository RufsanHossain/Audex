import { connectDb, User as UserModel } from "@audex/db";
import { UserRole } from "@audex/types";

import type { Account, Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";

export async function jwtCallback({
  token,
  user,
  account,
  trigger,
}: {
  token: JWT;
  user?: User;
  account?: Account | null;
  trigger?: "signIn" | "signUp" | "update";
}): Promise<JWT> {
  if (user) {
    token.id = user.id;
    token.role = user.role;
    token.emailVerified = user.emailVerified;
  }

  if (account && (account.provider === "google" || account.provider === "github")) {
    await connectDb();

    const email = token.email ?? "";
    const dbUser = await UserModel.findOne({ email });

    if (!dbUser) {
      const newUser = await UserModel.create({
        name: token.name ?? "Unknown",
        email,
        image: token.picture ?? undefined,
        emailVerified: new Date(),
        role: UserRole.Free,
      });

      token.id = newUser._id.toString();
      token.role = newUser.role as UserRole;
      token.emailVerified = newUser.emailVerified ?? null;
    } else {
      if (!dbUser.image && token.picture) {
        await UserModel.findByIdAndUpdate(dbUser._id, {
          image: token.picture,
        });
      }

      token.id = dbUser._id.toString();
      token.role = dbUser.role as UserRole;
      token.emailVerified = dbUser.emailVerified ?? null;
    }
  }

  if (trigger === "update") {
    await connectDb();
    const freshUser = await UserModel.findById(token.id);
    if (freshUser) {
      token.role = freshUser.role as UserRole;
      token.emailVerified = freshUser.emailVerified ?? null;
    }
  }

  return token;
}

export function sessionCallback({ session, token }: { session: Session; token: JWT }): Session {
  session.user.id = token.id;
  session.user.role = token.role;
  session.user.emailVerified = token.emailVerified;
  return session;
}

export function signInCallback({
  account,
}: {
  user: User;
  account?: Account | null;
}): boolean | string {
  if (account?.provider === "google" || account?.provider === "github") {
    return true;
  }

  return true;
}
