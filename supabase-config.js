/**
 * Livvo Supabase Configuration (client-side auth)
 *
 * SETUP:
 * 1. Go to https://supabase.com/dashboard → your project
 * 2. Authentication → Providers → enable "Email"
 * 3. Project Settings → API: use "Project URL" and "Publishable" key only.
 * 4. Paste below. Never put the Secret key in this file (browser-safe only).
 * 5. Authentication → URL Configuration:
 *    - Site URL: your live site (e.g. https://livvo.net)
 *    - Redirect URLs: add every page that receives auth redirects, e.g.:
 *      https://livvo.net/landlord-login.html
 *      https://livvo.net/landlord-confirm-email.html
 *      https://livvo.net/flatmate-login.html
 *      (and your Vercel preview URL if you use it)
 *    Without these, password reset and confirm emails may not be sent or may fail.
 */

const LIVVO_SUPABASE_URL = 'https://lzoiburvvbuhdbojwqfl.supabase.co';
/** Publishable key only – safe in browser when RLS is enabled. Do not use the secret key here. */
const LIVVO_SUPABASE_ANON_KEY = 'sb_publishable_7q1InD7Na81Q2sBDrXu7_Q_i79zY2YM';

function isSupabaseConfigured() {
  return typeof LIVVO_SUPABASE_URL === 'string' &&
    LIVVO_SUPABASE_URL.length > 0 &&
    typeof LIVVO_SUPABASE_ANON_KEY === 'string' &&
    LIVVO_SUPABASE_ANON_KEY.length > 0;
}

/** Only available after Supabase script is loaded and config is set. */
function getLivvoSupabase() {
  if (!isSupabaseConfigured() || typeof supabase === 'undefined') return null;
  if (!window._livvoSupabaseClient) {
    window._livvoSupabaseClient = supabase.createClient(LIVVO_SUPABASE_URL, LIVVO_SUPABASE_ANON_KEY);
  }
  return window._livvoSupabaseClient;
}
