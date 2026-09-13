"""Decode the shipped clip and verify camera stability, ambient motion, and source preservation."""
from pathlib import Path
import hashlib
import json
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / ".local/media-tools"))
import numpy as np

W, H = 1664, 1248
p = subprocess.Popen([
    "ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(ROOT / "public/video/landing-ambient.mp4"),
    "-pix_fmt", "rgb24", "-f", "rawvideo", "-"
], stdout=subprocess.PIPE)
base = None
rows = []
frame = 0
while True:
    raw = p.stdout.read(W * H * 3)
    if len(raw) != W * H * 3:
        break
    rgb = np.frombuffer(raw, dtype=np.uint8).reshape(H, W, 3)
    if base is None:
        base = rgb.astype(np.float32)
    delta = np.abs(rgb.astype(np.float32) - base)
    gray = rgb.mean(axis=2)
    white = np.flatnonzero(gray[650, 500:1150] > 235) + 500
    column = gray[150:1100, 780] > 235
    edges = np.diff(np.r_[False, column, False].astype(int))
    starts, stops = np.flatnonzero(edges == 1), np.flatnonzero(edges == -1)
    longest = np.argmax(stops - starts)
    rows.append({
        "frame": frame,
        "portal": [int(white[0]), int(white[-1]), int(starts[longest] + 150), int(stops[longest] + 149)],
        "foreground_mean_delta": float(delta[1000:1248].mean()),
        "portal_mean_delta": float(delta[480:820, 725:938].mean()),
        "person_mean_delta": float(delta[870:969, 800:868].mean()),
        "fog_mean_delta": float(delta[790:925, 400:650].mean()),
    })
    frame += 1
p.stdout.close()
assert p.wait() == 0 and frame == 241
boxes = np.array([r["portal"] for r in rows])
drift = np.ptp(boxes, axis=0).tolist()
floor = max(r["foreground_mean_delta"] for r in rows)
portal = max(r["portal_mean_delta"] for r in rows)
person = max(r["person_mean_delta"] for r in rows)
fog = max(r["fog_mean_delta"] for r in rows)
assert max(drift) <= 1, f"Camera drift: {drift}"
assert floor < 0.5, f"Foreground movement: {floor}"
assert portal < 0.5, f"Portal movement: {portal}"
assert person > 1 and fog > 1, "Original person and fog must remain animated"
source_hash = hashlib.sha256((ROOT / "public/video/portal.mp4").read_bytes()).hexdigest()
assert source_hash == "8c0a07b331f8967166a4d7fdbcc99d82604df3f0937671eec16256abcc307843"
report = {
    "status": "passed", "decoded_frames": frame,
    "portal_bounds_drift_px": drift,
    "max_foreground_mean_delta_0_to_255": floor,
    "max_portal_mean_delta_0_to_255": portal,
    "max_person_mean_delta_0_to_255": person,
    "max_fog_mean_delta_0_to_255": fog,
    "source_sha256_unchanged": source_hash,
    "sampled_frames": [r for r in rows if r["frame"] % 24 == 0],
}
(ROOT / "docs/task-002/media-inspection/encoded-verification.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
print(json.dumps({k:v for k,v in report.items() if k != "sampled_frames"}, indent=2))
