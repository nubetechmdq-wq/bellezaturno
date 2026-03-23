import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const admin = createAdminClient();
    const { data: events, error } = await admin
      .from("analytics_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      count: events?.length || 0,
      logs: events
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
