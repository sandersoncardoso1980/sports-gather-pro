import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zjisngvnsmtzjnzvazvt.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqaXNuZ3Zuc210empuenZhenZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMzAwODAsImV4cCI6MjA2ODcwNjA4MH0.GxOW0RVNQcI-kDlcrPGNOIasPP8S05ROG7Zt8Avgf3U'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types based on existing Supabase structure
export interface Profile {
  id: string
  email: string
  name: string
  age: number
  city: string
  favorite_sport: string
  avatar_url?: string
  is_premium: boolean
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  name: string
  description: string
  location: string
  latitude: number
  longitude: number
  date: string
  time: string
  sport_type: string
  max_participants?: number
  banner_url?: string
  creator_id: string
  created_at: string
  updated_at: string
  profiles?: { name: string; avatar_url?: string; city?: string }
  event_participants?: { id: string }[]
}

export interface EventParticipant {
  id: string
  event_id: string
  user_id: string
  confirmed_at: string
  checked_in: boolean
  checked_in_at?: string
}

export interface EventPhoto {
  id: string
  event_id: string
  user_id: string
  photo_url: string
  created_at: string
}

export interface Advertisement {
  id: string
  title: string
  banner_url: string
  link_url?: string
  event_id?: string
  is_active: boolean
  display_order: number
  created_at: string
}

// Authentication helpers
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const signOut = async () => {
  await supabase.auth.signOut()
}