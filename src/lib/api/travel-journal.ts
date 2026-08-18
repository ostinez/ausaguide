import { supabase } from "@/lib/supabase"

export interface TravelJournal {
  id: string
  user_id: string
  booking_id?: string | null
  tour_id?: string | null
  title: string
  content: string
  tips: string[]
  created_at: string
  updated_at: string
}

export interface SaveTravelJournalInput {
  id?: string
  user_id?: string
  booking_id?: string | null
  tour_id?: string | null
  title: string
  content: string
  tips: string[]
}

/**
 * Fetch all travel journals for the authenticated user
 */
export async function fetchUserTravelJournals(userId?: string): Promise<TravelJournal[]> {
  try {
    let uid = userId
    if (!uid) {
      const { data: authData } = await supabase.auth.getUser()
      uid = authData.user?.id
    }
    if (!uid) return []

    const { data, error } = await supabase
      .from("travel_journals")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })

    if (error) {
      console.warn("Could not fetch travel_journals:", error.message)
      return []
    }

    return (data as TravelJournal[]) || []
  } catch (err) {
    console.error("fetchUserTravelJournals error:", err)
    return []
  }
}

/**
 * Fetch a journal tied to a specific booking
 */
export async function fetchJournalByBookingId(bookingId: string): Promise<TravelJournal | null> {
  try {
    const { data, error } = await supabase
      .from("travel_journals")
      .select("*")
      .eq("booking_id", bookingId)
      .maybeSingle()

    if (error || !data) return null
    return data as TravelJournal
  } catch {
    return null
  }
}

/**
 * Save or update a travel journal entry
 */
export async function saveTravelJournal(input: SaveTravelJournalInput): Promise<TravelJournal> {
  let uid = input.user_id
  if (!uid) {
    const { data: authData } = await supabase.auth.getUser()
    uid = authData.user?.id
  }
  if (!uid) throw new Error("You must be signed in to save travel notes.")

  const cleanTips = (input.tips || []).map((t) => t.trim()).filter(Boolean)

  if (input.id) {
    // Update
    const { data, error } = await supabase
      .from("travel_journals")
      .update({
        title: input.title.trim(),
        content: input.content,
        tips: cleanTips,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.id)
      .eq("user_id", uid)
      .select()
      .single()

    if (error) throw error
    return data as TravelJournal
  } else {
    // Insert
    const { data, error } = await supabase
      .from("travel_journals")
      .insert({
        user_id: uid,
        booking_id: input.booking_id || null,
        tour_id: input.tour_id || null,
        title: input.title.trim(),
        content: input.content,
        tips: cleanTips,
      })
      .select()
      .single()

    if (error) throw error
    return data as TravelJournal
  }
}

/**
 * Delete a travel journal entry
 */
export async function deleteTravelJournal(journalId: string): Promise<void> {
  const { error } = await supabase
    .from("travel_journals")
    .delete()
    .eq("id", journalId)

  if (error) throw error
}
