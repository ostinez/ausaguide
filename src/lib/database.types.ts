import type {
  BookingStatus,
  HostType,
  TourCategory,
  UserRole,
  ApplicationStatus,
} from "./types"

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          avatar_url: string | null
          role: UserRole
          bio: string | null
          location: string | null
          phone: string | null
          languages: string[]
          host_type: HostType | null
          is_verified: boolean
          is_private: boolean
          trust_score?: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          avatar_url?: string | null
          role?: UserRole
          bio?: string | null
          location?: string | null
          phone?: string | null
          languages?: string[]
          host_type?: HostType | null
          is_verified?: boolean
          is_private?: boolean
          trust_score?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>
      }
      hosts: {
        Row: {
          id: string
          user_id: string | null
          full_name: string
          email: string
          city: string
          host_type: HostType
          bio: string
          video_url: string | null
          id_upload_url: string | null
          license_upload_url: string | null
          rejection_reason: string | null
          status: ApplicationStatus
          created_at: string
          reviewed_at: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          full_name: string
          email: string
          city: string
          host_type: HostType
          bio: string
          video_url?: string | null
          id_upload_url?: string | null
          license_upload_url?: string | null
          rejection_reason?: string | null
          status?: ApplicationStatus
          created_at?: string
          reviewed_at?: string | null
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["hosts"]["Insert"]>
      }
      tours: {
        Row: {
          id: string
          host_id: string
          title: string
          description: string
          short_description: string
          price: number
          currency: string
          duration_hours: number
          max_guests: number
          location_name: string
          latitude: number
          longitude: number
          category: TourCategory
          tour_type: string
          images: string[]
          highlights: string[]
          is_published: boolean
          rating: number
          review_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          host_id: string
          title: string
          description: string
          short_description: string
          price: number
          currency?: string
          duration_hours: number
          max_guests: number
          location_name: string
          latitude: number
          longitude: number
          category: TourCategory
          tour_type: string
          images?: string[]
          highlights?: string[]
          is_published?: boolean
          rating?: number
          review_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["tours"]["Insert"]>
      }
      bookings: {
        Row: {
          id: string
          tour_id: string
          guest_id: string | null
          host_id: string
          booking_date: string
          check_in_date: string | null
          check_out_date: string | null
          guest_count: number
          status: BookingStatus
          total_price: number
          stripe_payment_intent_id: string | null
          daily_room_url: string | null
          guest_name: string
          guest_email: string
          guest_phone: string
          notes: string | null
          booking_time: string | null
          is_custom: boolean
          custom_details: any | null
          offer_expires_at: string | null
          dispute_status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tour_id: string
          guest_id?: string | null
          host_id: string
          booking_date: string
          check_in_date?: string | null
          check_out_date?: string | null
          guest_count?: number
          status?: BookingStatus
          total_price: number
          stripe_payment_intent_id?: string | null
          daily_room_url?: string | null
          guest_name: string
          guest_email: string
          guest_phone: string
          notes?: string | null
          booking_time?: string | null
          is_custom?: boolean
          custom_details?: any | null
          offer_expires_at?: string | null
          dispute_status?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["bookings"]["Insert"]>
      }
      reviews: {
        Row: {
          id: string
          booking_id: string
          user_id: string
          host_id: string
          tour_id: string
          rating: number
          comment: string | null
          likes: number
          complaints: number
          status: 'pending' | 'visible' | 'hidden'
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          user_id: string
          host_id: string
          tour_id: string
          rating: number
          comment?: string | null
          likes?: number
          complaints?: number
          status?: 'pending' | 'visible' | 'hidden'
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["reviews"]["Insert"]>
      }
      conversations: {
        Row: {
          id: string
          participant_a: string
          participant_b: string
          context_type: string
          context_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          participant_a: string
          participant_b: string
          context_type?: string
          context_id?: string | null
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["conversations"]["Insert"]>
      }
      messages: {
        Row: {
          id: string
          conversation_id: string | null
          booking_id: string | null
          sender_id: string
          receiver_id: string
          message: string
          read: boolean
          sender_type: string | null
          notification_type: string | null
          metadata: any | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id?: string | null
          booking_id?: string | null
          sender_id: string
          receiver_id: string
          message: string
          read?: boolean
          sender_type?: string | null
          notification_type?: string | null
          metadata?: any | null
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>
      }
      strikes: {
        Row: {
          id: string
          host_id: string
          booking_id: string | null
          reason: string
          created_at: string
        }
        Insert: {
          id?: string
          host_id: string
          booking_id?: string | null
          reason: string
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["strikes"]["Insert"]>
      }
      comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          content: string
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["comments"]["Insert"]>
      }
      comment_likes: {
        Row: {
          id: string
          comment_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          comment_id: string
          user_id: string
          created_at?: string
        }
        Update: Partial<Database["public"]["Tables"]["comment_likes"]["Insert"]>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"]
export type HostRow = Database["public"]["Tables"]["hosts"]["Row"]
export type TourRow = Database["public"]["Tables"]["tours"]["Row"]
export type BookingRow = Database["public"]["Tables"]["bookings"]["Row"]
export type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"]
export type MessageRow = Database["public"]["Tables"]["messages"]["Row"]
export type ConversationRow = Database["public"]["Tables"]["conversations"]["Row"]
export type CommentRow = Database["public"]["Tables"]["comments"]["Row"]
export type CommentLikeRow = Database["public"]["Tables"]["comment_likes"]["Row"]
