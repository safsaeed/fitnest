"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import {
  sendAccountDeactivatedEmail,
  sendAccountDeletionRequestedEmail,
  sendAdminAccountDeletionRequestedEmail,
} from "@/lib/account-closure-emails";
import { getAccountDeletionResponseDueAt } from "@/lib/account-deletion";
import { getFormBoolean, getFormString } from "@/lib/form-data";
import {
  destroyParentSession,
  getParentSession,
} from "@/lib/parent-auth";
import { prisma } from "@/lib/prisma";

const MEMBERSHIP_STATUSES_REQUIRING_SUPPORT = [
  "ACTIVE",
  "PAST_DUE",
  "UNPAID",
] as const;

export async function closeParentAccount(formData: FormData): Promise<void> {
  const session = await getParentSession();

  if (!session) {
    redirect("/account/login");
  }

  const intent = getFormString(formData, "intent");
  const currentPassword = getFormString(formData, "currentPassword");
  const understood = getFormBoolean(formData, "understood");

  if (intent !== "deactivate" && intent !== "delete") {
    redirect("/account/close?error=invalid-action");
  }

  if (!currentPassword || !understood) {
    redirect("/account/close?error=missing-confirmation");
  }

  const parentUser = await prisma.parentUser.findFirst({
    where: {
      id: session.parentUserId,
      isActive: true,
    },
    include: {
      membership: {
        select: {
          status: true,
          stripeSubscriptionId: true,
        },
      },
    },
  });

  if (!parentUser) {
    await destroyParentSession();
    redirect("/account/login");
  }

  const passwordMatches = await bcrypt.compare(
    currentPassword,
    parentUser.passwordHash,
  );

  if (!passwordMatches) {
    redirect("/account/close?error=invalid-current-password");
  }

  if (
    parentUser.membership?.stripeSubscriptionId &&
    MEMBERSHIP_STATUSES_REQUIRING_SUPPORT.some(
      (status) => status === parentUser.membership?.status,
    )
  ) {
    redirect("/account/close?error=active-membership");
  }

  const requestedAt = new Date();
  const responseDueAt = getAccountDeletionResponseDueAt(requestedAt);

  if (intent === "delete") {
    await prisma.$transaction([
      prisma.accountDeletionRequest.upsert({
        where: {
          parentUserId: parentUser.id,
        },
        create: {
          parentUserId: parentUser.id,
          requesterName: parentUser.name,
          requesterEmail: parentUser.email,
          requestedAt,
          responseDueAt,
        },
        update: {
          requesterName: parentUser.name,
          requesterEmail: parentUser.email,
          status: "PENDING",
          requestedAt,
          responseDueAt,
          reviewedAt: null,
          completedAt: null,
          resolutionNotes: null,
        },
      }),
      prisma.parentUser.update({
        where: {
          id: parentUser.id,
        },
        data: {
          isActive: false,
          deactivatedAt: requestedAt,
        },
      }),
      prisma.parentPasswordResetToken.deleteMany({
        where: {
          parentUserId: parentUser.id,
        },
      }),
    ]);
  } else {
    await prisma.$transaction([
      prisma.parentUser.update({
        where: {
          id: parentUser.id,
        },
        data: {
          isActive: false,
          deactivatedAt: requestedAt,
        },
      }),
      prisma.parentPasswordResetToken.deleteMany({
        where: {
          parentUserId: parentUser.id,
        },
      }),
    ]);
  }

  await destroyParentSession();

  const appUrl = process.env.APP_URL?.replace(/\/+$/, "");

  try {
    if (intent === "delete") {
      const owners = await prisma.adminUser.findMany({
        where: {
          isActive: true,
          role: "OWNER",
        },
        select: {
          email: true,
        },
      });
      const admins =
        owners.length > 0
          ? owners
          : await prisma.adminUser.findMany({
              where: {
                isActive: true,
              },
              select: {
                email: true,
              },
            });

      const results = await Promise.allSettled([
        sendAccountDeletionRequestedEmail({
          to: parentUser.email,
          parentName: parentUser.name,
          requestedAt,
          responseDueAt,
        }),
        sendAdminAccountDeletionRequestedEmail({
          to: admins.map((admin) => admin.email),
          parentName: parentUser.name,
          parentEmail: parentUser.email,
          requestedAt,
          responseDueAt,
          adminUrl: appUrl
            ? `${appUrl}/admin/account-deletion-requests`
            : undefined,
        }),
      ]);

      for (const result of results) {
        if (result.status === "rejected") {
          console.error(
            `Account deletion notification failed: ${parentUser.id}`,
            result.reason,
          );
        }
      }
    } else {
      await sendAccountDeactivatedEmail({
        to: parentUser.email,
        parentName: parentUser.name,
      });
    }
  } catch (error) {
    console.error(
      `Account closed but notification email failed: ${parentUser.id}`,
      error,
    );
  }

  redirect(
    intent === "delete"
      ? "/account/login?status=deletion-requested"
      : "/account/login?status=account-deactivated",
  );
}
