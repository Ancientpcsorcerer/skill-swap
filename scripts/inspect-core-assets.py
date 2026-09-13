from pathlib import Path
import hashlib, json, re, sys
sys.path.insert(0,'.local/media-tools')
from PIL import Image

def ordered(folder):
    return sorted((p for p in folder.iterdir() if p.suffix.lower() in ['.jpg','.jpeg','.png','.webp']),
        key=lambda p:[int(c) if c.isdigit() else c for c in re.split('(\\d+)',p.name)])

report=[]
for folder in sorted(Path('Cores').iterdir()):
    if not folder.is_dir(): continue
    files=ordered(folder)
    dimensions=set()
    for file in files:
        with Image.open(file) as image: dimensions.add(image.size)
    report.append({'folder':folder.name,'count':len(files),'dimensions':sorted(dimensions),
        'bytes':sum(p.stat().st_size for p in files),'first':files[0].as_posix(),'last':files[-1].as_posix(),
        'first_sha256':hashlib.sha256(files[0].read_bytes()).hexdigest(),
        'last_sha256':hashlib.sha256(files[-1].read_bytes()).hexdigest()})
duplicates={}
for suffix in ['start','back']:
    files=ordered(Path('Cores')/('Create_'+suffix))
    duplicates[suffix]=all(p.read_bytes()==(Path('Cores')/('Connect_'+suffix)/p.name).read_bytes() for p in files)
out=Path('docs/core-chain');out.mkdir(parents=True,exist_ok=True)
(out/'asset-inspection.json').write_text(json.dumps({'sequences':report,'create_duplicates_connect':duplicates},indent=2),encoding='utf-8')
print('All eight sequences inspected; Create duplicates:',duplicates)
