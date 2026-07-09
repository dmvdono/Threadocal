export type UserRole = "customer" | "brand_owner" | "admin";

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
};

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  created_at: string;
};

export type SignupInput = {
  role: Exclude<UserRole, "admin">;
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  city?: string;
  state?: string;
  zipCode?: string;
};

export type LoginInput = {
  email: string;
  password: string;
};
