# Deterministic source-pixel editing only; no video decoding or image generation.
from pathlib import Path
import sys, json
ROOT = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(ROOT / '.local/media-tools'), str(ROOT / '.local/image-tools')]
import numpy as np
from PIL import Image
import cv2

out = ROOT / 'src/assets'
out.mkdir(exist_ok=True)
source = Image.open(ROOT / 'Ideas/Background_1.png').convert('RGB')
assert source.size == (1460, 1077)
original = np.array(source)
scene = original.copy()
edited = np.zeros(original.shape[:2], dtype=bool)
def clone(box, donor_xy):
    global scene
    x1,y1,x2,y2=box
    dx,dy=donor_xy
    donor=original[dy:dy+y2-y1,dx:dx+x2-x1].copy()
    mask=np.full(donor.shape[:2],255,dtype=np.uint8)
    scene=cv2.seamlessClone(donor,scene,mask,((x1+x2)//2,(y1+y2)//2),cv2.NORMAL_CLONE)
    edited[y1:y2,x1:x2]=True
clone((118,22,376,92),(425,22))
clone((876,32,1178,78),(510,32))
clone((297,289,681,459),(320,90))
clone((301,459,541,547),(948,451))
clone((43,937,249,1023),(280,937))
clone((1340,972,1400,1020),(1230,972))
# Clean the reference dropdown without diffusing the dark wall into the sky.
for y in range(15,262):
    for x in range(1174,1359):
        if x+y >= 1529:
            scene[y,x]=original[min(y+44,292),min(x+12,1368)]
        else:
            donor=original[y,610+x-1174].astype(float)
            left_delta=original[y,1173].astype(float)-original[y,610]
            sample_y=min(y,160)
            right_delta=original[sample_y,1359].astype(float)-original[sample_y,795]
            t=(x-1174)/185
            replacement=np.clip(donor+left_delta*(1-t)+right_delta*t,0,255)
            edge=min(x-1174,1358-x,y-15,261-y)
            alpha=min(1,max(0,edge/15))
            scene[y,x]=np.rint(replacement*alpha+scene[y,x]*(1-alpha)).astype('uint8')
        edited[y,x]=True
# Only the area occluded by the reference portal is filled from adjacent sky/terrain.
x1,y1,x2,y2=650,266,936,792
patch=original[y1:y2,929:929+x2-x1].copy()
# Use only unobstructed terrain from the supplied reference; exclude all benches.
for column in range(x2-x1):
    shift=-8+16*column/(x2-x1-1)
    for y in range(540,780):
        donor_y=y-shift if y<610 else 610+(y-610)*96/170-shift
        donor_y=int(np.clip(round(donor_y),530,706))
        t=column/(x2-x1-1)
        context=original[y,x1-1].astype(float)*(1-t)+original[y,x2].astype(float)*t
        patch[y-y1,column]=np.uint8(np.rint(original[donor_y,320+column]*.55+context*.45))
patch[780-y1:]=original[780:y2,x1:x2]
portal_mask=np.full(patch.shape[:2],255,dtype=np.uint8)
scene=cv2.seamlessClone(patch,scene,portal_mask,((x1+x2)//2,(y1+y2)//2),cv2.NORMAL_CLONE)
edited[y1:y2,x1:x2]=True
assert np.array_equal(scene[~edited],original[~edited])
Image.fromarray(scene).save(out/'landing-architecture.png')

# Keep the poster's original coordinate system so all existing camera math is unchanged.
poster = np.array(Image.open(ROOT / 'public/images/landing-poster.webp').convert('RGBA'))
assert poster.shape[:2] == (1248, 1664)
frame = np.zeros_like(poster)
border = np.zeros(poster.shape[:2], dtype=bool)
border[452:462, 720:945] = True
border[462:971, 720:726] = True
border[462:971, 938:945] = True
frame[border] = poster[border]
frame[462:971, 726:938] = (250, 251, 252, 255)
assert np.array_equal(frame[border], poster[border])
person_area = frame[850:982, 783:884]
assert np.all(person_area[..., :3][person_area[..., 3] > 0] >= 240)  # no person pixels
Image.fromarray(frame).save(out / 'big-frame.png')
print(json.dumps({'environment': 'src/assets/landing-architecture.png', 'frame': 'src/assets/big-frame.png', 'originalFrameBorderPixels': int(border.sum()), 'sourcePixelsUnchangedOutsideCleanup': int((~edited).sum()), 'videoDecoded': False}))
