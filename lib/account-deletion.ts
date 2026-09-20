import { addMonths } from "date-fns";
import type { AccountDeletionRequestStatus } from "@prisma/client";

export const ACCOUNT_DELETION_REQUEST_STATUSES = [
  "PENDING",
  "IN_REVIEW",
  "COMPLETED",
  "DECLINED",
  "CANCELLED",
] as const satisfies readonly AccountDeletionRequestStatus[];

export const OPEN_ACCOUNT_DELETION_REQUEST_STATUSES = [
  "PENDING",
  "IN_REVIEW",
] as const satisfies readonly AccountDeletionRequestStatus[];

export function getAccountDeletionResponseDueAt(requestedAt: Date) {
  return addMonths(requestedAt, 1);
}

export function isAccountDeletionRequestStatus(
  value: string,
): value is AccountDeletionRequestStatus {
  return ACCOUNT_DELETION_REQUEST_STATUSES.some((status) => status === value);
}

export function isOpenAccountDeletionRequestStatus(
  status: AccountDeletionRequestStatus,
) {
  return OPEN_ACCOUNT_DELETION_REQUEST_STATUSES.some(
    (openStatus) => openStatus === status,
  );
}

export function getAccountDeletionStatusLabel(
  status: AccountDeletionRequestStatus,
) {
  const labels: Record<AccountDeletionRequestStatus, string> = {
    PENDING: "Pending",
    IN_REVIEW: "In review",
    COMPLETED: "Completed",
    DECLINED: "Declined",
    CANCELLED: "Cancelled",
  };

  return labels[status];
}
