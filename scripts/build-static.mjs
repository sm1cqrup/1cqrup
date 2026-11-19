import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
if(Number(process.versions.node.split('.')[0])!==26)throw Error('NODE_26_REQUIRED');
const manifest=JSON.parse(await fs.readFile(path.join(root,'glist/manifest.json'),'utf8'));
if(manifest.records!==154431||manifest.pages.length!==31)throw Error('INCOMPLETE_MANIFEST');
let rows=0;
for(const p of manifest.pages){const raw=await fs.readFile(path.join(root,p.file));const text=raw.toString('utf8');if(raw.length>1_000_000||p.rows>5000||/<script\b/i.test(text))throw Error('PAGE_LIMIT_OR_SCRIPT: '+p.file);const dataRows=(text.match(/<tr>/g)||[]).length-1;if(dataRows!==p.rows)throw Error('ROW_COUNT: '+p.file);rows+=dataRows;}
if(rows!==manifest.records)throw Error('ROW_TOTAL');
const out=path.join(root,'public');await fs.rm(out,{recursive:true,force:true});await fs.mkdir(out,{recursive:true});
for(const name of ['index.html','glist.html','channels.html']){
  try{
    await fs.copyFile(path.join(root,name),path.join(out,name));
  }catch(e){
    if(e.code==='ENOENT'&&name==='index.html')continue;
    throw e;
  }
}
await fs.cp(path.join(root,'glist'),path.join(out,'glist'),{recursive:true});
console.log('Node '+process.versions.node+': static build PASS — '+rows+' rows / 31 pages');
