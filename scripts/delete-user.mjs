/**
 * delete-user.mjs
 * 
 * Deletes the specified user (ostinez48@gmail.com) from both profiles and auth tables.
 * 
 * Usage:
 *   node scripts/delete-user.mjs <SERVICE_ROLE_KEY>
 */

const SUPABASE_URL = 'https://sdbvvcjnlergsmcsorrv.supabase.co'
const TARGET_EMAIL = 'ostinez48@gmail.com'
const USER_ID = 'f5db8b1b-8380-49dc-850e-1d2048cc05b1'

const serviceRoleKey = process.argv[2]

if (!serviceRoleKey) {
  console.error('❌ Missing SERVICE_ROLE_KEY argument.')
  console.error('   Usage: node scripts/delete-user.mjs <SERVICE_ROLE_KEY>')
  console.error('')
  console.error('   Get your service role key from:')
  console.error('   https://supabase.com/dashboard/project/sdbvvcjnlergsmcsorrv/settings/api')
  console.error('   Under "Project API keys" -> service_role (secret)')
  process.exit(1)
}

async function run() {
  console.log(`🔧 Deleting user: ${TARGET_EMAIL} (ID: ${USER_ID})...`)
  
  const headers = {
    'apikey': serviceRoleKey,
    'Authorization': `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json'
  }

  // 1. Delete user from profiles table
  console.log('🗑️ Deleting from profiles...')
  const profileResp = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${USER_ID}`, {
    method: 'DELETE',
    headers
  })

  if (profileResp.ok) {
    console.log('✅ Deleted from public.profiles table!')
  } else {
    const text = await profileResp.text()
    console.warn('⚠️ profiles deletion notice/warning:', text)
  }

  // 2. Delete user from auth.users table
  console.log('🗑️ Deleting from auth.users...')
  const authResp = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${USER_ID}`, {
    method: 'DELETE',
    headers
  })

  if (authResp.ok) {
    console.log('✅ Deleted from auth.users!')
    console.log('\n🎉 Done! The email ostinez48@gmail.com is now completely unregistered and ready to sign up fresh.')
  } else {
    const errData = await authResp.json().catch(() => ({}))
    console.error('❌ Failed to delete from auth.users:', errData)
  }
}

run().catch(err => {
  console.error('❌ Unexpected error:', err)
})
