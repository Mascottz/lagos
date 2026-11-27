import { createClient } from '@supabase/supabase-js';
import { createAuthStorage } from './authStorage';

const url = import.meta.env.VITE_SUPABASE_URL || 'https://zytwublfgpoamtxroiwk.supabase.co';
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_sb9InU5iIA4cQgyY-moigw_i9QTGN1J';
// Match Supabase's default key so existing remembered sessions continue to work.
const storageKey = `sb-${new URL(url).hostname.split('.')[0]}-auth-token`;
export const authStorage = createAuthStorage(storageKey, window.localStorage, window.sessionStorage);
export const supabase = createClient(url, key, { auth: { storageKey, storage: authStorage } });
