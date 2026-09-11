import { createClient } from '@supabase/supabase-js';

const supabaseurl = 'https://anznqeupucdjsddkubao.supabase.co';
const supabaseAnonkey ='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuem5xZXVwdWNkanNkZGt1YmFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxMjMzMjMsImV4cCI6MjEwMzY5OTMyM30.0wJXObxQupB2JRyh31ymbBXE_ibmyvhX1V_vRvDQX8U';
export const supabase =createClient (supabaseurl,supabaseAnonkey);
