import fs from 'node:fs/promises';
import path from 'node:path';
const audit='coverage-20261120-30363e';
export default async function handler(req,res){
 const u=new URL(req.url,'https://audit.invalid'),file=u.searchParams.get('file')||'index.html';
 if(!/^(?:index|channels|page-(?:[1-9]|[1-6][0-9]|7[0-8]))\.html$/.test(file)){res.statusCode=404;return res.end('Not found');}
 try{
  const body=await fs.readFile(path.join(process.cwd(),'public',audit,file));
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.setHeader('Cache-Control','private, no-store, max-age=0');
  res.setHeader('X-Coverage-Audit',audit);
  res.statusCode=200;
  console.info('SOURCE_ACCESS_AUDIT '+JSON.stringify({audit,file,at:new Date().toISOString(),method:req.method,ip:req.headers['x-forwarded-for']||null,userAgent:req.headers['user-agent']||null,bytes:body.length,status:200}));
  res.end(req.method==='HEAD'?undefined:body);
 }catch(e){res.statusCode=500;console.error('SOURCE_ACCESS_AUDIT_ERROR '+file+' '+e.code);res.end('Audit source unavailable');}
}
