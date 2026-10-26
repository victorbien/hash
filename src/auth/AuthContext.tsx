import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { AuthContext } from './AuthContextValue'
import type { VolunteerApplication, VolunteerProfile } from './AuthContextValue'
import { supabase } from '../lib/supabase'

const SESSION_ACTIVITY_KEY = 'hash:last-authenticated-activity'
const DEFAULT_INACTIVITY_TIMEOUT_MINUTES = 60

function reportStorageUnavailable(setError: (message: string) => void) {
  queueMicrotask(() => setError('Browser storage is unavailable. The inactivity timeout may not synchronize between tabs.'))
}

async function fetchVolunteerData(userId: string) {
  if (!supabase) {
    return {
      profile: null,
      application: null,
      error: 'Volunteer sign-in is not configured.',
    }
  }
  const [profileResult, applicationResult] = await Promise.all([
    supabase.from('profiles').select('id, first_name, last_name, preferred_name, phone, preferred_contact_method, location, preferred_language').eq('id', userId).maybeSingle(),
    supabase.from('volunteer_applications').select('id, status, interests, availability, skills, experience, motivation, submitted_at').eq('user_id', userId).maybeSingle(),
  ])
  if (profileResult.error || applicationResult.error) {
    return {
      profile: null,
      application: null,
      error: 'We could not load your volunteer account. Please refresh or contact HASH for help.',
    }
  }
  return {
    profile: profileResult.data,
    application: applicationResult.data,
    error: null,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(Boolean(supabase))
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<VolunteerProfile | null>(null)
  const [application, setApplication] = useState<VolunteerApplication | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [inactivityTimeoutMinutes, setInactivityTimeoutMinutes] = useState(DEFAULT_INACTIVITY_TIMEOUT_MINUTES)
  const currentUserId = useRef<string | null>(null)

  useEffect(() => {
    if (!supabase) {
      return
    }

    let mounted = true
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (mounted) {
        const nextUserId = newSession?.user.id ?? null
        if (nextUserId !== currentUserId.current) {
          currentUserId.current = nextUserId
          if (event === 'SIGNED_IN' && nextUserId) {
            try {
              localStorage.setItem(SESSION_ACTIVITY_KEY, String(Date.now()))
            } catch {
              reportStorageUnavailable(setSessionError)
            }
          }
          setError(null)
          setSessionError(null)
          setProfile(null)
          setApplication(null)
          setLoadedUserId(null)
        }
        setSession(newSession)
      }
    })

    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!mounted) return
      if (sessionError) setError('Unable to restore your session. Please sign in again.')
      currentUserId.current = data.session?.user.id ?? null
      setSession(data.session)
      setAuthLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const user = session?.user ?? null
  const userId = user?.id ?? null

  useEffect(() => {
    const client = supabase
    if (!userId || !client) return

    let active = true
    async function loadTimeoutPreference(client: NonNullable<typeof supabase>) {
      try {
        const { data, error: preferenceError } = await client
          .from('general_preferences')
          .select('inactivity_timeout_minutes')
          .eq('id', 1)
          .maybeSingle()
        if (!active) return
        const configuredTimeout = data?.inactivity_timeout_minutes
        if (preferenceError || !Number.isInteger(configuredTimeout) || configuredTimeout < 1 || configuredTimeout > 1440) {
          setInactivityTimeoutMinutes(DEFAULT_INACTIVITY_TIMEOUT_MINUTES)
          setSessionError('Could not load the site-wide inactivity timeout. The 60-minute default is being used.')
          return
        }
        setInactivityTimeoutMinutes(configuredTimeout)
        setSessionError(null)
      } catch {
        if (active) {
          setInactivityTimeoutMinutes(DEFAULT_INACTIVITY_TIMEOUT_MINUTES)
          setSessionError('Could not load the site-wide inactivity timeout. The 60-minute default is being used.')
        }
      }
    }

    void loadTimeoutPreference(client)
    const refreshInterval = window.setInterval(() => void loadTimeoutPreference(client), 60_000)
    return () => {
      active = false
      window.clearInterval(refreshInterval)
    }
  }, [userId])

  useEffect(() => {
    const client = supabase
    if (!userId || !client) return
    const authenticatedClient: NonNullable<typeof supabase> = client

    let lastActivityAt = Date.now()
    let lastStorageWriteAt = 0
    let signingOut = false
    try {
      const storedActivity = Number(localStorage.getItem(SESSION_ACTIVITY_KEY))
      if (Number.isFinite(storedActivity) && storedActivity > 0) lastActivityAt = storedActivity
      else localStorage.setItem(SESSION_ACTIVITY_KEY, String(lastActivityAt))
    } catch {
      reportStorageUnavailable(setSessionError)
    }

    function signOutIfInactive(client: NonNullable<typeof supabase>) {
      if (signingOut || Date.now() - lastActivityAt < inactivityTimeoutMinutes * 60_000) return
      signingOut = true
      void client.auth.signOut()
        .then(({ error: signOutError }) => {
          if (signOutError) {
            signingOut = false
            setSessionError('Automatic sign-out failed. Please sign out manually and contact HASH if the problem continues.')
          }
        })
        .catch(() => {
          signingOut = false
          setSessionError('Automatic sign-out failed. Please sign out manually and contact HASH if the problem continues.')
        })
    }

    function recordActivity() {
      if (document.visibilityState === 'hidden') return
      if (Date.now() - lastActivityAt >= inactivityTimeoutMinutes * 60_000) {
        signOutIfInactive(authenticatedClient)
        return
      }
      lastActivityAt = Date.now()
      if (lastActivityAt - lastStorageWriteAt < 2000) return
      lastStorageWriteAt = lastActivityAt
      try {
        localStorage.setItem(SESSION_ACTIVITY_KEY, String(lastActivityAt))
      } catch {
        reportStorageUnavailable(setSessionError)
      }
    }

    function syncActivity(event: StorageEvent) {
      if (event.key !== SESSION_ACTIVITY_KEY || !event.newValue) return
      const sharedActivity = Number(event.newValue)
      if (Number.isFinite(sharedActivity) && sharedActivity > lastActivityAt) lastActivityAt = sharedActivity
    }

    const activityEvents: Array<keyof WindowEventMap> = ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart']
    activityEvents.forEach((eventName) => window.addEventListener(eventName, recordActivity, { passive: true }))
    window.addEventListener('storage', syncActivity)
    const handleFocus = () => signOutIfInactive(authenticatedClient)
    window.addEventListener('focus', handleFocus)

    const timeoutCheck = window.setInterval(() => signOutIfInactive(authenticatedClient), 1000)

    return () => {
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, recordActivity))
      window.removeEventListener('storage', syncActivity)
      window.removeEventListener('focus', handleFocus)
      window.clearInterval(timeoutCheck)
    }
  }, [userId, inactivityTimeoutMinutes])

  useEffect(() => {
    if (!user || authLoading || loadedUserId === user.id) return
    let active = true
    void fetchVolunteerData(user.id).then((result) => {
      if (!active) return
      setError(result.error)
      setProfile(result.profile)
      setApplication(result.application)
      setLoadedUserId(user.id)
    })
    return () => {
      active = false
    }
  }, [user, authLoading, loadedUserId])

  const refreshVolunteerData = useCallback(async () => {
    if (!user) return
    setError(null)
    const result = await fetchVolunteerData(user.id)
    if (currentUserId.current !== user.id) return
    setError(result.error)
    setProfile(result.profile)
    setApplication(result.application)
    setLoadedUserId(user.id)
  }, [user])

  const signOut = useCallback(async () => {
    if (!supabase) throw new Error('Volunteer sign-in is not configured.')
    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) throw signOutError
    setProfile(null)
    setApplication(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      profile,
      application,
      loading: authLoading || Boolean(user && loadedUserId !== user.id),
      configured: Boolean(supabase),
      error,
      sessionError,
      refreshVolunteerData,
      signOut,
    }),
    [user, profile, application, authLoading, loadedUserId, error, sessionError, refreshVolunteerData, signOut],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
      {sessionError && user && (
        <div className="fixed inset-x-4 top-4 z-[100] mx-auto max-w-xl rounded-xl border border-red-300 bg-white p-4 text-sm text-red-900 shadow-lg" role="alert">
          {sessionError}
        </div>
      )}
    </AuthContext.Provider>
  )
}
