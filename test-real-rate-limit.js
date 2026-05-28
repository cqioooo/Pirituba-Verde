globalThis.WebSocket = class {};

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rdmcyrmuftbzknxuekln.supabase.co';
const supabaseAnonKey = 'sb_publishable_F77pMs9TAEUlgnmnwtH19Q__Ju97Kvy';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('Testing verificar_rate_limit for a real newly created user...');
  const randomEmail = `realuser_${Date.now()}_${Math.floor(Math.random() * 1000)}@gmail.com`;
  const password = 'Password123!';
  
  try {
    // 1. Sign up
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: randomEmail,
      password: password,
      options: {
        data: {
          full_name: 'Test Real Rate Limit User',
          cpf_hash: 'dummydummydummydummydummydummydummydummydummydummydummy2',
          data_nascimento: '1990-01-01',
          bairro_residencia: 'Pirituba',
          rua: 'Rua de Teste 2',
          telefone: '11999999999',
        },
      },
    });

    if (signUpError) {
      console.error('SignUp Error:', signUpError);
      return;
    }

    const user = signUpData.user;
    if (!user) {
      console.error('SignUp succeeded but user is null (probably email confirmation is still active!)');
      return;
    }

    console.log('User created successfully! ID:', user.id);

    // 2. Call RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc('verificar_rate_limit', {
      p_usuario_id: user.id
    });

    if (rpcError) {
      console.error('RPC Error:', rpcError);
    } else {
      console.log('RPC Success for real new user:', rpcData);
    }
  } catch (err) {
    console.error('Catch error:', err);
  }
}

run();
