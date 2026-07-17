/**
 * Fix admin role: Update ostinez48@gmail.com profile to role='admin' and username='ausaguide'
 */
const SUPABASE_URL = 'https://sdbvvcjnlergsmcsorrv.supabase.co'
const ANON_KEY = 'sb_publishable_NyfTrWiQmV7NG6FUS17GGw_qyik8qVo'
const ADMIN_EMAIL = 'ostinez48@gmail.com'
const ADMIN_PASSWORD = 'Mbomati.may23'
const USER_ID = 'f5db8b1b-8380-49dc-850e-1d2048cc05b1'

async function fixAdminRole() {
  console.log('🔧 Fixing admin role for:', ADMIN_EMAIL)
  
  // Step 1: Log in to get access token
  const authResp = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': ANON_KEY,
    },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  })
  const authData = await authResp.json()
  if (!authResp.ok) {
    console.error('❌ Login failed:', authData)
    process.exit(1)
  }
  
  const accessToken = authData.access_token
  console.log('✅ Logged in, got access token')
  
  // Step 2: Update profile to admin role and set username to ausaguide
  const updateResp = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${USER_ID}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${accessToken}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      role: 'admin',
      username: 'ausaguide',
      full_name: 'Super Admin',
      is_verified: true
    })
  })
  
  const updateData = await updateResp.json()
  
  if (!updateResp.ok) {
    console.error('❌ Profile update failed:', updateData)
    process.exit(1)
  }
  
  console.log('✅ Profile updated successfully!')
  console.log('   New role:', updateData[0]?.role)
  console.log('   Username:', updateData[0]?.username)
  console.log('')
  console.log('🎉 Admin setup complete!')
  console.log('   You can now log in at /auth with:')
  console.log('   Email:    ostinez48@gmail.com')
  console.log('   Password: Mbomati.may23')
  console.log('   Username: ausaguide (also works)')
  console.log('')
  console.log('   After login, you will be redirected to /admin/dashboard')
}

fixAdminRole().catch(err => {
  console.error('Unexpected error:', err.message)
  process.exit(1)
})
