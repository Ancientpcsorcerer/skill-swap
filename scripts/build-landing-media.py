"""Derive TASK-002 landing-only motion from the approved source; no generated imagery.

Requires offline numpy and Pillow (installed in .local/media-tools), and ffmpeg.
The original video, prompt, and reference image are never written.
"""
from pathlib import Path
import hashlib
import json
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / ".local/media-tools"))
import numpy as np
from PIL import Image

W, H, FPS = 1664, 1248, 24
SOURCE = ROOT / "public/video/portal.mp4"
OUTPUT = ROOT / "public/video/landing-ambient.mp4"
EVIDENCE = ROOT / "docs/task-002/media-inspection"
EVIDENCE.mkdir(parents=True, exist_ok=True)

def portal_bounds(rgb):
    # Bright interior: use a row above the person and the longest vertical run,
    # ignoring the separate one-pixel specular highlight above the door.
    gray = rgb.mean(axis=2)
    xs = np.flatnonzero(gray[650, 500:1150] > 235) + 500
    column = gray[150:1100, 780] > 235
    edges = np.diff(np.r_[False, column, False].astype(int))
    starts, stops = np.flatnonzero(edges == 1), np.flatnonzero(edges == -1)
    longest = np.argmax(stops - starts)
    return [int(xs[0]), int(xs[-1]), int(starts[longest] + 150), int(stops[longest] + 149)]

def smooth(low, high, values):
    u = np.clip((values - low) / (high - low), 0, 1)
    return u * u * (3 - 2 * u)

# Keep the door, distant environment and foreground absolutely fixed.
# Only the existing fog beside the door and original person's small region move.
y, x = np.mgrid[0:H, 0:W].astype(np.float32)
fog = smooth(650, 745, y) * (1 - smooth(925, 967, y))
fog *= smooth(280, 400, x) * (1 - smooth(1264, 1384, x))
fog *= np.maximum(1 - smooth(660, 714, x), smooth(948, 1002, x))
person = smooth(783, 798, x) * (1 - smooth(869, 884, x))
person *= smooth(850, 868, y) * (1 - smooth(972, 982, y))
mask = np.maximum(fog, person)[..., None]
Image.fromarray(np.uint8(mask[..., 0] * 255)).save(EVIDENCE / "ambient-mask.png")

decoder = subprocess.Popen([
    "ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(SOURCE),
    "-pix_fmt", "rgb24", "-f", "rawvideo", "-"
], stdout=subprocess.PIPE)
encoder = subprocess.Popen([
    "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
    "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
    "-i", "-", "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "17",
    "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(OUTPUT)
], stdin=subprocess.PIPE)

base = None
reference = None
measurements = []
movement = []
frame = 0
try:
    while True:
        raw = decoder.stdout.read(W * H * 3)
        if len(raw) != W * H * 3:
            break
        original = np.frombuffer(raw, dtype=np.uint8).reshape(H, W, 3)
        bounds = portal_bounds(original)
        if base is None:
            base = original.astype(np.float32)
            reference = bounds
            Image.fromarray(original).save(ROOT / "public/images/landing-poster.webp", lossless=True)
        left, right, top, bottom = bounds
        rleft, rright, rtop, rbottom = reference
        sx = (right - left) / (rright - rleft)
        sy = (bottom - top) / (rbottom - rtop)
        # Offline inverse camera alignment; this transform never runs in the browser.
        aligned = np.asarray(Image.fromarray(original).transform(
            (W, H), Image.Transform.AFFINE,
            (sx, 0, left - sx * rleft, 0, sy, top - sy * rtop),
            resample=Image.Resampling.BICUBIC,
        )).astype(np.float32)
        ambient = np.uint8(np.clip(base * (1 - mask) + aligned * mask, 0, 255))
        encoder.stdin.write(ambient.tobytes())
        delta = np.abs(ambient.astype(np.float32) - base)
        # Full-frame pre-encode invariant: everything outside the motion mask is fixed.
        assert np.max(delta[mask[..., 0] == 0]) == 0
        measurements.append({"frame": frame, "time": round(frame / FPS, 6), "source_portal": bounds})
        if frame % 24 == 0:
            movement.append({
                "time": frame / FPS,
                "person_mean_change": float(delta[870:969, 800:868].mean()),
                "fog_mean_change": float(delta[790:935, 250:650].mean()),
                "foreground_max_change": float(delta[1000:1248].max()),
                "portal_edge_max_change": float(delta[460:825, 700:958].max()),
            })
            print(f"Frame {frame}: source door {right-left+1}px; fixed scene + original ambient motion", flush=True)
        frame += 1
finally:
    decoder.stdout.close()
    encoder.stdin.close()
    decode_status = decoder.wait()
    encode_status = encoder.wait()
if decode_status or encode_status or frame != 241:
    raise RuntimeError(f"Media derivation incomplete: {frame} frames; {decode_status=}; {encode_status=}")
assert any(row["person_mean_change"] > 1 for row in movement[1:])
assert any(row["fog_mean_change"] > 1 for row in movement[1:])
report = {
    "source": str(SOURCE.relative_to(ROOT)),
    "source_sha256": hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
    "output": str(OUTPUT.relative_to(ROOT)),
    "size": [W, H], "fps": FPS, "frames": frame, "duration": frame / FPS,
    "first_portal": reference, "last_portal": measurements[-1]["source_portal"],
    "method": "Held opening environment, source-only person/fog mask, per-frame inverse affine alignment; play once then hold.",
    "uncompressed_invariants": "All pixels outside the ambient mask remain identical in all 241 frames.",
    "sampled_motion": movement,
    "source_measurements": measurements,
}
(EVIDENCE / "media-analysis.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
print("Landing-only clip and evidence written. Source/reference files untouched.", flush=True)
