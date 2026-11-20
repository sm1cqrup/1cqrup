import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),origin='https://1cqrup.vercel.app';
if(Number(process.versions.node.split('.')[0])!==26)throw Error('NODE_26_REQUIRED');
const manifest=JSON.parse(await fs.readFile(path.join(root,'glist/manifest.json'),'utf8'));
if(manifest.records!==154431||manifest.pages.length!==31)throw Error('INCOMPLETE_MANIFEST');
let rows=0;
for(const p of manifest.pages){const raw=await fs.readFile(path.join(root,p.file));const text=raw.toString('utf8');if(raw.length>1_000_000||p.rows>5000||/<script\b/i.test(text))throw Error('PAGE_LIMIT_OR_SCRIPT: '+p.file);const dataRows=(text.match(/<tr>/g)||[]).length-1;if(dataRows!==p.rows)throw Error('ROW_COUNT: '+p.file);rows+=dataRows;}
if(rows!==manifest.records)throw Error('ROW_TOTAL');
const out=path.join(root,'public');await fs.rm(out,{recursive:true,force:true});await fs.mkdir(out,{recursive:true});
const htmlFiles=(await fs.readdir(root,{withFileTypes:true})).filter(entry=>entry.isFile()&&entry.name.endsWith('.html')).map(entry=>entry.name);
// Copy verification files and unrelated HTML byte-for-byte.
for(const name of htmlFiles)await fs.copyFile(path.join(root,name),path.join(out,name));
await fs.cp(path.join(root,'glist'),path.join(out,'glist'),{recursive:true});
const directory=await fs.readFile(path.join(root,'glist.html'),'utf8');
const linkedPages=[...new Set([...directory.matchAll(/href=["'](?:\.\/)?(bname-\d+\.html)["']/g)].map(match=>match[1]))].sort((a,b)=>Number(a.match(/\d+/)[0])-Number(b.match(/\d+/)[0]));
if(linkedPages.length!==78||linkedPages.some((name,i)=>name!=='bname-'+(i+1)+'.html'))throw Error('INCOMPLETE_BNAME_DIRECTORY');
const escape=s=>s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function metadata(html,file,title,description){
 if(!/<head\b/i.test(html)||!/<\/head>/i.test(html)||!/<title>[\s\S]*?<\/title>/i.test(html))throw Error('MISSING_HEAD: '+file);
 let text=html.replace(/<title>[\s\S]*?<\/title>/i,'<title>'+escape(title)+'</title>');
 text=text.replace(/<link\b[^>]*\brel=["']canonical["'][^>]*>\s*/gi,'').replace(/<meta\b[^>]*\bname=["']description["'][^>]*>\s*/gi,'');
 const tags='<link rel="canonical" href="'+origin+'/'+file+'">\n<meta name="description" content="'+escape(description)+'">\n';
 return text.replace(/<\/head>/i,tags+'</head>');
}
function canonicalLinks(html){return html.replace(/href=(["'])(?:\.\/)?bname-(\d+)\.html\1/g,(_,q,n)=>'href='+q+'/registry-page-'+n+'.html'+q).replace(/href=(["'])(glist|channels)\.html\1/g,(_,q,n)=>'href='+q+'/'+n+'.html'+q);}
const pageUrl=n=>'/registry-page-'+n+'.html';
function navigation(current){
 const positions=[...new Set([1,78,...Array.from({length:5},(_,i)=>current+i-2).filter(n=>n>=1&&n<=78)])].sort((a,b)=>a-b);
 let previous=0;const items=positions.map(n=>{const gap=previous&&n>previous+1?' <span aria-hidden="true">…</span> ':'';previous=n;return gap+(n===current?'<strong aria-current="page">'+n+'</strong>':'<a href="'+pageUrl(n)+'">'+n+'</a>');});
 if(current>1)items.unshift('<a rel="prev" href="'+pageUrl(current-1)+'">Əvvəlki</a>');
 if(current<78)items.push('<a rel="next" href="'+pageUrl(current+1)+'">Növbəti</a>');
 return '<nav aria-label="Səhifələmə">'+items.join(' · ')+'</nav>\n<p><a href="/glist.html">Bütün səhifələr</a> | <a href="/channels.html">Qaydalar</a></p>';
}
let publishedRows=0;
for(const [i,name] of linkedPages.entries()){
 const n=i+1,raw=await fs.readFile(path.join(root,name),'utf8'),data=[...raw.matchAll(/<tr><td>(\d+)<\/td><td>[\s\S]*?<\/td><\/tr>/g)];
 const expected=n===78?431:2000;
 if(data.length!==expected||data.some((m,j)=>Number(m[1])!==publishedRows+j+1)||Buffer.byteLength(raw)>1_000_000||/<script\b/i.test(raw))throw Error('BNAME_CONTENT: '+name);
 const first=publishedRows+1,last=publishedRows+data.length;publishedRows=last;
 let text=canonicalLinks(raw),nav=navigation(n);
 if(!/<p>BID[\s\S]*?<\/p>/.test(text))throw Error('MISSING_PAGE_SUMMARY: '+name);
 text=text.replace(/<p>BID[\s\S]*?<\/p>/,'<p>BID '+first+'–'+last+', '+data.length+' ad.</p>\n'+nav).replace(/<\/body>/i,nav+'\n</body>');
 text=metadata(text,'registry-page-'+n+'.html','BNAME reyestri — Səhifə '+n+' / 78','BNAME reyestri, səhifə '+n+' / 78. BID '+first+'–'+last+'; '+data.length+' baza adı.');
 await fs.writeFile(path.join(out,'registry-page-'+n+'.html'),text);
 // Legacy aliases share the canonical content; Vercel redirects them permanently.
 await fs.writeFile(path.join(out,name),text);
}
if(publishedRows!==154431)throw Error('BNAME_ROW_TOTAL');
const agentDirectory=metadata(canonicalLinks(directory),'glist.html','BNAME reyestri — 154431 ad, 78 səhifə','154431 baza adının 78 səhifədən ibarət reyestri və uyğunluq qaydalarına keçid.').replace(/<\/body>/i,'<p><a href="/sitemap.xml">XML sayt xəritəsi</a></p>\n</body>');
await fs.writeFile(path.join(out,'glist.html'),agentDirectory);
await fs.writeFile(path.join(out,'registry.html'),agentDirectory);
const rules=await fs.readFile(path.join(root,'channels.html'),'utf8');
await fs.writeFile(path.join(out,'channels.html'),metadata(rules,'channels.html','Adların uyğunluğu qaydaları — CHANNELS','Baza adlarının müqayisəsi üçün CHANNELS qaydaları.'));
const urls=['glist.html','channels.html',...linkedPages.map((_,i)=>'registry-page-'+(i+1)+'.html')];
await fs.writeFile(path.join(out,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+urls.map(file=>'  <url><loc>'+origin+'/'+file+'</loc></url>').join('\n')+'\n</urlset>\n');
let robots='User-agent: *\nAllow: /\n';try{robots=await fs.readFile(path.join(root,'robots.txt'),'utf8');}catch(e){if(e.code!=='ENOENT')throw e;}
if(!robots.includes(origin+'/sitemap.xml'))robots+='\nSitemap: '+origin+'/sitemap.xml\n';
await fs.writeFile(path.join(out,'robots.txt'),robots);
console.log('Node '+process.versions.node+': static build PASS — '+publishedRows+' unchanged rows / 78 canonical registry pages; '+urls.length+' sitemap URLs.');
