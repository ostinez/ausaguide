/**
 * Quick test: Try logging in as admin with Supabase
 */
const SUPABASE_URL = 'https://sdbvvcjnlergsmcsorrv.supabase.co'
const ANON_KEY = 'sb_publishable_NyfTrWiQmV7NG6FUS17GGw_qyik8qVo'
const ADMIN_EMAIL = 'ostinez48@gmail.com'
const ADMIN_PASSWORD = 'Mbomati.may23'

async function testLogin() {
  console.log('Testing admin login...')
  console.log(`Email: ${ADMIN_EMAIL}`)
  
  const resp = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': ANON_KEY,
    },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  })
  
  const data = await resp.json()
  
  if (!resp.ok) {
    console.log('❌ Login FAILED:', data.error, '-', data.error_description || data.msg)
    
    if (data.error_description?.includes('Email not confirmed') || data.error?.includes('not confirmed')) {
      console.log('\n⚠️  The account exists but the EMAIL IS NOT CONFIRMED.')
      console.log('   → Use the /admin-setup page to send a magic link to confirm the email.')
    } else if (data.error_description?.includes('Invalid login credentials') || data.error === 'invalid_grant') {
      console.log('\n⚠️  Invalid credentials. The password is wrong OR the account does not exist.')
      console.log('   → Use the /admin-setup page to trigger a password reset email.')
      console.log('   → OR try signing up with this email at /auth (Sign Up tab)')
    }
    return
  }
  
  console.log('✅ Login SUCCESSFUL!')
  console.log('   User ID:', data.user?.id)
  console.log('   Email:', data.user?.email)
  console.log('   Email confirmed:', data.user?.email_confirmed_at ? 'YES' : 'NO')
  
  // Check profile role
  const profileResp = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${data.user.id}&select=id,email,role,username`,
    {
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${data.access_token}`,
      }
    }
  )
  const profiles = await profileResp.json()
  if (profiles && profiles.length > 0) {
    console.log('   Profile role:', profiles[0].role)
    console.log('   Username:', profiles[0].username || '(none)')
  } else {
    console.log('   ⚠️ No profile found for this user!')
  }
}

testLogin().catch(err => {
  console.error('Unexpected error:', err.message)
})
