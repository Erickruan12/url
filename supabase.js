const SUPABASE_URL = "https://umpbbiiwqwpzvqpwlilh.supabase.co";
const SUPABASE_KEY = "sb_publishable_66G0Zo6lMoQKbMOOQfXt9w_qGAvNGri";


export const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);