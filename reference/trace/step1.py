"""Isolate each instrument, lay it neck-horizontal, and find the neck axis."""
import cv2, numpy as np, sys

def load(name):
    if name == "strat":
        im = cv2.imread("reference/strat.png", cv2.IMREAD_UNCHANGED)       # BGRA, real alpha
        bgr, alpha = im[:, :, :3], im[:, :, 3]
        mask = (alpha > 245).astype(np.uint8)
    else:
        bgr = cv2.imread("reference/jazz.jpg")
        hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
        H, S, V = hsv[:, :, 0].astype(int), hsv[:, :, 1].astype(int), hsv[:, :, 2].astype(int)
        blue = (H > 95) & (H < 125) & (S > 110)                           # backdrop, lit or in shadow
        mask = (~blue).astype(np.uint8)
    # upright photo -> neck horizontal, headstock left, bass side down
    bgr = cv2.rotate(bgr, cv2.ROTATE_90_COUNTERCLOCKWISE)
    mask = cv2.rotate(mask, cv2.ROTATE_90_COUNTERCLOCKWISE)
    return bgr, mask

def largest(mask):
    n, lab, stats, _ = cv2.connectedComponentsWithStats(mask, 8)
    k = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
    return (lab == k).astype(np.uint8)

def fill_holes(mask):
    h, w = mask.shape
    ff = np.zeros((h + 2, w + 2), np.uint8)
    inv = (1 - mask).astype(np.uint8)
    cv2.floodFill(inv, ff, (0, 0), 2)
    return ((inv != 2) | (mask == 1)).astype(np.uint8)

for name in ["strat", "jazz"]:
    bgr, mask = load(name)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    mask = fill_holes(largest(mask))
    h, w = mask.shape
    cols = np.where(mask.any(axis=0))[0]
    top = np.array([np.argmax(mask[:, x]) if mask[:, x].any() else -1 for x in range(w)])
    bot = np.array([h - 1 - np.argmax(mask[::-1, x]) if mask[:, x].any() else -1 for x in range(w)])
    thick = (bot - top).astype(float); thick[top < 0] = np.nan
    print(f"{name}: image {w}x{h}, silhouette x {cols[0]}..{cols[-1]}")
    # thickness profile every 5% of the length, to see head / neck / body
    for f in np.linspace(0.02, 0.98, 25):
        x = int(cols[0] + f * (cols[-1] - cols[0]))
        print(f"   x={x:5d} ({f:4.2f})  thick={thick[x]:6.0f}  mid={(top[x]+bot[x])/2:7.1f}")
    np.save(f"reference/trace/{name}-mask.npy", mask); cv2.imwrite(f"reference/trace/{name}-rot.png", bgr)
    vis = bgr.copy(); vis[mask == 0] = (vis[mask == 0] * 0.25).astype(np.uint8)
    cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    cv2.drawContours(vis, cnts, -1, (0, 0, 255), 2)
    s = 1500 / w; cv2.imwrite(f"reference/trace/{name}-mask-vis.png", cv2.resize(vis, None, fx=s, fy=s, interpolation=cv2.INTER_AREA))
