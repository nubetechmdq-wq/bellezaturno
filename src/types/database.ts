// Tipos de la base de datos generados de Supabase
// NOTA: Este archivo se auto-genera con: npx supabase gen types typescript
// Por ahora definimos los tipos manualmente basado en el schema que crearemos

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TenantType = "barberia" | "peluqueria" | "spa" | "salon";
export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";
export type PlanType = "free" | "pro";

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          clerk_org_id: string | null;
          owner_clerk_id: string;
          name: string;
          slug: string;
          type: TenantType;
          description: string | null;
          address: string | null;
          city: string;
          phone: string | null;
          whatsapp_number: string | null;
          email: string | null;
          website: string | null;
          // Configuración de apariencia
          primary_color: string;
          secondary_color: string;
          hero_image_url: string | null;
          logo_url: string | null;
          gallery_urls: string[] | null;
          // Configuración de horarios
          schedule: Json | null;
          // Plan y pagos
          plan: PlanType;
          plan_expires_at: string | null;
          // WhatsApp
          whatsapp_enabled: boolean;
          whatsapp_verified: boolean;
          // SEO
          meta_title: string | null;
          meta_description: string | null;
          // Custom domain
          custom_domain: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["tenants"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["tenants"]["Insert"]>;
      };
      services: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          description: string | null;
          duration_minutes: number;
          price: number;
          image_url: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["services"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["services"]["Insert"]>;
      };
      bookings: {
        Row: {
          id: string;
          tenant_id: string;
          service_id: string;
          client_name: string;
          client_phone: string;
          client_email: string | null;
          client_clerk_id: string | null;
          starts_at: string;
          ends_at: string;
          status: BookingStatus;
          notes: string | null;
          source: "landing" | "whatsapp" | "dashboard";
          reminder_sent: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["bookings"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["bookings"]["Insert"]>;
      };
      testimonials: {
        Row: {
          id: string;
          tenant_id: string;
          client_name: string;
          content: string;
          rating: number;
          avatar_url: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["testimonials"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["testimonials"]["Insert"]>;
      };
      whatsapp_config: {
        Row: {
          id: string;
          tenant_id: string;
          phone_number_id: string | null;
          access_token: string | null;
          greeting_message: string;
          menu_message: string;
          booking_success_message: string;
          evolution_instance_name: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["whatsapp_config"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["whatsapp_config"]["Insert"]
        >;
      };
      whatsapp_conversations: {
        Row: {
          id: string;
          tenant_id: string;
          client_phone: string;
          last_message: string | null;
          context: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["whatsapp_conversations"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["whatsapp_conversations"]["Insert"]
        >;
      };
    };
    Views: {};
    Functions: {};
  };
}

// Tipos de conveniencia
export type Tenant = Database["public"]["Tables"]["tenants"]["Row"];
export type Service = Database["public"]["Tables"]["services"]["Row"];
export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
export type Testimonial = Database["public"]["Tables"]["testimonials"]["Row"];
export type WhatsappConfig =
  Database["public"]["Tables"]["whatsapp_config"]["Row"];
