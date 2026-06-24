import { ref } from 'vue'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase'

export const session = ref<Session | null>(null)
export const user = ref<User | null>(null)
export const loading = ref(true)

export async function initAuth() {
  const { data } = await supabase.auth.getSession()
  session.value = data.session
  user.value = data.session?.user ?? null
  loading.value = false

  supabase.auth.onAuthStateChange((_event, newSession) => {
    session.value = newSession
    user.value = newSession?.user ?? null
  })
}

export async function signOut() {
  await supabase.auth.signOut()
}
