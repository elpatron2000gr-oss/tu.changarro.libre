import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://infwelatvlysiyzffskv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluZndlbGF0dmx5c2l5emZmc2t2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwODA1NTYsImV4cCI6MjA5NzY1NjU1Nn0.-toknw8YlevnrMf-19_Wh4m1lc0HppRW-bJyGt7VXlQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
