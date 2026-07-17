/**
 * fix-admin.mjs
 * 
 * This script fixes the admin user in Supabase.
 * It requires the SERVICE ROLE KEY from your Supabase dashboard:
 *   Dashboard → Settings → API → service_role (secret)
 * 
 * Usage:
 *   node fix-admin.mjs <SERVICE_ROLE_KEY>
 */

const SUPABASE_URL = 'https://sdbvvcjnlergsmcsorrv.supabase.co'
const ADMIN_EMAIL = 'ostinez48@gmail.com'
const ADMIN_PASSWORD = 'Mbomati.may23'
const ADMIN_USER_ID = '33333333-3333-3333-3333-333333333301'

const serviceRoleKey = process.argv[2]

if (!serviceRoleKey) {
  console.error('❌ Missing SERVICE_ROLE_KEY argument.')
  console.error('   Usage: node fix-admin.mjs <SERVICE_ROLE_KEY>')
  console.error('')
  console.error('   Get your service role key from:')
  console.error('   https://supabase.com/dashboard/project/sdbvvcjnlergsmcsorrv/settings/api')
  console.error('   Under "Project API keys" → service_role (secret)')
  process.exit(1)
}

async function fixAdmin() {
  console.log('🔧 Fixing admin user...')
  console.log(`   Email: ${ADMIN_EMAIL}`)
  console.log(`   URL: ${SUPABASE_URL}`)
  
  const headers = {
    'Content-Type': 'application/json',
    'apikey': serviceRoleKey,
    'Authorization': `Bearer ${serviceRoleKey}`,
  }

  // Step 1: Try to list users to see if admin exists
  console.log('\n📋 Checking if admin auth user exists...')
  const listResp = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=100`, { headers })
  const listData = await listResp.json()
  
  if (!listResp.ok) {
    console.error('❌ Failed to list users:', listData)
    console.error('   Make sure you are using the SERVICE ROLE KEY, not the anon key.')
    process.exit(1)
  }

  const existingUser = listData.users?.find(u => u.email === ADMIN_EMAIL)
  
  if (existingUser) {
    console.log(`✅ Admin user found in auth: ${existingUser.id}`)
    console.log(`   Email confirmed: ${existingUser.email_confirmed_at ? 'YES' : 'NO'}`)
    
    // Update password and confirm email
    console.log('\n🔄 Updating admin password and confirming email...')
    const updateResp = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${existingUser.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: { role: 'admin' }
      })
    })
    const updateData = await updateResp.json()
    
    if (!updateResp.ok) {
      console.error('❌ Failed to update user:', updateData)
      process.exit(1)
    }
    console.log('✅ Admin password updated and email confirmed!')
    
    // Step 2: Update profile to make sure role is admin and username is set
    await fixProfile(existingUser.id, headers)
    
  } else {
    console.log('⚠️  Admin user NOT found in auth. Creating...')
    
    // Create the admin auth user
    const createResp = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: { role: 'admin', full_name: 'Super Admin' }
      })
    })
    const createData = await createResp.json()
    
    if (!createResp.ok) {
      console.error('❌ Failed to create admin user:', createData)
      process.exit(1)
    }
    
    console.log(`✅ Admin auth user created: ${createData.id}`)
    await fixProfile(createData.id, headers)
  }
  
  console.log('\n🎉 Done! You can now log in with:')
  console.log(`   Email:    ${ADMIN_EMAIL}`)
  console.log(`   Password: ${ADMIN_PASSWORD}`)
  console.log(`   Username: ausaguide`)
}

async function fixProfile(userId, headers) {
  console.log(`\n📋 Fixing admin profile for user ${userId}...`)
  
  // Upsert admin profile with username
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
    method: 'PATCH',
    headers: {
      ...headers,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      email: 'ostinez48@gmail.com',
      full_name: 'Super Admin',
      role: 'admin',
      username: 'ausaguide',
      is_verified: true
    })
  })
  
  const data = await resp.json()
  
  if (!resp.ok) {
    console.log('⚠️  Profile PATCH failed, trying INSERT...')
    // Try insert instead
    const insertResp = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
      method: 'POST',
      headers: {
        ...headers,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        id: userId,
        email: 'ostinez48@gmail.com',
        full_name: 'Super Admin',
        role: 'admin',
        username: 'ausaguide',
        languages: ['English', 'Swahili'],
        is_verified: true
      })
    })
    const insertData = await insertResp.json()
    if (!insertResp.ok) {
      console.error('❌ Profile insert also failed:', insertData)
    } else {
      console.log('✅ Admin profile created with username "ausaguide"')
    }
  } else {
    console.log('✅ Admin profile updated with username "ausaguide"')
  }
}

fixAdmin().catch(err => {
  console.error('❌ Unexpected error:', err)
  process.exit(1)
})
