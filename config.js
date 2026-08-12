// Configuration Supabase — ces valeurs sont "publiques" par design
// (protégées par les règles de sécurité RLS côté base de données).
const SUPABASE_URL = 'https://sirrtahszqrsazfaascj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_RCIDsTCKwxFEFgHhYiNJsQ_kENQg_fb';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
