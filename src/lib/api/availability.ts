import { supabase } from "@/lib/supabase"
import type { HostAvailability, HostSettings } from "@/lib/types"

export async function fetchHostSettings(hostId: string): Promise<HostSettings | null> {
  const { data, error } = await supabase
    .from("host_settings")
    .select("*")
    .eq("host_id", hostId)
    .maybeSingle()

  if (error) {
    console.error("Error fetching host settings", error)
    return null
  }
  return data
}

export async function updateHostSettings(settings: HostSettings): Promise<void> {
  const { error } = await supabase
    .from("host_settings")
    .upsert({
      host_id: settings.host_id,
      reminder_time: settings.reminder_time,
      notification_preferences: settings.notification_preferences,
      is_busy: settings.is_busy,
      busy_reason: settings.busy_reason,
      updated_at: new Date().toISOString()
    })

  if (error) throw error
}

export async function fetchHostAvailability(hostId: string): Promise<HostAvailability[]> {
  const { data, error } = await supabase
    .from("host_availability")
    .select("*")
    .eq("host_id", hostId)

  if (error) {
    console.error("Error fetching host availability", error)
    return []
  }
  return data || []
}

export async function updateHostAvailability(
  hostId: string, 
  availabilities: Omit<HostAvailability, "id" | "host_id">[]
): Promise<void> {
  // Simple full replace
  await supabase.from("host_availability").delete().eq("host_id", hostId)
  
  if (availabilities.length > 0) {
    const { error } = await supabase.from("host_availability").insert(
      availabilities.map(a => ({
        host_id: hostId,
        day_of_week: a.day_of_week,
        start_time: a.start_time,
        end_time: a.end_time,
        guest_limit: a.guest_limit,
      }))
    )
    if (error) throw error
  }
}
