import type { DemoBrandSubmission } from "@/types/brand";

export type AdminBrandStatus = "pending" | "approved" | "rejected";
export type AdminProductModerationStatus = "visible" | "flagged" | "hidden";
export type AdminDisputeStatus = "open" | "customer" | "brand" | "investigation";

export type AdminBrandSubmission = DemoBrandSubmission & {
  id: string;
  status: AdminBrandStatus;
  verified: boolean;
  submittedAt: string;
  updatedAt: string;
};

export type AdminProductModeration = {
  productId: string;
  status: AdminProductModerationStatus;
  updatedAt: string;
};

export type AdminDisputeDecision = {
  orderId: string;
  status: AdminDisputeStatus;
  updatedAt: string;
};

export type AdminActivityLogItem = {
  id: string;
  action: string;
  target: string;
  createdAt: string;
};
