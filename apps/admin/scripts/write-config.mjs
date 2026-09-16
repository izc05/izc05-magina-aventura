import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { assertSafeBrowserSupabaseKey } from '../src/core/config-guard.mjs';

const url=String(process.env.MAGINA_ADMIN_SUPABASE_URL||'').trim();
const rawKey=String(process.env.MAGINA_ADMIN_SUPABASE_PUBLISHABLE_KEY||'').trim();

if(!url||!rawKey){
  console.error('Missing MAGINA_ADMIN_SUPABASE_URL or MAGINA_ADMIN_SUPABASE_PUBLISHABLE_KEY');
  process.exit(1);
}

let parsed;
try{parsed=new URL(url);}catch{console.error('MAGINA_ADMIN_SUPABASE_URL is not a valid URL');process.exit(1);}
if(parsed.protocol!=='https:'){console.error('Supabase URL must use HTTPS');process.exit(1);}

let key;
try{key=assertSafeBrowserSupabaseKey(rawKey);}catch(error){console.error(error.message);process.exit(1);}

const body=`window.MAGINA_ADMIN_CONFIG = {\n  supabaseUrl: ${JSON.stringify(url)},\n  publishableKey: ${JSON.stringify(key)}\n};\n`;
await writeFile(resolve('apps/admin/config.js'),body,'utf8');
console.log('Admin browser config written safely.');
