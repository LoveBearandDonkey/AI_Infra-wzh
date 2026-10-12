from pathlib import Path
import json,re,xml.etree.ElementTree as E
root=Path(__file__).parent
count=0
for name in ['index.html']:
 s=(root/name).read_text();data=json.loads(s.split('<script>const DATA=',1)[1].split(';\n// Offline reader:',1)[0])
 for p in data['chapters']:
  for st in p['states']:
   svg=E.fromstring('<svg xmlns="http://www.w3.org/2000/svg">'+data['catalog'][str(st['source'])]['defs']+st['body']+'</svg>')
   ids={el.get('id') for el in svg.iter() if el.get('id')}
   for el in svg.iter():
    for v in el.attrib.values():
     for target in re.findall(r'url\(#([^)]*)\)',v):assert target in ids,target
    if el.tag.endswith('}text'):
     x,y=float(el.get('x')),float(el.get('y'));assert 0<=x<=st['bounds']['w'] and 0<=y<=st['bounds']['h'],(name,p['id'],x,y)
   count+=1
p=root/'single-validation.json';v=json.loads(p.read_text());v['svgXmlAndTextAnchors']={'states':count,'result':'pass','scope':'XML, marker targets and text anchor coordinates; no font extents or overlap measurement'};p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
print(count,'SVG states passed')
