export type PickupStatus = "not_required" | "scheduled" | "ready" | "completed" | "missed";

export type PickupWindow = {
  id: string;
  brandId: string;
  startsAt: string;
  endsAt: string;
  status: PickupStatus;
};
