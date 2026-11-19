#!/usr/bin/env python3
"""Build visible, paginated HTML from the original glist source. Standard library only."""
import argparse,hashlib,html,json,math,re
from pathlib import Path
MAX_ROWS=5000
MAX_BYTES=1_000_000
CSS='body{font:16px/1.5 system-ui,sans-serif;color:#14283e;max-width:1100px;margin:32px auto;padding:0 16px}a{color:#1458aa}nav{display:flex;gap:16px;flex-wrap:wrap;margin:20px 0}table{border-collapse:collapse;width:100%;margin:16px 0}th,td{border:1px solid #cbd5df;padding:7px 12px;text-align:left;vertical-align:top}thead{background:#edf3f9}.name{white-space:pre-wrap;overflow-wrap:anywhere}caption{font-weight:600;text-align:left;margin:8px 0}small{color:#526577}.pages{columns:3;min-width:0}@media(max-width:650px){.pages{columns:1}}'
def esc(x):return html.escape('' if x is None else str(x),quote=True)
def typename(x):return 'null' if x is None else 'number' if isinstance(x,(int,float)) and not isinstance(x,bool) else 'string'
def digest(rows):return hashlib.sha256(json.dumps(rows,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
def shell(title,body):return '<!doctype html>\n<html lang="az"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(title)+'</title><style>'+CSS+'</style></head><body>'+body+'</body></html>\n'
def table(rows,cols,caption,kind):
 h='<table data-dataset="'+kind+'"><caption>'+esc(caption)+'</caption><thead><tr>'+''.join('<th scope="col">'+esc(c)+'</th>' for c in cols)+'</tr></thead><tbody>\n'
 for row in rows:
  h+='<tr>'
  for i,c in enumerate(cols):
   tag='th' if i==0 else 'td';attrs=' scope="row"' if i==0 else ' class="name"';v=row[c];h+='<'+tag+attrs+' data-value-type="'+typename(v)+'">'+esc(v)+'</'+tag+'>'
  h+='</tr>\n'
 return h+'</tbody></table>'
def extract(raw):
 blocks={k:json.loads(v) for k,v in re.findall(r'<script\b[^>]*\bid="([^"]+)"[^>]*>(.*?)</script\s*>',raw.decode(),re.S)}
 for key in ['bname-data','channels-data','ylist-data','examples-data','source-date-cells']:
  if key not in blocks:raise ValueError('Missing dataset '+key)
 rows=blocks['bname-data']
 if len({r['BID'] for r in rows})!=len(rows):raise ValueError('Duplicate BID in source')
 return blocks

def build(source,out):
 raw=Path(source).read_bytes();b=extract(raw);rows=b['bname-data'];out=Path(out);(out/'glist').mkdir(parents=True,exist_ok=True)
 chunks=[];part=[]
 # Row and UTF-8 byte bounds both apply; the small final page is never padded.
 for row in rows:
  trial=part+[row]
  size=len(table(trial,['BID','BNAME'],'BNAME','BNAME').encode()) if len(part)%500==0 else 0
  if part and (len(part)>=MAX_ROWS or size>MAX_BYTES-50000):chunks.append(part);part=[]
  part.append(row)
 if part:chunks.append(part)
 # Exact final rendering bound is checked below; no silent truncation.
 total=len(chunks);pages=[]
 for n,chunk in enumerate(chunks,1):
  links='<nav aria-label="Səhifələmə"><a href="../glist.html">Bütün səhifələr</a><a href="channels.html">15 uyğunluq qaydası</a>'
  if n>1:links+='<a rel="prev" href="page-'+str(n-1).zfill(3)+'.html">Əvvəlki səhifə</a>'
  if n<total:links+='<a rel="next" href="page-'+str(n+1).zfill(3)+'.html">Növbəti səhifə</a>'
  links+='</nav>'
  title=f'BNAME — {n}/{total}'
  body=f'<h1>{title}</h1><p>Bu səhifə: {len(chunk)} qeyd. Bütün baza: {len(rows)} qeyd, {total} səhifə. BID intervalı: {esc(chunk[0]["BID"])}–{esc(chunk[-1]["BID"])}.</p><p>BNAME hüquqi adlar bazasıdır. Adlar və ID-lər mənbədəki kimi saxlanılıb. Tam bazanın yoxlanması üçün bütün səhifələr oxunmalıdır.</p>'+links+table(chunk,['BID','BNAME'],'BNAME — baza qeydləri','BNAME')+links
  content=shell(title,body);size=len(content.encode())
  if size>MAX_BYTES:raise ValueError(f'Page {n} exceeds byte bound: {size}')
  name=f'glist/page-{n:03}.html';(out/name).write_text(content,encoding='utf-8');pages.append({'file':name,'rows':len(chunk),'bytes':size,'firstBid':chunk[0]['BID'],'lastBid':chunk[-1]['BID'],'sha256':hashlib.sha256(content.encode()).hexdigest(),'dataSha256':digest(chunk)})
 rules=table(b['channels-data'],['CID','CNAME','CNOTE'],'CHANNELS — 15 uyğunluq qaydası','CHANNELS')
 (out/'glist/channels.html').write_text(shell('CHANNELS — uyğunluq qaydaları','<h1>Uyğunluq qaydaları</h1><a href="../glist.html">Baza səhifələri</a>'+rules),encoding='utf-8')
 examples=table(b['examples-data'],list(b['examples-data'][0]),'EXAMPLES — qayda nümunələri','EXAMPLES')
 (out/'glist/examples.html').write_text(shell('Qayda nümunələri','<h1>EXAMPLES — qayda nümunələri</h1><p>Bunlar qaydaları izah edən nümunələrdir; BNAME bazasının faktiki qeydləri ilə qarışdırılmamalıdır.</p><a href="../glist.html">Baza səhifələri</a>'+examples),encoding='utf-8')
 notes=table(b['source-date-cells'],['cell','value','numberFormat','text'],'İlkin faylda tarix formatlı xanalar','SOURCE_DATE_CELLS')
 (out/'glist/source-notes.html').write_text(shell('Mənbə qeydləri','<h1>Mənbə qeydləri</h1><p>Tarixə oxşar adların görünən mətnləri ilkin mənbədəki kimi qorunub; tarixdən ilkin şirkət adı təxmin edilməyib.</p><a href="../glist.html">Baza səhifələri</a>'+notes),encoding='utf-8')
 index='<h1>BNAME — şirkət adları bazası</h1>'+f'<p><strong>{len(rows)} qeyd · {total} səhifə · hər səhifədə maksimum {MAX_ROWS} qeyd.</strong></p><p>Adlar skriptsiz, görünən HTML cədvəllərindədir. Tam axtarış üçün aşağıdakı bütün səhifələr oxunmalıdır. Natamam oxunma uyğunluğun olmaması demək deyil.</p><nav><a href="glist/channels.html">CHANNELS — 15 qayda</a><a href="glist/examples.html">Qayda nümunələri</a><a href="glist/source-notes.html">Mənbə qeydləri</a></nav><h2>Baza səhifələri</h2><ol class="pages">'
 for page in pages:index+='<li><a href="'+page['file']+'">Səhifə '+str(len(re.findall('<li>',index))+1)+': BID '+esc(page['firstBid'])+'–'+esc(page['lastBid'])+'</a> — '+str(page['rows'])+' qeyd</li>'
 index+='</ol><h2>YLIST — mənbədəki sorğu nümunəsi</h2><p>Bu, yalnız giriş faylındakı nümunədir. Faktiki yoxlanılan ad sorğuda ayrıca verilir.</p>'+table(b['ylist-data'],['YID','YNAME'],'YLIST — nümunə','YLIST')
 (out/'glist.html').write_text(shell('BNAME — görünən və səhifələnmiş baza',index),encoding='utf-8')
 manifest={'sourceSha256':hashlib.sha256(raw).hexdigest(),'sourceGitBlobSha':hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest(),'records':len(rows),'dataSha256':digest(rows),'maxRows':MAX_ROWS,'maxBytes':MAX_BYTES,'pages':pages}
 (out/'glist/manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 return manifest
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('source');p.add_argument('output');a=p.parse_args();m=build(a.source,a.output);print(json.dumps({'records':m['records'],'pages':len(m['pages']),'minBytes':min(x['bytes'] for x in m['pages']),'maxBytes':max(x['bytes'] for x in m['pages'])}))
