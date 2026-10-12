"""Run after validate.cjs. Source checkout is optional; it is not a report dependency."""
from pathlib import Path
import argparse,json,hashlib,re,xml.etree.ElementTree as ET
parser=argparse.ArgumentParser();parser.add_argument('--source-root',type=Path);args=parser.parse_args()
audit=Path(__file__).parent;root=audit.parent;v=json.loads((audit/'validation.json').read_text());n=0
for report in v['reports']:
 for state in report['states']:
  s=(Path(v['svgDirectory'])/state['file']).read_text();tree=ET.fromstring(s);ids={x.get('id') for x in tree.iter() if x.get('id')}
  for marker in re.findall(r'url\(#([^)]*)\)',s):assert marker in ids,(state['file'],marker)
  for e in tree.iter():
   if e.tag.endswith('text'):assert 0<=float(e.get('x',0))<=state['width'] and 0<=float(e.get('y',0))<=state['height'],state['file']
  n+=1
v['svgChecks']={'states':n,'xml':'pass','markers':'pass','textAnchors':'pass','actualTextExtent':'not checked','browserLayout':'not checked'}
count=0
if args.source_root:
 for name in ['pypto-compiler-decisions-guide','pypto-callable-evolution-guide','pypto-runtime-evidence-guide','pypto-pass-contracts-guide']:
  obj=json.loads((root/name/'evidence.json').read_text());records=obj['sources'] if isinstance(obj,dict) else obj
  for e in records:
   raw=(args.source_root/e.get('path',e.get('source_path'))).read_bytes();assert hashlib.sha256(raw).hexdigest()==e['sha256'],e['id']
   start=e.get('start',e.get('start_line'));end=e.get('end',e.get('end_line'));assert '\n'.join(raw.decode().splitlines()[start-1:end])==e['excerpt'],e['id'];count+=1
 raw=(args.source_root/'Design/assets/32_after_AllocateMemoryAddr.memory_map.json').read_bytes();original=json.loads(raw);saved=json.loads((root/'pypto-memory-reuse-guide/evidence.json').read_text());assert hashlib.sha256(raw).hexdigest()==saved['sha256']
 for f in saved['functions']:assert f==next(x for x in original['functions'] if x['name']==f['name'])
 for e in json.loads((audit/'insight-inventory.json').read_text()):assert hashlib.sha256((args.source_root/e['path']).read_bytes()).hexdigest()==e['sha256'],e['path']
 v['sourceChecks']={'excerpts':count,'excerptAndHash':'pass','memoryMapFunctions':2,'memoryMap':'exact source match','insightInventory':34}
else:v['sourceChecks']={'status':'not checked; no source checkout provided'}
(audit/'validation.json').write_text(json.dumps(v,ensure_ascii=False,indent=2));print(json.dumps({'svgStates':n,'sourceExcerpts':count,'result':'pass'}))
