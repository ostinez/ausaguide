/**
 * Fix admin role by calling a custom Supabase RPC function
 * This attempts to use exec_sql or pg_catalog approaches
 */
const SUPABASE_URL = 'https://sdbvvcjnlergsmcsorrv.supabase.co'
const ANON_KEY = 'sb_publishable_NyfTrWiQmV7NG6FUS17GGw_qyik8qVo'
const ADMIN_EMAIL = 'ostinez48@gmail.com'
const ADMIN_PASSWORD = 'Mbomati.may23'
const USER_ID = 'f5db8b1b-8380-49dc-850e-1d2048cc05b1'

async function fixRole() {
  // Step 1: Login to get access token
  const authResp = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': ANON_KEY },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  })
  const authData = await authResp.json()
  if (!authResp.ok) { console.error('Login failed:', authData); process.exit(1) }
  const token = authData.access_token
  console.log('✅ Logged in as:', ADMIN_EMAIL)

  // Step 2: Try using Supabase RPC to execute privileged SQL
  // Try calling an existing admin RPC if available
  const approaches = [
    // Try exec_sql (available in some Supabase setups)
    {
      name: 'exec_sql RPC',
      url: `${SUPABASE_URL}/rest/v1/rpc/exec_sql`,
      body: { query: `UPDATE public.profiles SET role = 'admin', username = 'ausaguide' WHERE id = '${USER_ID}'` }
    },
    // Try set_user_role if it exists
    {
      name: 'set_user_role RPC', 
      url: `${SUPABASE_URL}/rest/v1/rpc/set_user_role`,
      body: { user_id: USER_ID, new_role: 'admin' }
    },
    // Try admin_update_user_role
    {
      name: 'admin_update_user_role RPC',
      url: `${SUPABASE_URL}/rest/v1/rpc/admin_update_user_role`,
      body: { p_user_id: USER_ID, p_role: 'admin' }
    }
  ]

  for (const approach of approaches) {
    console.log(`\n🔄 Trying: ${approach.name}...`)
    const resp = await fetch(approach.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(approach.body)
    })
    const data = await resp.json().catch(() => null)
    if (resp.ok && !data?.code) {
      console.log(`✅ ${approach.name} succeeded!`, data)
    } else {
      console.log(`❌ ${approach.name} failed:`, data?.message || data?.error || resp.status)
    }
  }

  // Step 3: Verify current role
  const profileResp = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${USER_ID}&select=id,email,role,username`,
    { headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}` } }
  )
  const profiles = await profileResp.json()
  if (profiles?.length > 0) {
    console.log('\n📋 Current profile status:')
    console.log('   Role:', profiles[0].role)
    console.log('   Username:', profiles[0].username || '(none)')
    if (profiles[0].role === 'admin') {
      console.log('\n🎉 SUCCESS! Role is now admin!')
    } else {
      console.log('\n⚠️  Role is still:', profiles[0].role)
      console.log('   You need to run the SQL manually in Supabase SQL Editor.')
    }
  }
}

fixRole().catch(console.error)
