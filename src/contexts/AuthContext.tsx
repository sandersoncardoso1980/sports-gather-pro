import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, Profile } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: any }>
  signUp: (email: string, password: string, userData: Partial<Profile>) => Promise<{ error?: any }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error?: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      // First try to get from auth.users metadata, fallback to profiles table
      const { data: userData } = await supabase.auth.getUser()
      if (userData.user) {
        // Create a mock profile from auth data
        const mockProfile: Profile = {
          id: userData.user.id,
          email: userData.user.email || '',
          name: userData.user.user_metadata?.name || userData.user.email?.split('@')[0] || 'Usuário',
          age: userData.user.user_metadata?.age || 25,
          city: userData.user.user_metadata?.city || 'São Paulo',
          favorite_sport: userData.user.user_metadata?.favorite_sport || 'futebol',
          avatar_url: userData.user.user_metadata?.avatar_url,
          is_premium: userData.user.user_metadata?.is_premium || false,
          created_at: userData.user.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        setProfile(mockProfile)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (email: string, password: string, userData: Partial<Profile>) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          ...userData,
          is_premium: false
        }
      }
    })

    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: 'No user logged in' }

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          ...updates,
          updated_at: new Date().toISOString()
        }
      })

      if (!error) {
        setProfile(prev => prev ? { ...prev, ...updates } : null)
        toast({
          title: "Perfil atualizado",
          description: "Suas informações foram salvas com sucesso.",
        })
      }

      return { error }
    } catch (error) {
      return { error }
    }
  }

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}