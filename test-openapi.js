async function run() {
  const url = 'https://rdmcyrmuftbzknxuekln.supabase.co/rest/v1/';
  const anonKey = 'sb_publishable_F77pMs9TAEUlgnmnwtH19Q__Ju97Kvy';
  
  console.log('Fetching OpenAPI schema from Supabase...');
  try {
    const res = await fetch(url, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      }
    });
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const schema = await res.json();
    
    console.log('\n--- TABLES ---');
    const tables = Object.keys(schema.definitions || {});
    console.log(tables);
    
    if (schema.definitions && schema.definitions.ocorrencias) {
      console.log('\n--- OCORRENCIAS COLUMNS ---');
      const properties = schema.definitions.ocorrencias.properties || {};
      for (const [colName, colDef] of Object.entries(properties)) {
        console.log(`- ${colName}: ${colDef.type} (${colDef.format || ''})`);
      }
    } else {
      console.log('ocorrencias definition not found in schema');
    }
    
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

run();
