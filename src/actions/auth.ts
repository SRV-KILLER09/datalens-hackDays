"use server";

import { db } from "../db";
import { user, account } from "../db/schema";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";

export async function registerUser(data: {
  name: string;
  username: string;
  email: string;
  contact: string;
  password: string;
}) {
  try {
    // Check if email already exists
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.email, data.email))
      .limit(1);

    if (existingUser.length > 0) {
      return { success: false, error: "Email already exists" };
    }

    // Check if username already exists
    const existingUsername = await db
      .select()
      .from(user)
      .where(eq(user.username, data.username))
      .limit(1);

    if (existingUsername.length > 0) {
      return { success: false, error: "Username already exists" };
    }

    // Hash password
    const hashedPassword = await hash(data.password, 10);

    // Create user
    const userId = crypto.randomUUID();
    const now = new Date();

    await db.insert(user).values({
      id: userId,
      name: data.name,
      username: data.username,
      email: data.email,
      contact: data.contact,
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
    });

    // Create account with password
    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId: userId,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, userId };
  } catch (error) {
    console.error("Registration error:", error);
    return { success: false, error: "Registration failed" };
  }
}

export async function getUserByEmail(email: string) {
  try {
    const users = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    return users[0] || null;
  } catch (error) {
    console.error("Get user error:", error);
    return null;
  }
}

export async function getUserById(userId: string) {
  try {
    const users = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    return users[0] || null;
  } catch (error) {
    console.error("Get user error:", error);
    return null;
  }
}

export async function getUserByUsername(username: string) {
  try {
    const users = await db
      .select()
      .from(user)
      .where(eq(user.username, username))
      .limit(1);

    return users[0] || null;
  } catch (error) {
    console.error("Get user error:", error);
    return null;
  }
}
