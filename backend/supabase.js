import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('Supabase Key:', supabaseKey ? '✅ Set' : '❌ Missing');

// Validate that we have the required environment variables
if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERROR: Missing Supabase environment variables!');
    console.error('Please check your .env file in the backend folder');
    console.error('Required: SUPABASE_URL and SUPABASE_ANON_KEY');
    console.error('\nGet these from: Supabase Dashboard → Settings → API');
    
    // Don't create the client if credentials are missing
    // This will prevent the "supabaseUrl is required" error
    throw new Error('Supabase credentials are missing. Check your .env file');
}

// Only create the client if we have valid credentials
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
})