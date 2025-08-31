import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

const supabaseUrl = SUPABASE_URL;
const supabaseAnonKey = SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase URL and Anon Key are not set correctly in config.ts. Authentication will not work.");
    // In a real application, you might want to throw an error to halt execution
    // if the configuration is missing, to prevent unexpected behavior.
    // throw new Error("Supabase configuration is missing in config.ts");
}

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
