import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const url=String(process.env.MAGINA_ADMIN_SUPABASE_URL||'').trim();
const key=String(process.env.MAGINA_ADMIN_SUPABASE_PUBLISHABLE_KEY||'').trim();

if(!url||!key){
  console.error('Missing MAGINA_ADMIN_SUPABASE_URL or MAGINA_ADMIN_SUPABASE_PUBLISHABLE_KEY');
  process.exit(1);
}

let parsed;
try{parsed=new URL(url);}catch{console.error('MAGINA_ADMIN_SUPABASE_URL is not a valid URL');process.exit(1);}
if(parsed.protocol!=='https:'){console.error('Supabase URL must use HTTPS');process.exit(1);}
if(!/^sb_publishable_|^eyJ/.test(key)){console.error('Expected a Supabase publishable/legacy anon key, never a secret/service-role key');process.exit(1);}
if(/^sb_secret_|service_role/i.test(key)){console.error('Refusing to write a secret/service-role key into browser config');process.exit(1);}

const body=`window.MAGINA_ADMIN_CONFIG = {\n  supabaseUrl: ${JSON.stringify(url)},\n  publishableKey: ${JSON.stringify(key)}\n};\n`;
await writeFile(resolve('apps/admin/config.js'),body,'utf8');
console.log('Admin browser config written safely.');
