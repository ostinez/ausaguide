import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://sdbvvcjnlergsmcsorrv.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_NyfTrWiQmV7NG6FUS17GGw_qyik8qVo'

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  console.log("Checking columns for hosts...")
  const { data: hostsData, error: hostsError } = await supabase.from('hosts').select('*').limit(1)
  if (hostsError) console.error("hosts error:", hostsError)
  else console.log("hosts fields:", hostsData[0] ? Object.keys(hostsData[0]) : "Empty")

  console.log("Checking columns for bookings...")
  const { data: bookingsData, error: bookingsError } = await supabase.from('bookings').select('*').limit(1)
  if (bookingsError) console.error("bookings error:", bookingsError)
  else console.log("bookings fields:", bookingsData[0] ? Object.keys(bookingsData[0]) : "Empty")
}
test()
