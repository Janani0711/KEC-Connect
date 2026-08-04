export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      answer_votes: {
        Row: {
          answer_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          answer_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          answer_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "answer_votes_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "answers"
            referencedColumns: ["id"]
          },
        ]
      }
      answers: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          question_id: string
          upvotes: number
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          question_id: string
          upvotes?: number
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          question_id?: string
          upvotes?: number
        }
        Relationships: [
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          created_at: string
          id: string
          note: string | null
          slot_id: string
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          slot_id: string
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          slot_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "office_hour_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      connect_requests: {
        Row: {
          archived: boolean
          created_at: string
          from_user_id: string
          id: string
          last_activity_at: string
          note: string | null
          status: Database["public"]["Enums"]["connect_status"]
          to_user_id: string
          topic: Database["public"]["Enums"]["connect_topic"]
        }
        Insert: {
          archived?: boolean
          created_at?: string
          from_user_id: string
          id?: string
          last_activity_at?: string
          note?: string | null
          status?: Database["public"]["Enums"]["connect_status"]
          to_user_id: string
          topic?: Database["public"]["Enums"]["connect_topic"]
        }
        Update: {
          archived?: boolean
          created_at?: string
          from_user_id?: string
          id?: string
          last_activity_at?: string
          note?: string | null
          status?: Database["public"]["Enums"]["connect_status"]
          to_user_id?: string
          topic?: Database["public"]["Enums"]["connect_topic"]
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          connect_request_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          body: string
          connect_request_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          body?: string
          connect_request_id?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_connect_request_id_fkey"
            columns: ["connect_request_id"]
            isOneToOne: false
            referencedRelation: "connect_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      office_hour_slots: {
        Row: {
          created_at: string
          day_of_week: number | null
          duration_minutes: number
          host_id: string
          id: string
          is_recurring: boolean
          label: string
          start_time: string | null
          status: Database["public"]["Enums"]["slot_status"]
        }
        Insert: {
          created_at?: string
          day_of_week?: number | null
          duration_minutes?: number
          host_id: string
          id?: string
          is_recurring?: boolean
          label: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["slot_status"]
        }
        Update: {
          created_at?: string
          day_of_week?: number | null
          duration_minutes?: number
          host_id?: string
          id?: string
          is_recurring?: boolean
          label?: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["slot_status"]
        }
        Relationships: []
      }
      openings: {
        Row: {
          alumni_id: string
          apply_link: string | null
          category: Database["public"]["Enums"]["opening_category"]
          company: string
          created_at: string
          deadline: string | null
          eligibility: string | null
          id: string
          package: string | null
          role: string
        }
        Insert: {
          alumni_id: string
          apply_link?: string | null
          category?: Database["public"]["Enums"]["opening_category"]
          company: string
          created_at?: string
          deadline?: string | null
          eligibility?: string | null
          id?: string
          package?: string | null
          role: string
        }
        Update: {
          alumni_id?: string
          apply_link?: string | null
          category?: Database["public"]["Enums"]["opening_category"]
          company?: string
          created_at?: string
          deadline?: string | null
          eligibility?: string | null
          id?: string
          package?: string | null
          role?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          batch: string | null
          bio: string | null
          branch: string | null
          company: string | null
          created_at: string
          email: string | null
          helping_with: string[]
          id: string
          job_title: string | null
          name: string
          role: Database["public"]["Enums"]["app_role"]
          skills: string[]
          verified: boolean
          year: number | null
        }
        Insert: {
          avatar_url?: string | null
          batch?: string | null
          bio?: string | null
          branch?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          helping_with?: string[]
          id: string
          job_title?: string | null
          name?: string
          role?: Database["public"]["Enums"]["app_role"]
          skills?: string[]
          verified?: boolean
          year?: number | null
        }
        Update: {
          avatar_url?: string | null
          batch?: string | null
          bio?: string | null
          branch?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          helping_with?: string[]
          id?: string
          job_title?: string | null
          name?: string
          role?: Database["public"]["Enums"]["app_role"]
          skills?: string[]
          verified?: boolean
          year?: number | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          status: Database["public"]["Enums"]["question_status"]
          tags: string[]
          title: string
        }
        Insert: {
          author_id: string
          body?: string
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["question_status"]
          tags?: string[]
          title: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["question_status"]
          tags?: string[]
          title?: string
        }
        Relationships: []
      }
      referral_offers: {
        Row: {
          alumni_id: string
          company: string
          created_at: string
          domain: string | null
          id: string
          note: string | null
        }
        Insert: {
          alumni_id: string
          company: string
          created_at?: string
          domain?: string | null
          id?: string
          note?: string | null
        }
        Update: {
          alumni_id?: string
          company?: string
          created_at?: string
          domain?: string | null
          id?: string
          note?: string | null
        }
        Relationships: []
      }
      referral_requests: {
        Row: {
          alumni_id: string
          created_at: string
          id: string
          offer_id: string | null
          opening_id: string | null
          resume_url: string | null
          status: Database["public"]["Enums"]["referral_status"]
          student_id: string
          why_note: string
        }
        Insert: {
          alumni_id: string
          created_at?: string
          id?: string
          offer_id?: string | null
          opening_id?: string | null
          resume_url?: string | null
          status?: Database["public"]["Enums"]["referral_status"]
          student_id: string
          why_note: string
        }
        Update: {
          alumni_id?: string
          created_at?: string
          id?: string
          offer_id?: string | null
          opening_id?: string | null
          resume_url?: string | null
          status?: Database["public"]["Enums"]["referral_status"]
          student_id?: string
          why_note?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_requests_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "referral_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_requests_opening_id_fkey"
            columns: ["opening_id"]
            isOneToOne: false
            referencedRelation: "openings"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          connect_request_id: string | null
          created_at: string
          id: string
          reason: string | null
          reporter_id: string
        }
        Insert: {
          connect_request_id?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          reporter_id: string
        }
        Update: {
          connect_request_id?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          reporter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_connect_request_id_fkey"
            columns: ["connect_request_id"]
            isOneToOne: false
            referencedRelation: "connect_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          branch: string | null
          category: Database["public"]["Enums"]["resource_category"]
          created_at: string
          file_url: string | null
          id: string
          title: string
        }
        Insert: {
          branch?: string | null
          category: Database["public"]["Enums"]["resource_category"]
          created_at?: string
          file_url?: string | null
          id?: string
          title: string
        }
        Update: {
          branch?: string | null
          category?: Database["public"]["Enums"]["resource_category"]
          created_at?: string
          file_url?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      stories: {
        Row: {
          alumni_id: string
          body: string
          created_at: string
          id: string
          tag: Database["public"]["Enums"]["story_tag"]
          title: string
        }
        Insert: {
          alumni_id: string
          body: string
          created_at?: string
          id?: string
          tag?: Database["public"]["Enums"]["story_tag"]
          title: string
        }
        Update: {
          alumni_id?: string
          body?: string
          created_at?: string
          id?: string
          tag?: Database["public"]["Enums"]["story_tag"]
          title?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      archive_stale_threads: { Args: never; Returns: undefined }
      can_host: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_slot_host: { Args: { _slot: string; _user: string }; Returns: boolean }
      is_thread_participant: {
        Args: { _cr: string; _user: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "alumni"
      connect_status: "pending" | "accepted" | "declined" | "expired"
      connect_topic: "internship" | "resume" | "placement" | "project" | "other"
      opening_category: "internship" | "job" | "hackathon" | "research"
      question_status: "unanswered" | "solved"
      referral_status: "requested" | "accepted" | "declined" | "referred"
      resource_category:
        | "aptitude"
        | "coding_sheet"
        | "resume_template"
        | "interview_questions"
        | "department_notes"
      slot_status: "open" | "booked" | "cancelled"
      story_tag:
        | "placement_journey"
        | "career_advice"
        | "life_at_company"
        | "higher_studies"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["student", "alumni"],
      connect_status: ["pending", "accepted", "declined", "expired"],
      connect_topic: ["internship", "resume", "placement", "project", "other"],
      opening_category: ["internship", "job", "hackathon", "research"],
      question_status: ["unanswered", "solved"],
      referral_status: ["requested", "accepted", "declined", "referred"],
      resource_category: [
        "aptitude",
        "coding_sheet",
        "resume_template",
        "interview_questions",
        "department_notes",
      ],
      slot_status: ["open", "booked", "cancelled"],
      story_tag: [
        "placement_journey",
        "career_advice",
        "life_at_company",
        "higher_studies",
      ],
    },
  },
} as const
