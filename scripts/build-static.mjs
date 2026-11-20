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
const htmlFiles=(await fs.readdir(root,{withFileTypes:true})).filter(entry=>entry.isFile()&&entry.name.endsWith('.html')).map(entry=>entry.name);
for(const name of htmlFiles)await fs.copyFile(path.join(root,name),path.join(out,name));
const directory=await fs.readFile(path.join(root,'glist.html'),'utf8');
const linkedPages=[...new Set([...directory.matchAll(/href=["'](?:\.\/)?(bname-\d+\.html)["']/g)].map(match=>match[1]))];
for(const name of linkedPages)await fs.access(path.join(out,name));
console.log('Published '+htmlFiles.length+' root HTML files; verified '+linkedPages.length+' linked BNAME pages.');
await fs.cp(path.join(root,'glist'),path.join(out,'glist'),{recursive:true});
console.log('Node '+process.versions.node+': static build PASS — '+rows+' rows / 31 pages');

// Stable alternative addresses for clients retaining earlier negative fetch results.
for(const name of htmlFiles){const m=/^bname-(\d+)\.html$/.exec(name);if(m)await fs.copyFile(path.join(root,name),path.join(out,'registry-page-'+m[1]+'.html'));}

const agentDirectory=directory.replace(/href=(["'])(?:\.\/)?bname-(\d+)\.html\1/g,(_,quote,page)=>'href='+quote+'registry-page-'+page+'.html'+quote);
await fs.writeFile(path.join(out,'glist.html'),agentDirectory);
await fs.writeFile(path.join(out,'registry.html'),agentDirectory);
const agentLinks=[...agentDirectory.matchAll(/href=["'](registry-page-\d+\.html)["']/g)].map(match=>match[1]);
if(agentLinks.length!==linkedPages.length)throw Error('REGISTRY_LINK_REWRITE_INCOMPLETE');
for(const name of agentLinks)await fs.access(path.join(out,name));
console.log('Verified '+agentLinks.length+' agent-readable registry links.');
