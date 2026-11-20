import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'public'),origin='https://1cqrup.vercel.app';
const read=(base,file)=>fs.readFile(path.join(base,file),'utf8');
const table=html=>html.match(/<table\b[\s\S]*?<\/table>/i)?.[0];
test('all 154431 registry rows remain byte-identical and every canonical page has unique metadata',async()=>{
 let rows=0;const titles=new Set(),descriptions=new Set();
 for(let n=1;n<=78;n++){
  const file='registry-page-'+n+'.html',html=await read(out,file),source=await read(root,'bname-'+n+'.html');
  assert.equal(table(html),table(source),file+' table unchanged');
  const ids=[...html.matchAll(/<tr><td>(\d+)<\/td>/g)].map(m=>Number(m[1]));
  assert.equal(ids.length,n===78?431:2000);assert.equal(ids[0],rows+1);assert.equal(ids.at(-1),rows+ids.length);rows+=ids.length;
  const canon=[...html.matchAll(/<link rel="canonical" href="([^"]+)">/g)];assert.equal(canon.length,1);assert.equal(canon[0][1],origin+'/'+file);
  titles.add(html.match(/<title>(.*?)<\/title>/)[1]);descriptions.add(html.match(/<meta name="description" content="([^"]+)">/)[1]);
  assert(!/href=["'][^"']*bname-/.test(html));assert(!/<script\b|<button\b|href=["']javascript:/i.test(html));
  assert.equal(await read(out,'bname-'+n+'.html'),html);
 }
 assert.equal(rows,154431);assert.equal(titles.size,78);assert.equal(descriptions.size,78);
});
test('following the HTML next links visits all 78 pages; first/previous/last links and compact controls are valid',async()=>{
 const seen=new Set();let n=1;
 while(n){assert(!seen.has(n));seen.add(n);const html=await read(out,'registry-page-'+n+'.html');
  const nav=html.match(/<nav aria-label="Səhifələmə">([\s\S]*?)<\/nav>/)[1];
  const next=nav.match(/<a rel="next" href="\/registry-page-(\d+)\.html">/),previous=nav.match(/<a rel="prev" href="\/registry-page-(\d+)\.html">/);
  assert.equal(next?Number(next[1]):null,n<78?n+1:null);assert.equal(previous?Number(previous[1]):null,n>1?n-1:null);
  assert(nav.includes('aria-current="page">'+n+'</strong>'));
  const numbers=[...nav.matchAll(/<a href="\/registry-page-(\d+)\.html">\d+<\/a>/g)];assert(numbers.length<=6);
  for(const m of nav.matchAll(/href="([^"]+)"/g)){const url=new URL(m[1],origin);await fs.access(path.join(out,url.pathname));}
  n=next?Number(next[1]):null;
 }
 assert.equal(seen.size,78);
});
test('directory and sitemap enumerate every canonical registry page and robots advertises the sitemap',async()=>{
 const html=await read(out,'glist.html'),xml=await read(out,'sitemap.xml'),robots=await read(out,'robots.txt');
 const indexPages=[...html.matchAll(/href="\/registry-page-(\d+)\.html"/g)].map(m=>Number(m[1]));assert.deepEqual(indexPages,Array.from({length:78},(_,i)=>i+1));
 const urls=[...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);assert.equal(urls.length,80);assert.equal(new Set(urls).size,80);assert(!xml.includes('bname-'));assert(robots.includes('Sitemap: '+origin+'/sitemap.xml'));
 for(const url of urls){const u=new URL(url);assert.equal(u.origin,origin);await fs.access(path.join(out,u.pathname));const page=await read(out,u.pathname);assert(page.includes('<link rel="canonical" href="'+url+'">'));}
});
test('Google ownership verification and unrelated source HTML remain byte-identical; aliases use permanent redirects',async()=>{
 const files=(await fs.readdir(root)).filter(n=>/^google[^/]+\.html$/.test(n)||n==='index.html');
 for(const file of files)assert.deepEqual(await fs.readFile(path.join(out,file)),await fs.readFile(path.join(root,file)),file);
 const config=JSON.parse(await read(root,'vercel.json'));
 assert.deepEqual(config.redirects,[{source:'/bname-:page(\\d+).html',destination:'/registry-page-:page.html',permanent:true},{source:'/registry.html',destination:'/glist.html',permanent:true}]);
 const rules=await read(root,'channels.html'),published=await read(out,'channels.html');assert.equal(rules.match(/<body>[\s\S]*?<\/body>/i)[0],published.match(/<body>[\s\S]*?<\/body>/i)[0]);
});
