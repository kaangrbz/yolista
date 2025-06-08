export interface Profile {
  id: string;
  username: string;
  full_name: string;
  image_url?: string;
  header_image?: string;
  description?: string;
  website?: string;
  is_verified: boolean;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
} 