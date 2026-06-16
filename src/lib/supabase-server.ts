import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

// Серверный клиент без localStorage — безопасен для использования
// в серверных компонентах Next.js (app router async page components)
export const supabaseServer = createClient(supabaseUrl, supabaseKey)
