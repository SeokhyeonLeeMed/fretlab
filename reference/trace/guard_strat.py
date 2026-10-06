"""Trace the Strat pickguard from its black edge line, not from its colour."""
import cv2, numpy as np, json, sys
sys.path.insert(0, "reference/trace")
from common import *

img = cv2.imread("reference/trace/strat-frame.png"); mask = np.load("reference/trace/strat-frame-mask.npy").astype(np.uint8)
H, W = mask.shape
lab = cv2.cvtColor(cv2.GaussianBlur(img, (0, 0), 0.8), cv2.COLOR_BGR2LAB).astype(np.float32)
L = lab[..., 0]
FX = (np.arange(W)[None, :].repeat(H, 0)) / PX + X0
body = (mask > 0) & (FX > 520)

def trace(thr, grow):
    # Anything dark is a wall: the guard's black ply, pickup poles, screws,
    # the fretboard and the bridge. The guard is the light region they enclose.
    dark = ((L < thr) & body).astype(np.uint8)
    dark = cv2.dilate(dark, disk(grow))
    free = (body & (dark == 0)).astype(np.uint8)
    reg = free.copy(); ff = np.zeros((H + 2, W + 2), np.uint8)
    cv2.floodFill(reg, ff, px(800, -100), 2)
    g = (reg == 2).astype(np.uint8)
    # Second seed below the strings, in case the strings split the guard.
    if g[px(880, 120)[1], px(880, 120)[0]] == 0:
        reg2 = free.copy(); ff[:] = 0; cv2.floodFill(reg2, ff, px(880, 120), 2); g |= (reg2 == 2).astype(np.uint8)
    g = cv2.dilate(g, disk(grow))                     # back out to the middle of the line
    g = fill(cv2.morphologyEx(g, cv2.MORPH_CLOSE, disk(10)))
    return largest(g)

for thr in (150, 160, 170):
    for grow in (2, 3):
        g = trace(thr, grow)
        x, y, w, h = cv2.boundingRect(g)
        print(f"thr {thr} grow {grow}: area {g.sum()/PX/PX:8.0f}  x {fr(x,0)[0]:6.1f}..{fr(x+w,0)[0]:6.1f}  y {fr(0,y)[1]:6.1f}..{fr(0,y+h)[1]:6.1f}")

g = trace(160, 3)
pts = outline(g, smooth=3.0)
json.dump(pts, open("reference/trace/strat-guard.json", "w"))
vis = img.copy(); draw_poly(vis, pts, (0, 0, 255), 3)
a0, b0 = px(480, -280); a1, b1 = px(1250, 290)
cv2.imwrite("reference/trace/strat-guard.png", cv2.resize(vis[b0:b1, a0:a1], None, fx=0.95, fy=0.95, interpolation=cv2.INTER_AREA))
print(len(pts), "points")
