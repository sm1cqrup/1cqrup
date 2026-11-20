import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {gunzipSync} from 'node:zlib';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'public');
test('published directory preserves the index, verification and separate rules alongside both registry formats',async()=>{
 assert.deepEqual((await fs.readdir(out)).sort(),['bname.html','bname.txt','channels.html','google1316b7ceb6313ce6.html','index.html']);
 for(const file of ['index.html','google1316b7ceb6313ce6.html','channels.html'])assert.deepEqual(await fs.readFile(path.join(out,file)),await fs.readFile(path.join(root,file)));
});
test('HTML is static standard markup with one visible ul and all original BID/name values',async()=>{
 const html=await fs.readFile(path.join(out,'bname.html'),'utf8'),source=gunzipSync(await fs.readFile(path.join(root,'data/bname.tsv.gz'))).toString('utf8');
 assert(html.startsWith('<!DOCTYPE html>'));assert(html.includes('<html lang="az">'));assert(html.includes('<meta charset="UTF-8">'));assert(html.includes('<body>'));assert(html.endsWith('</html>\n'));
 assert.equal((html.match(/<ul>/g)||[]).length,1);assert(!/<script\b|<style\b|<iframe\b|<button\b|<table\b|<pre\b|\son\w+=|javascript:/i.test(html));
 const decode=s=>s.replace(/&(amp|lt|gt);/g,(_,e)=>({amp:'&',lt:'<',gt:'>'}[e]));
 const rows=[...html.matchAll(/<li>(\d+) — ([\s\S]*?)<\/li>/g)].map(m=>m[1]+'\t'+decode(m[2]));
 assert.equal(rows.length,154431);assert.equal('BID\tBNAME\n'+rows.join('\n')+'\n',source);
 assert.equal(rows[0],'1\tSEROTİN');assert.equal(rows[25411],'25412\tLEADİNG GROUP');assert.equal(rows.at(-1),'154431\tPROSPER TR PROJECT');
});
test('TXT preserves every record in plain UTF-8 tab-separated lines without HTML wrappers',async()=>{
 const raw=await fs.readFile(path.join(out,'bname.txt')),source=gunzipSync(await fs.readFile(path.join(root,'data/bname.tsv.gz')));
 assert.deepEqual(raw,source);const text=raw.toString('utf8');assert(!text.includes('<html'));assert(!text.includes('<pre'));assert(!text.includes('<li>'));assert.equal(text.split('\n').length,154433);
});
