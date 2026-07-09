import type { Profile, UserRole } from "@/types/auth";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          full_name: string;
          role: UserRole;
          city?: string | null;
          state?: string | null;
          zip_code?: string | null;
          created_at?: string;
        };
        Update: {
          full_name?: string;
          role?: UserRole;
          city?: string | null;
          state?: string | null;
          zip_code?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
