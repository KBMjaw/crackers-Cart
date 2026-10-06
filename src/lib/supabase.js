import { createClient } from '@supabase/supabase-js'

// Public (anon) credentials – safe to ship in the browser. Row Level Security protects the data.
const url = import.meta.env.VITE_SUPABASE_URL || 'https://lkruzglnoxysehsacshb.supabase.co'
const key = import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrcnV6Z2xub3h5c2Voc2Fjc2hiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzMDM5MTAsImV4cCI6MjEwNjg3OTkxMH0.iRVa0MsyXZku8mzm0NPjG5MxJfaZraodw0D4wLlCEyI'

export const supabase = createClient(url, key)

// Admin usernames map to an internal email so admins can log in with a simple username.
export const ADMIN_EMAIL_DOMAIN = 'crackerscart.app'
export const usernameToEmail = (u) => {
  const v = (u || '').trim().toLowerCase()
  return v.includes('@') ? v : `${v}@${ADMIN_EMAIL_DOMAIN}`
}
