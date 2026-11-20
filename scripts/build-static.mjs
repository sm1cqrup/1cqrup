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


// Isolated source-access audit: original registry/rule pages remain unchanged.
const coverageManifest={"directory":"coverage-20261120-30363e","pages":[{"page":1,"token":"C5C38B9D39DE"},{"page":2,"token":"60BD42E71B4C"},{"page":3,"token":"19321858431D"},{"page":4,"token":"88E1DFE19425"},{"page":5,"token":"B9F19F278A62"},{"page":6,"token":"C3C1F3F483BE"},{"page":7,"token":"63B119296736"},{"page":8,"token":"3FF2E0954781"},{"page":9,"token":"1AC565BF7446"},{"page":10,"token":"ED7E0447BFC1"},{"page":11,"token":"86B08C218F9B"},{"page":12,"token":"872D51570D57"},{"page":13,"token":"2F699B52CE1B"},{"page":14,"token":"8851D98AFA18"},{"page":15,"token":"1EB0D3737045"},{"page":16,"token":"BC0BB548DE75"},{"page":17,"token":"4A3D97973FC8"},{"page":18,"token":"5C75A47A69EB"},{"page":19,"token":"E879CC0EA691"},{"page":20,"token":"58568C0E908B"},{"page":21,"token":"98C0356AFE7B"},{"page":22,"token":"4F42D51B5651"},{"page":23,"token":"0965592E8458"},{"page":24,"token":"C9B1DFDA5168"},{"page":25,"token":"FB9705A11064"},{"page":26,"token":"9729C5C7B615"},{"page":27,"token":"7A7B664160F9"},{"page":28,"token":"EBF9A6B8C0DC"},{"page":29,"token":"AC0528F5E57A"},{"page":30,"token":"39854FD4BBB0"},{"page":31,"token":"7F3B764D3352"},{"page":32,"token":"A49E3CD21941"},{"page":33,"token":"FCF6390358DA"},{"page":34,"token":"85E4D1EF7FD5"},{"page":35,"token":"D7AEBA803B58"},{"page":36,"token":"346A9433AE07"},{"page":37,"token":"9F683F3633B6"},{"page":38,"token":"DBDF2D66C2D5"},{"page":39,"token":"421EEDD47AA8"},{"page":40,"token":"4B001636D48F"},{"page":41,"token":"51DE117CBBCB"},{"page":42,"token":"53B0F7B04EC4"},{"page":43,"token":"2ED33DC68AAE"},{"page":44,"token":"FC2F8E50118A"},{"page":45,"token":"D6107112E2F6"},{"page":46,"token":"D84BD131CFC8"},{"page":47,"token":"AA7347120AA8"},{"page":48,"token":"077EB84626AC"},{"page":49,"token":"A83FCB3C688D"},{"page":50,"token":"4229540C2798"},{"page":51,"token":"5DCE2D77A77B"},{"page":52,"token":"870CF0708953"},{"page":53,"token":"8BDCC08F0D31"},{"page":54,"token":"5E06846D1058"},{"page":55,"token":"BE844162A377"},{"page":56,"token":"949A72885166"},{"page":57,"token":"4C47815510B6"},{"page":58,"token":"4816A294A69D"},{"page":59,"token":"9D790E1A7B29"},{"page":60,"token":"EF5AF8E5E34E"},{"page":61,"token":"80019A1C9395"},{"page":62,"token":"31BBB2CE2D7A"},{"page":63,"token":"341E54F1EAC7"},{"page":64,"token":"B30D85AD86E5"},{"page":65,"token":"DDEEFC80AABA"},{"page":66,"token":"DA8F82150B81"},{"page":67,"token":"EB0E2C988359"},{"page":68,"token":"B58394887A61"},{"page":69,"token":"7721C51C9D36"},{"page":70,"token":"E8D43A61B5AC"},{"page":71,"token":"312177B38047"},{"page":72,"token":"66D27BF83870"},{"page":73,"token":"D399400613F6"},{"page":74,"token":"C5E25EE78523"},{"page":75,"token":"D30B064C2428"},{"page":76,"token":"57508E08C70A"},{"page":77,"token":"90EEDF51AC84"},{"page":78,"token":"96A7DF777815"}],"channels":"1C1E747EFF6B"};
const coverageOut=path.join(out,coverageManifest.directory);
await fs.mkdir(coverageOut,{recursive:true});
let coverageRows=0;
for(const page of coverageManifest.pages){
  const original=await fs.readFile(path.join(root,'bname-'+page.page+'.html'),'utf8');
  const count=[...original.matchAll(/<tr\b/gi)].length-1;
  if(count!==(page.page===78?431:2000))throw Error('AUDIT_ROW_COUNT:'+page.page);
  coverageRows+=count;
  const marker='<footer><p>Coverage control — PAGE '+page.page+' — AUDIT_TOKEN: '+page.token+'</p></footer>';
  if(!/<\/body>/i.test(original))throw Error('AUDIT_NO_BODY');
  await fs.writeFile(path.join(coverageOut,'page-'+page.page+'.html'),original.replace(/<\/body>/i,marker+'</body>'));
}
if(coverageRows!==154431)throw Error('AUDIT_TOTAL');
const rulesOriginal=await fs.readFile(path.join(root,'channels.html'),'utf8');
await fs.writeFile(path.join(coverageOut,'channels.html'),rulesOriginal.replace(/<\/body>/i,'<footer><p>Coverage control — CHANNELS — AUDIT_TOKEN: '+coverageManifest.channels+'</p></footer></body>'));
const coverageLinks=coverageManifest.pages.map(p=>'<li><a href="page-'+p.page+'.html">BNAME page '+p.page+'</a></li>').join('\n');
await fs.writeFile(path.join(coverageOut,'index.html'),'<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Registry source access audit</title></head><body><h1>Registry source access audit</h1><p>78 full registry pages, 154431 original rows. Every linked page has its own control at the bottom. The controls are absent from this index.</p><ol>'+coverageLinks+'</ol><p><a href="channels.html">24 CHANNELS rules</a></p></body></html>');
console.log('Source-access audit: '+coverageManifest.pages.length+' full pages / '+coverageRows+' unchanged rows; no control tokens in index.');
