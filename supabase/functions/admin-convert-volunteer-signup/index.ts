import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('SITE_URL') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

function respond(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders })
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return respond(405, { success: false, error: 'Method not allowed.' })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const siteUrl = Deno.env.get('SITE_URL')?.replace(/\/+$/, '')
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !siteUrl) {
    console.error('Volunteer signup conversion requires Supabase and SITE_URL configuration.')
    return respond(500, { success: false, error: 'The volunteer account invitation service is not configured.' })
  }

  const authorization = request.headers.get('Authorization')
  const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!accessToken) return respond(401, { success: false, error: 'Sign in as a HASH Administrator to continue.' })

  const authClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: authData, error: authError } = await authClient.auth.getUser(accessToken)
  if (authError || !authData.user) return respond(401, { success: false, error: 'Your Administrator session is invalid or expired. Sign in again.' })
  if (authData.user.app_metadata?.role !== 'admin') {
    return respond(403, { success: false, error: 'Only a HASH Administrator can convert volunteer sign-ups.' })
  }

  let payload: { signup_id?: unknown; application_communications_acknowledged?: unknown }
  try {
    payload = await request.json()
  } catch {
    return respond(400, { success: false, error: 'The conversion request is invalid.' })
  }
  if (typeof payload.signup_id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(payload.signup_id)) {
    return respond(400, { success: false, error: 'Select a valid volunteer sign-up.' })
  }
  if (payload.application_communications_acknowledged !== true) {
    return respond(400, { success: false, error: 'Confirm the application communications agreement before sending an invitation.' })
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const now = new Date().toISOString()
  const { data: signup, error: signupError } = await adminClient
    .from('volunteer_interest_signups')
    .select('id, first_name, last_name, pronouns, contact_number, email, preferred_contact_method, policies_acknowledged, policies_acknowledged_at, privacy_notice_url, code_of_conduct_url, expires_at')
    .eq('id', payload.signup_id)
    .is('converted_at', null)
    .is('conversion_started_at', null)
    .gt('expires_at', now)
    .maybeSingle()
  if (signupError) {
    console.error('Could not load volunteer sign-up for conversion:', signupError.message)
    return respond(500, { success: false, error: 'The volunteer sign-up could not be loaded.' })
  }
  if (!signup) return respond(404, { success: false, error: 'This sign-up has expired, was already converted, or is being processed.' })
  if (!signup.policies_acknowledged) return respond(400, { success: false, error: 'The person must accept the Privacy Notice and Code of Conduct before conversion.' })

  const { data: claim, error: claimError } = await adminClient
    .from('volunteer_interest_signups')
    .update({ conversion_started_at: now, conversion_started_by: authData.user.id })
    .eq('id', signup.id)
    .is('converted_at', null)
    .is('conversion_started_at', null)
    .gt('expires_at', now)
    .select('id')
    .maybeSingle()
  if (claimError || !claim) {
    if (claimError) console.error('Could not reserve volunteer sign-up conversion:', claimError.message)
    return respond(409, { success: false, error: 'This sign-up is already being processed. Refresh the list and check its account before retrying.' })
  }

  const consentAcknowledgements = {
    code_of_conduct: true,
    code_of_conduct_url: signup.code_of_conduct_url,
    code_of_conduct_acknowledged_at: signup.policies_acknowledged_at,
    privacy_notice: true,
    privacy_notice_url: signup.privacy_notice_url,
    privacy_notice_acknowledged_at: signup.policies_acknowledged_at,
    application_communications: true,
    application_communications_acknowledged_at: now,
    application_communications_acknowledged_by: authData.user.id,
  }
  const { data: invitation, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(signup.email, {
    data: {
      account_type: 'volunteer',
      first_name: signup.first_name,
      last_name: signup.last_name,
      pronouns: signup.pronouns,
      phone: signup.contact_number,
      preferred_contact_method: signup.preferred_contact_method,
      volunteer_interest_signup_id: signup.id,
      consent_acknowledgements: consentAcknowledgements,
    },
    redirectTo: `${siteUrl}/volunteer/reset-password`,
  })
  if (inviteError || !invitation.user) {
    const { error: releaseError } = await adminClient
      .from('volunteer_interest_signups')
      .update({ conversion_started_at: null, conversion_started_by: null })
      .eq('id', signup.id)
      .is('converted_at', null)
    if (releaseError) console.error('Could not release volunteer sign-up after invitation failure:', releaseError.message)
    console.error('Could not invite volunteer sign-up:', inviteError?.message ?? 'No user returned')
    return respond(409, { success: false, error: 'The invitation could not be sent. Check whether this email already has an account and review Supabase Auth email settings.' })
  }

  const { error: completeError } = await adminClient
    .from('volunteer_interest_signups')
    .update({
      converted_at: new Date().toISOString(),
      converted_user_id: invitation.user.id,
      application_communications_acknowledged_at: now,
      application_communications_acknowledged_by: authData.user.id,
    })
    .eq('id', signup.id)
    .is('converted_at', null)
  if (completeError) {
    console.error('Invitation sent but sign-up conversion completion failed:', completeError.message)
    return respond(500, { success: false, error: 'The invitation was sent, but conversion could not be recorded. Do not retry; contact the database administrator to reconcile the sign-up.' })
  }

  return respond(200, { success: true })
})
