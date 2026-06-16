import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Критически важно для PWA и мобильных устройств:
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    
    // Используйте PKCE flow для мобильных устройств
    flowType: 'pkce',
    
    // Правильное хранилище для токенов
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    storageKey: 'supabase.auth.token',
  },
  // Дополнительные оптимизации для мобильных
  global: {
    headers: {
      'X-Client-Info': 'nextjs-pwa-mobile'
    }
  }
})