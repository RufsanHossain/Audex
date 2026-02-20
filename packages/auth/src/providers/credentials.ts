import { connectDb, User } from "@audex/db";
import bcrypt from "bcryptjs";
import Credentials from "next-auth/providers/credentials";

import type { UserRole } from "@audex/types";

export const credentialsProvider = Credentials({
  id: "credentials",
  name: "Credentials",
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" },
  },
  async authorize(credentials) {
    if (!credentials.email || !credentials.password) {
      return null;
    }

    const email = (credentials.email as string).toLowerCase().trim();
    const password = credentials.password as string;

    await connectDb();

    const user = await User.findOne({ email }).select("+passwordHash");

    if (!user?.passwordHash) {
      await bcrypt.compare(password, "$2a$12$dummyhashtopreventtimingattacks");
      return null;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return null;
    }

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      image: user.image ?? null,
      role: user.role as UserRole,
      emailVerified: user.emailVerified ?? null,
    };
  },
});
