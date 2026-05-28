globalThis.WebSocket = class {};

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rdmcyrmuftbzknxuekln.supabase.co';
const supabaseAnonKey = 'sb_publishable_F77pMs9TAEUlgnmnwtH19Q__Ju97Kvy';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('Testing verificar_rate_limit...');
  // Generate a random UUID
  const randomUuid = '00000000-0000-0000-0000-' + Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0');
  
  try {
    const { data, error } = await supabase.rpc('verificar_rate_limit', {
      p_usuario_id: randomUuid
    });
    if (error) {
      console.error('RPC Error:', error);
    } else {
      console.log('RPC Success for new random user:', data);
    }
  } catch (err) {
    console.error('Catch error:', err);
  }
}

run();
