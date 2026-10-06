"""Trace the remaining Strat parts: body, headstock, posts, buttons, pickups, knobs, bridge, jack."""
import cv2, numpy as np, json, sys
sys.path.insert(0, "reference/trace")
from common import *

img = cv2.imread("reference/trace/strat-frame.png"); mask = np.load("reference/trace/strat-frame-mask.npy").astype(np.uint8)
H, W = mask.shape
lab = cv2.cvtColor(cv2.GaussianBlur(img, (0, 0), 1.0), cv2.COLOR_BGR2LAB).astype(np.float32)
L, B = lab[..., 0], lab[..., 2] - 128
SAT = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)[..., 1].astype(np.float32)
FX = (np.arange(W)[None, :].repeat(H, 0)) / PX + X0
FY = (np.arange(H)[:, None].repeat(W, 1)) / PX + Y0
out = {"guard": json.load(open("reference/trace/strat-guard.json"))}

def half_at(fx):
    col = np.where(mask[:, px(fx, 0)[0]] > 0)[0]; return (col[-1] - col[0]) / PX / 2
xs_n = np.arange(40, 480, 20); slope, icpt = np.polyfit(xs_n, [half_at(x) for x in xs_n], 1)
out["neckHalfNut"] = round(float(icpt), 2); out["neckHalfSlope"] = round(float(slope), 5)
dark_mid = (L[px(0, -18)[1]:px(0, 18)[1], :] < 135).mean(axis=0)
out["fretboardEnd"] = round(fr(max(x for x in range(px(600, 0)[0], px(800, 0)[0]) if dark_mid[x] > 0.6), 0)[0], 1)
print("neck half", out["neckHalfNut"], "+", out["neckHalfSlope"], "* x ; fretboard ends", out["fretboardEnd"])

# body: the silhouette from just before the horn tips onwards
thick = np.array([(np.ptp(np.where(mask[:, x] > 0)[0]) if mask[:, x].any() else 0) for x in range(W)]) / PX
tip = next(x for x in range(px(350, 0)[0], W) if thick[x] > 2 * (icpt + slope * 500) * 1.25)
cut = fr(tip, 0)[0] - 3
bm = mask.copy(); bm[:, :px(cut, 0)[0]] = 0
out["body"] = outline(largest(bm)); out["bodyStart"] = round(cut, 1)

# headstock: the maple only, which leaves the chrome tuner keys out
head_all = mask.copy(); head_all[:, px(1.0, 0)[0]:] = 0
maple = ((SAT > 95) & (head_all > 0)).astype(np.uint8)
maple = fill(largest(cv2.morphologyEx(maple, cv2.MORPH_CLOSE, disk(9))))
maple = largest(cv2.morphologyEx(maple, cv2.MORPH_OPEN, disk(3)))
out["head"] = outline(maple)

# posts: round chrome bushings on the maple
chrome = ((SAT < 105) & (L > 80) & (maple > 0)).astype(np.uint8)
chrome = cv2.morphologyEx(chrome, cv2.MORPH_OPEN, disk(3))
cand = sorted([b for b in blobs(chrome, 15) if 15 < b["area"] < 400 and 0.5 < b["w"] / b["h"] < 2.0], key=lambda b: -b["cx"])
print("post candidates", [(round(b["cx"]), round(b["cy"]), round(b["area"])) for b in cand])
out["posts"] = [[round(b["cx"], 1), round(b["cy"], 1)] for b in cand]
out["postR"] = round(float(np.median([np.sqrt(b["area"] / np.pi) for b in cand])), 1) if cand else 5
# keys: whatever hangs off the headstock that is not maple
keys = ((head_all > 0) & (cv2.dilate(maple, disk(3)) == 0)).astype(np.uint8)
keys = cv2.morphologyEx(keys, cv2.MORPH_OPEN, disk(2))
kb = sorted([b for b in blobs(keys, 25)], key=lambda b: -b["cx"])
print("keys", [(round(b["cx"]), round(b["cy"]), round(b["w"]), round(b["h"])) for b in kb])
out["keys"] = [[round(b["cx"], 1), round(b["cy"], 1), round(b["w"], 1), round(b["h"], 1)] for b in kb]

# pickups from their pole pieces
g = np.zeros((H, W), np.uint8); cv2.fillPoly(g, [np.array([px(x, y) for x, y in out["guard"]], np.int32)], 1)
pole = ((L < 110) & (g > 0) & (np.abs(FY) < 62) & (FX > 720) & (FX < 975)).astype(np.uint8)
pole = cv2.morphologyEx(pole, cv2.MORPH_OPEN, disk(2))
pb = [b for b in blobs(pole, 6) if 8 < b["area"] < 90]
out["pickups"] = []
for lo, hi in ((720, 800), (810, 890), (900, 975)):
    grp = sorted([b for b in pb if lo < b["cx"] < hi], key=lambda b: b["cy"])
    yy = np.array([b["cy"] for b in grp]); xx = np.array([b["cx"] for b in grp])
    k, c = np.polyfit(yy, xx, 1); cy = float(yy.mean())
    out["pickups"].append(dict(cx=round(float(k * cy + c), 1), cy=round(cy, 1), angle=round(float(np.degrees(np.arctan(k))), 2), poles=len(grp)))
print("pickups", out["pickups"])

# knobs
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
a0, b0 = px(900, -240); a1, b1 = px(1080, -50)
circ = cv2.HoughCircles(cv2.GaussianBlur(gray[b0:b1, a0:a1], (0, 0), 2), cv2.HOUGH_GRADIENT, dp=1.2, minDist=60,
                        param1=90, param2=26, minRadius=int(14 * PX), maxRadius=int(24 * PX))
out["knobs"] = sorted([[round(float(fr(c[0] + a0, 0)[0]), 1), round(float(fr(0, c[1] + b0)[1]), 1), round(float(c[2]) / PX, 1)] for c in circ[0]], key=lambda k: k[1])
print("knobs", out["knobs"])

# jack plate: chrome, far less yellow than the finish
jk = ((B < 9) & (FX > 1040) & (FX < 1160) & (FY > -215) & (FY < -70) & (mask > 0)).astype(np.uint8)
jk = fill(largest(cv2.morphologyEx(cv2.morphologyEx(jk, cv2.MORPH_CLOSE, disk(8)), cv2.MORPH_OPEN, disk(3))))
out["jack"] = outline(jk, smooth=3.5)

# bridge plate
br = ((L < 170) & (FX > 975) & (FX < 1065) & (np.abs(FY) < 75) & (mask > 0)).astype(np.uint8)
x, y, w, h = cv2.boundingRect(largest(cv2.morphologyEx(br, cv2.MORPH_CLOSE, disk(9))))
out["bridge"] = [round(v, 1) for v in (*fr(x, y), *fr(x + w, y + h))]
print("bridge", out["bridge"])

json.dump(out, open("reference/trace/strat-parts.json", "w"))
vis = img.copy()
for k_, col in (("body", (0, 0, 255)), ("head", (0, 0, 255)), ("guard", (0, 200, 0)), ("jack", (255, 0, 255))):
    draw_poly(vis, out[k_], col)
for kx, ky, kr in out["knobs"]: cv2.circle(vis, px(kx, ky), int(kr * PX), (255, 120, 0), 2)
for cx_, cy_ in out["posts"]: cv2.circle(vis, px(cx_, cy_), int(out["postR"] * PX), (255, 120, 0), 2)
for kx, ky, kw, kh in out["keys"]: cv2.rectangle(vis, px(kx - kw / 2, ky - kh / 2), px(kx + kw / 2, ky + kh / 2), (255, 0, 255), 2)
for p in out["pickups"]:
    for s in (-1, 1):
        a = np.radians(p["angle"]); cv2.circle(vis, px(p["cx"] + s * 41 * np.sin(a), p["cy"] + s * 41 * np.cos(a)), 6, (255, 120, 0), 2)
b_ = out["bridge"]; cv2.rectangle(vis, px(b_[0], b_[1]), px(b_[2], b_[3]), (0, 255, 255), 2)
cv2.imwrite("reference/trace/strat-parts.png", cv2.resize(vis, None, fx=0.45, fy=0.45, interpolation=cv2.INTER_AREA))
