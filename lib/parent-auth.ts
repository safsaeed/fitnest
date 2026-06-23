import "server-only";

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const PARENT_SESSION_COOKIE_NAME = "parent_session";

type ParentSessionPayload = {
  parentUserId: string;
  email: string;
};

function getParentAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is not set");
  }

  return new TextEncoder().encode(secret);
}

export async function createParentSession(payload: ParentSessionPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getParentAuthSecret());

  const cookieStore = await cookies();

  cookieStore.set(PARENT_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function getParentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(PARENT_SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getParentAuthSecret());

    const parentUserId = payload.parentUserId;
    const email = payload.email;

    if (typeof parentUserId !== "string" || typeof email !== "string") {
      return null;
    }

    return {
      parentUserId,
      email,
    };
  } catch {
    return null;
  }
}

export async function getCurrentParentUser() {
  const session = await getParentSession();

  if (!session) {
    return null;
  }

  const parentUser = await prisma.parentUser.findFirst({
    where: {
      id: session.parentUserId,
      isActive: true,
    },
    include: {
      membership: true,
    },
  });

  return parentUser;
}

export async function destroyParentSession() {
  const cookieStore = await cookies();

  cookieStore.delete(PARENT_SESSION_COOKIE_NAME);
}
