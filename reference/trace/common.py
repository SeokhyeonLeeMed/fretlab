"""Shared helpers for tracing parts out of a frame-rectified photo."""
import cv2, numpy as np

PX = 2.0
X0, X1, Y0, Y1 = -320, 1260, -340, 340

def px(fx, fy): return int(round((fx - X0) * PX)), int(round((fy - Y0) * PX))
def fr(x, y): return x / PX + X0, y / PX + Y0
def disk(r): return cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))

def largest(m):
    n, lab, st, _ = cv2.connectedComponentsWithStats(m.astype(np.uint8), 8)
    if n < 2: return m.astype(np.uint8)
    return (lab == 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])).astype(np.uint8)

def fill(m):
    h, w = m.shape; ff = np.zeros((h + 2, w + 2), np.uint8); inv = (1 - m).astype(np.uint8)
    cv2.floodFill(inv, ff, (0, 0), 2)
    return ((inv != 2) | (m == 1)).astype(np.uint8)

def blobs(m, min_area=0):
    n, lab, st, cen = cv2.connectedComponentsWithStats(m.astype(np.uint8), 8)
    out = []
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] >= min_area:
            x, y, w, h, a = st[i]
            cx, cy = fr(*cen[i])
            out.append(dict(cx=cx, cy=cy, w=w / PX, h=h / PX, area=a / PX / PX))
    return out

def outline(m, smooth=2.5, eps=0.18):
    """Outer contour of a mask as a smooth closed polygon in frame units."""
    cs, _ = cv2.findContours(m.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    c = max(cs, key=cv2.contourArea)[:, 0, :].astype(np.float64)
    if smooth > 0:
        r = int(smooth * 3); k = np.exp(-0.5 * (np.arange(-r, r + 1) / smooth) ** 2); k /= k.sum()
        pad = np.r_[c[-r:], c, c[:r]]
        c = np.c_[np.convolve(pad[:, 0], k, "valid"), np.convolve(pad[:, 1], k, "valid")]
    pts = np.c_[c[:, 0] / PX + X0, c[:, 1] / PX + Y0]
    pts = cv2.approxPolyDP(pts.astype(np.float32).reshape(-1, 1, 2), eps, True)[:, 0, :]
    return [[round(float(x), 1), round(float(y), 1)] for x, y in pts]

def draw_poly(vis, pts, col, t=2):
    p = np.array([px(x, y) for x, y in pts], np.int32).reshape(-1, 1, 2)
    cv2.polylines(vis, [p], True, col, t, cv2.LINE_AA)
