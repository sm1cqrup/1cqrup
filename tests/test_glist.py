"""Validate every visible record against the immutable original, not generated expectations."""
import hashlib,importlib.util,json,re,sys,unittest
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit
ROOT=Path(__file__).resolve().parents[1]
SOURCE=Path(sys.argv.pop(1)) if len(sys.argv)>1 else ROOT.parent/'glist-source.html'
class VisibleTables(HTMLParser):
 def __init__(self):super().__init__(convert_charrefs=True);self.dataset=None;self.cells=None;self.cell=None;self.values=[];self.links=[];self.scripts=0;self.rows={}
 def handle_starttag(self,t,a):
  a=dict(a)
  if t=='script':self.scripts+=1
  if t=='a':self.links.append(a.get('href',''))
  if t=='table':self.dataset=a.get('data-dataset')
  if t=='tr':self.cells=[]
  if t in ('td','th') and 'data-value-type' in a:self.cell=[];self.kind=a['data-value-type']
 def handle_data(self,d):
  if self.cell is not None:self.cell.append(d)
 def handle_endtag(self,t):
  if t in ('td','th') and self.cell is not None:
   value=''.join(self.cell);self.cells.append(None if self.kind=='null' else json.loads(value) if self.kind=='number' else value);self.cell=None
  if t=='tr' and self.cells:self.rows.setdefault(self.dataset,[]).append(self.cells)
  if t=='table':self.dataset=None
class OutputTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.source=SOURCE.read_bytes();cls.blocks={k:json.loads(v) for k,v in re.findall(r'<script\b[^>]*\bid="([^"]+)"[^>]*>(.*?)</script\s*>',cls.source.decode(),re.S)};cls.manifest=json.loads((ROOT/'glist/manifest.json').read_text());cls.all=[]
  for p in cls.manifest['pages']:
   parser=VisibleTables();parser.feed((ROOT/p['file']).read_text());cls.all.extend(dict(zip(['BID','BNAME'],r)) for r in parser.rows['BNAME'])
 def test_all_records_values_types_order_and_whitespace_preserved(self):self.assertEqual(self.all,self.blocks['bname-data']);self.assertEqual(len(self.all),154431)
 def test_no_missing_duplicate_or_invented_bid(self):self.assertEqual(len({r['BID'] for r in self.all}),len(self.all))
 def test_source_exact_git_blob(self):self.assertEqual(hashlib.sha1(b'blob '+str(len(self.source)).encode()+b'\0'+self.source).hexdigest(),'51fdb4385751301b8bc819978e052152ea2a367a')
 def test_pages_row_byte_bounds_and_hashes(self):
  self.assertEqual(len(self.manifest['pages']),31)
  for p in self.manifest['pages']:
   raw=(ROOT/p['file']).read_bytes();self.assertLessEqual(p['rows'],5000);self.assertLessEqual(len(raw),1_000_000);self.assertEqual(hashlib.sha256(raw).hexdigest(),p['sha256'])
 def test_no_scripts_and_every_relative_link_resolves(self):
  for f in [ROOT/'glist.html',*sorted((ROOT/'glist').glob('*.html'))]:
   parser=VisibleTables();parser.feed(f.read_text());self.assertEqual(parser.scripts,0)
   for href in parser.links:
    if not urlsplit(href).scheme:self.assertTrue((f.parent/href.split('#')[0]).is_file(),(str(f),href))
 def test_rules_and_examples_preserved_and_separate(self):
  for file,key,kind in [('channels.html','channels-data','CHANNELS'),('examples.html','examples-data','EXAMPLES'),('source-notes.html','source-date-cells','SOURCE_DATE_CELLS')]:
   parser=VisibleTables();parser.feed((ROOT/'glist'/file).read_text());src=self.blocks[key];self.assertEqual(parser.rows[kind],[[r[c] for c in src[0]] for r in src]);self.assertNotIn('BNAME',parser.rows)
 def test_sentinel_unicode_numeric_and_date_values(self):
  self.assertEqual(self.all[0],{'BID':1,'BNAME':'SEROTİN '});self.assertEqual(self.all[14121]['BNAME'],77);self.assertEqual(self.all[101216]['BNAME'],'12-May');self.assertEqual(self.all[130753]['BNAME'],'Sep-01');self.assertEqual(self.all[-1]['BID'],154431)
if __name__=='__main__':unittest.main()
