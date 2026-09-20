"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/auth";
import { isAccountDeletionRequestStatus } from "@/lib/account-deletion";
import { getFormString } from "@/lib/form-data";
import { prisma } from "@/lib/prisma";

async function hasActiveAdminSession() {
  const session = await getAdminSession();

  if (!session) {
    return false;
  }

  const admin = await prisma.adminUser.findFirst({
    where: {
      id: session.adminUserId,
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  return Boolean(admin);
}

export async function updateAccountDeletionRequest(
  requestId: string,
  formData: FormData,
) {
  if (!(await hasActiveAdminSession())) {
    return;
  }

  const status = getFormString(formData, "status");
  const resolutionNotes = getFormString(formData, "resolutionNotes");

  if (!isAccountDeletionRequestStatus(status)) {
    return;
  }

  if (resolutionNotes.length > 2_000) {
    return;
  }

  const now = new Date();

  await prisma.accountDeletionRequest.update({
    where: {
      id: requestId,
    },
    data: {
      status,
      resolutionNotes: resolutionNotes || null,
      reviewedAt: status === "PENDING" ? null : now,
      completedAt: status === "COMPLETED" ? now : null,
    },
  });

  revalidatePath("/admin/account-deletion-requests");
  revalidatePath("/admin/parents");
}

export async function reactivateParentAccount(
  parentUserId: string,
): Promise<{ success: boolean; message?: string }> {
  if (!(await hasActiveAdminSession())) {
    return {
      success: false,
      message: "Your admin session is no longer valid. Refresh and log in again.",
    };
  }

  const parentUser = await prisma.parentUser.findUnique({
    where: {
      id: parentUserId,
    },
    select: {
      id: true,
      isActive: true,
    },
  });

  if (!parentUser) {
    return {
      success: false,
      message: "This parent account no longer exists.",
    };
  }

  if (parentUser.isActive) {
    return {
      success: false,
      message: "This parent account is already active.",
    };
  }

  const now = new Date();

  await prisma.$transaction([
    prisma.parentUser.update({
      where: {
        id: parentUserId,
      },
      data: {
        isActive: true,
        deactivatedAt: null,
      },
    }),
    prisma.accountDeletionRequest.updateMany({
      where: {
        parentUserId,
        status: {
          in: ["PENDING", "IN_REVIEW"],
        },
      },
      data: {
        status: "CANCELLED",
        reviewedAt: now,
        completedAt: null,
        resolutionNotes: "Request cancelled when the account was reactivated.",
      },
    }),
  ]);

  revalidatePath("/admin/account-deletion-requests");
  revalidatePath("/admin/parents");
  revalidatePath(`/admin/parents/${parentUserId}`);

  return { success: true };
}
