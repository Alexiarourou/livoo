/**
 * Livvo Supabase Configuration (Landlord auth)
 *
 * SETUP:
 * 1. Go to https://supabase.com/dashboard and create a project
 * 2. Authentication → Providers → enable "Email"
 * 3. Project Settings → API: copy "Project URL" and "anon public" key
 * 4. Paste below.
 * 5. Authentication → URL Configuration: add your site URL and redirect URL
 *    (e.g. https://yoursite.com/landlord-confirm-email.html) so email verification links work.
 */

const LIVVO_SUPABASE_URL = 'https://lzoiburvvbuhdbojwqfl.supabase.co';
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
