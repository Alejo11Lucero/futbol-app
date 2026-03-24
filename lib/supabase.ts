import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://mhqhkutbwgmsgymjlwqp.supabase.co";
const supabaseKey = "sb_publishable_25nUFAY6Nke6ELgiavWXxQ_m4wH_AZS";

export const supabase = createClient(supabaseUrl, supabaseKey);
