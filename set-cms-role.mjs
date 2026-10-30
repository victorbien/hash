import { createClient } from '@supabase/supabase-js'

const [userId, role] = process.argv.slice(2)
const allowedRoles = new Set(['admin', 'publisher', 'editor', 'volunteer_coordinator'])
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

if (!userId || !role || process.argv.length !== 4 || !uuidPattern.test(userId) || !allowedRoles.has(role)) {
  console.error('Usage: node --env-file=.env.local .\\set-cms-role.mjs <user-uuid> <admin|publisher|editor|volunteer_coordinator>')
  process.exit(1)
}

const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { data, error } = await supabase.auth.admin.getUserById(userId)
if (error) {
  console.error(`Could not find that user: ${error.message}`)
  process.exit(1)
}

const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
  app_metadata: { ...data.user.app_metadata, role },
})

if (updateError) {
  console.error(`Could not assign the role: ${updateError.message}`)
  process.exit(1)
}

console.log(`Assigned ${role} to ${data.user.email ?? userId}. Sign out and sign in again to refresh the session.`)
