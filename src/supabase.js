import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL || 'https://zytwublfgpoamtxroiwk.supabase.co', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_sb9InU5iIA4cQgyY-moigw_i9QTGN1J');
