export type ApplicationStatus = 'pending' | 'in_review' | 'approved' | 'rejected' | 'more_info_requested';
export type AdminRole = 'super_admin' | 'platform_admin' | 'operations_admin' | 'moderator' | 'finance_admin';
export type AuditAction =
  | 'APPROVE_OWNER_APPLICATION' | 'REJECT_OWNER_APPLICATION' | 'REQUEST_REVISION'
  | 'BAN_USER' | 'UNBAN_USER' | 'PROMOTE_ADMIN' | 'DEMOTE_ADMIN'
  | 'CREATE_PROMO' | 'DEACTIVATE_PROMO' | 'UPDATE_PROMO' | 'DELETE_PROMO' | 'ACTIVATE_PROMO'
  | 'UPDATE_PLATFORM_SETTINGS';

export interface OwnerApplication {
  id: string;
  user_id: string;
  business_name: string;
  tax_id_or_reg_no?: string;
  contact_email: string;
  contact_phone: string;
  facility_name: string;
  facility_address: string;
  court_count: number;
  surface_type?: string;
  indoor_outdoor?: 'Indoor' | 'Outdoor' | 'Both';
  operating_hours?: string;
  additional_notes?: string;
  government_id_url?: string;
  business_license_url?: string;
  proof_of_ownership_url?: string;
  facility_photos_urls: string[];
  status: ApplicationStatus;
  rejection_reason?: string;
  revision_request_note?: string;
  internal_notes?: string | null;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
  // Joined from player_profiles
  applicant?: { id: string; name: string; avatar_url?: string; email?: string };
}

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  action: AuditAction;
  target_type: string;
  target_id: string;
  metadata: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
  admin?: { name: string; avatar_url?: string };
}

export interface Promotion {
  id: string;
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  min_booking_amount: number;
  max_uses?: number;
  current_uses: number;
  applicable_to: 'all' | 'new_users' | 'returning_users';
  starts_at?: string;
  expires_at?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
}

export interface AdminStats {
  total_users: number;
  total_owners: number;
  active_facilities: number;
  pending_applications: number;
  total_revenue: number;
  bookings_today: number;
  bookings_this_month: number;
  active_promos: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string;
  role: string;
  is_admin: boolean;
  admin_role?: AdminRole;
  verification_status: string;
  is_banned: boolean;
  banned_reason?: string;
  created_at: string;
}
