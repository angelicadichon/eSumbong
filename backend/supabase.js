// backend connection to the database (supabase)
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://iyyusjkkdpkklyhjuofn.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5eXVzamtrZHBra2x5aGp1b2ZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MzgyOTgsImV4cCI6MjA3NzIxNDI5OH0.PcsYavAti6YpZN2yqpIrEC9N2-FBBqPcexazFpJxpnI";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Supabase URL: Missing");
  console.error("Supabase Key: Missing");
} else {
  console.log("Supabase connection details loaded");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
