from pathlib import Path
import hashlib, json, math, sys
sys.path.insert(0,'.local/media-tools')
import numpy as np
from PIL import Image
root=Path('Cores')
samples=[]
for progress in [0,.25,.5,.56,.58,.75,1]:
    item={'progress':progress}
    for folder,direction,position in [('Connect_start','forward',progress),('Connect_back','reverse',1-progress)]:
        index=math.floor(position*299+.5)
        p=root/folder/f'ezgif-frame-{index+1:03}.jpg'
        with Image.open(p) as im:
            a=np.asarray(im)
            rgb=a[50:200,50:300,:3].mean(axis=(0,1))
            item[direction]={'path':p.as_posix(),'index':index,'dimensions':list(im.size),
                'background_mean_rgb':rgb.round(3).tolist(),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
    item['reverse_minus_forward_rgb']=(np.array(item['reverse']['background_mean_rgb'])-item['forward']['background_mean_rgb']).round(3).tolist()
    samples.append(item)
result={'method':'Mean original JPEG RGB in x=50..299, y=50..199 (unobstructed background); zero-based frame indices. No images modified.',
    'counts':{folder:len(list((root/folder).glob('*.jpg'))) for folder in ['Connect_start','Connect_back']},'samples':samples}
out=Path('docs/connect-sync');out.mkdir(parents=True,exist_ok=True)
(out/'asset-comparison.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print('Source comparison saved; no frame assets modified.')
