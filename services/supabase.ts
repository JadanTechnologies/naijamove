// @ts-ignore
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database types (you'll need to define these based on your Supabase schema)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          role: 'ADMIN' | 'DRIVER' | 'PASSENGER' | 'STAFF';
          wallet_balance: number;
          phone?: string;
          nin?: string;
          is_nin_verified?: boolean;
          bank_account?: any;
          avatar?: string;
          status?: string;
          suspension_reason?: string;
          ip?: string;
          device?: string;
          isp?: string;
          location?: any;
          is_online?: boolean;
          vehicle_type?: string;
          license_plate?: string;
          rating?: number;
          total_trips?: number;
          vehicle_capacity_kg?: number;
          current_load_kg?: number;
          load_status?: string;
          password?: string;
          totp_secret?: string;
          is_totp_setup?: boolean;
          magic_link?: string;
          magic_link_expires?: string;
          permissions?: string[];
          token?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['users']['Row']>;
        Update: Partial<Database['public']['Tables']['users']['Row']>;
      };
      rides: {
        Row: {
          id: string;
          passenger_id: string;
          driver_id?: string;
          type: 'RIDE' | 'LOGISTICS';
          vehicle_type: string;
          pickup_address: string;
          dropoff_address: string;
          price: number;
          status: string;
          created_at: string;
          distance_km: number;
          parcel_description?: string;
          parcel_weight?: string;
          parcel_weight_value?: number;
          receiver_phone?: string;
          rejected_by?: string[];
          start_time?: string;
          end_time?: string;
          estimated_weight_kg?: number;
        };
        Insert: Partial<Database['public']['Tables']['rides']['Row']>;
        Update: Partial<Database['public']['Tables']['rides']['Row']>;
      };
      // Add other tables as needed
    };
  };
}