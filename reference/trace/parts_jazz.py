"""Trace the Jazz Bass parts from the frame-rectified photo."""
import cv2, numpy as np, json, sys
sys.path.insert(0, "reference/trace")
from common import *

img = cv2.imread("reference/trace/jazz-frame.png"); mask = np.load("reference/trace/jazz-frame-mask.npy").astype(np.uint8)
H, W = mask.shape
blur = cv2.GaussianBlur(img, (0, 0), 1.0)
lab = cv2.cvtColor(blur, cv2.COLOR_BGR2LAB).astype(np.float32)
L, A, B = lab[..., 0], lab[..., 1] - 128, lab[..., 2] - 128
hsv = cv2.cvtColor(blur, CV := cv2.COLOR_BGR2HSV).astype(np.float32)
Hh, S, V = hsv[..., 0], hsv[..., 1], hsv[..., 2]
FX = (np.arange(W)[None, :].repeat(H, 0)) / PX + X0
FY = (np.arange(H)[:, None].repeat(W, 1)) / PX + Y0
out = {}

def half_at(fx):
    col = np.where(mask[:, px(fx, 0)[0]] > 0)[0]; return (col[-1] - col[0]) / PX / 2
xs_n = np.arange(40, 460, 20); slope, icpt = np.polyfit(xs_n, [half_at(x) for x in xs_n], 1)
out["neckHalfNut"] = round(float(icpt), 2); out["neckHalfSlope"] = round(float(slope), 5)
dark_mid = (L[px(0, -16)[1]:px(0, 16)[1], :] < 120).mean(axis=0)
out["fretboardEnd"] = round(fr(max(x for x in range(px(560, 0)[0], px(780, 0)[0]) if dark_mid[x] > 0.6), 0)[0], 1)
print("neck half", out["neckHalfNut"], "+", out["neckHalfSlope"], "x ; fretboard ends", out["fretboardEnd"])

thick = np.array([(np.ptp(np.where(mask[:, x] > 0)[0]) if mask[:, x].any() else 0) for x in range(W)]) / PX
tip = next(x for x in range(px(330, 0)[0], W) if thick[x] > 2 * (icpt + slope * 500) * 1.25)
cut = fr(tip, 0)[0] - 3
bm = mask.copy(); bm[:, :px(cut, 0)[0]] = 0
out["body"] = outline(largest(bm)); out["bodyStart"] = round(cut, 1)
print("body starts", out["bodyStart"], len(out["body"]), "pts")

# headstock: maple, strongly saturated yellow
head_all = mask.copy(); head_all[:, px(1.0, 0)[0]:] = 0
maple = ((S > 70) & (V > 90) & (head_all > 0)).astype(np.uint8)
maple = fill(largest(cv2.morphologyEx(maple, cv2.MORPH_CLOSE, disk(9))))
maple = largest(cv2.morphologyEx(maple, cv2.MORPH_OPEN, disk(3)))
out["head"] = outline(maple)
hb = cv2.boundingRect(maple); print("head x", fr(hb[0], 0)[0], "..", fr(hb[0] + hb[2], 0)[0], "y", fr(0, hb[1])[1], "..", fr(0, hb[1] + hb[3])[1])
keys = cv2.morphologyEx(((head_all > 0) & (cv2.dilate(maple, disk(3)) == 0)).astype(np.uint8), cv2.MORPH_OPEN, disk(3))
kb = sorted(blobs(keys, 60), key=lambda b: -b["cx"])
out["keys"] = [[round(b["cx"], 1), round(b["cy"], 1), round(b["w"], 1), round(b["h"], 1)] for b in kb]
print("keys", out["keys"])
post = cv2.morphologyEx(((S < 60) & (L > 70) & (maple > 0)).astype(np.uint8), cv2.MORPH_OPEN, disk(3))
pc = sorted([b for b in blobs(post, 25) if 25 < b["area"] < 400], key=lambda b: -b["cx"])
out["posts"] = [[round(b["cx"], 1), round(b["cy"], 1)] for b in pc]
out["postR"] = round(float(np.median([np.sqrt(b["area"] / np.pi) for b in pc])), 1) if pc else 6
print("posts", out["posts"], out["postR"])

# tortoiseshell pickguard: red
guard = ((A > 14) & (FX > 480) & (mask > 0)).astype(np.uint8)
guard = fill(largest(cv2.morphologyEx(guard, cv2.MORPH_CLOSE, disk(12))))
guard = largest(cv2.morphologyEx(guard, cv2.MORPH_OPEN, disk(4)))
out["guard"] = outline(guard, smooth=2.2)
gb = cv2.boundingRect(guard); print("guard x", fr(gb[0], 0)[0], "..", fr(gb[0] + gb[2], 0)[0], "|", len(out["guard"]), "pts")

# the two black pickups, inside the guard
# The two pickups are the blackest things inside the guard. The neck one sits
# partly under the strings, so the pair is located from the clearer bridge
# pickup plus the measured spacing between them.
pk = cv2.morphologyEx(((L < 44) & (guard > 0)).astype(np.uint8), cv2.MORPH_OPEN, disk(2))
pk = cv2.morphologyEx(pk, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_RECT, (3, 29)))
tall = sorted([b for b in blobs(pk, 400) if b["h"] > 80], key=lambda b: -b["cx"])
bp = tall[0]
out["pickups"] = [
    dict(cx=round(bp["cx"] - 103.0, 1), cy=round(bp["cy"] - 10.0, 1), w=22.0, h=round(bp["h"] - 4, 1)),
    dict(cx=round(bp["cx"], 1), cy=round(bp["cy"], 1), w=22.0, h=round(bp["h"], 1)),
]
print("pickups", out["pickups"])

# chrome control plate and bridge
plate = ((S < 55) & (L > 95) & (FX > 740) & (FX < 980) & (FY < -40) & (mask > 0)).astype(np.uint8)
plate = fill(largest(cv2.morphologyEx(cv2.morphologyEx(plate, cv2.MORPH_CLOSE, disk(10)), cv2.MORPH_OPEN, disk(4))))
out["plate"] = outline(plate, smooth=3.0)
br = ((S < 55) & (L > 85) & (FX > 985) & (FX < 1065) & (np.abs(FY) < 80) & (mask > 0)).astype(np.uint8)
br = largest(cv2.morphologyEx(br, cv2.MORPH_CLOSE, disk(8)))
x, y, w, h = cv2.boundingRect(br); out["bridge"] = [round(v, 1) for v in (*fr(x, y), *fr(x + w, y + h))]
print("plate", len(out["plate"]), "pts; bridge", out["bridge"])

gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
a0, b0 = px(760, -180); a1, b1 = px(980, -40)
circ = cv2.HoughCircles(cv2.GaussianBlur(gray[b0:b1, a0:a1], (0, 0), 2), cv2.HOUGH_GRADIENT, dp=1.2, minDist=40,
                        param1=90, param2=24, minRadius=int(10 * PX), maxRadius=int(22 * PX))
out["knobs"] = sorted([[round(float(fr(c[0] + a0, 0)[0]), 1), round(float(fr(0, c[1] + b0)[1]), 1), round(float(c[2]) / PX, 1)] for c in (circ[0] if circ is not None else [])], key=lambda k: k[0])
print("knobs", out["knobs"])

json.dump(out, open("reference/trace/jazz-parts.json", "w"))
vis = img.copy()
for k_, col in (("body", (0, 0, 255)), ("head", (0, 0, 255)), ("guard", (0, 200, 0)), ("plate", (255, 0, 255))):
    draw_poly(vis, out[k_], col)
for p in out["pickups"]: cv2.rectangle(vis, px(p["cx"] - p["w"] / 2, p["cy"] - p["h"] / 2), px(p["cx"] + p["w"] / 2, p["cy"] + p["h"] / 2), (255, 120, 0), 2)
for kx, ky, kr in out["knobs"]: cv2.circle(vis, px(kx, ky), int(kr * PX), (0, 255, 255), 2)
for cx_, cy_ in out["posts"]: cv2.circle(vis, px(cx_, cy_), int(out["postR"] * PX), (255, 120, 0), 2)
b_ = out["bridge"]; cv2.rectangle(vis, px(b_[0], b_[1]), px(b_[2], b_[3]), (0, 255, 255), 2)
cv2.imwrite("reference/trace/jazz-parts.png", cv2.resize(vis, None, fx=0.5, fy=0.5, interpolation=cv2.INTER_AREA))
