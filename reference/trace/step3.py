"""Resolve the nut, then resample each photo into the instrument frame:
origin at the nut, +x towards the bridge, scale length = 1000 units."""
import cv2, numpy as np, json

PX = 2.0                       # output pixels per frame unit
X0, X1, Y0, Y1 = -320, 1260, -340, 340   # frame window covered by the output
frame = json.load(open("reference/trace/frame.json"))

def rectify(name):
    f = frame[name]
    bgr = cv2.imread(f"reference/trace/{name}-level.png"); mask = np.load(f"reference/trace/{name}-level-mask.npy")
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY).astype(float)
    bridge = f["x0"] + f["S"]; ay = f["axis_y"]
    # The fit is ambiguous by whole frets but the bridge is not. Try each
    # reading and keep the one whose nut sits where the dark fretboard starts.
    band = gray[int(ay - 12):int(ay + 12), :].mean(axis=0)
    band = cv2.blur(band.reshape(1, -1), (9, 1)).ravel()
    best = None
    for k in range(-3, 4):
        S = f["S"] * 2 ** (k / 12); x0 = bridge - S
        if x0 < 40: continue
        before = band[int(x0 - 0.03 * S):int(x0 - 0.008 * S)].mean()   # headstock: pale maple
        after = band[int(x0 + 0.008 * S):int(x0 + 0.04 * S)].mean()    # fretboard: dark rosewood
        score = before - after
        if best is None or score > best[0]: best = (score, k, x0, S)
    _, k, x0, S = best
    print(f"{name}: nut at x={x0:.1f} (shift {k:+d} frets), scale {S:.1f} px, bridge {bridge:.1f}, axis y {ay:.1f}")
    u = S / 1000.0                                  # source pixels per frame unit
    # frame (fx, fy) -> source pixel: x = x0 + fx*u, y = ay + fy*u
    W, H = int((X1 - X0) * PX), int((Y1 - Y0) * PX)
    M = np.float32([[u / PX, 0, x0 + X0 * u], [0, u / PX, ay + Y0 * u]])
    out = cv2.warpAffine(bgr, M, (W, H), flags=cv2.INTER_AREA | cv2.WARP_INVERSE_MAP, borderValue=(0, 0, 0))
    m = cv2.warpAffine(mask, M, (W, H), flags=cv2.INTER_NEAREST | cv2.WARP_INVERSE_MAP)
    cv2.imwrite(f"reference/trace/{name}-frame.png", out); np.save(f"reference/trace/{name}-frame-mask.npy", m)
    frame[name].update(nut_x=float(x0), scale=float(S), shift=int(k))
    return out, m

def to_px(fx, fy): return int(round((fx - X0) * PX)), int(round((fy - Y0) * PX))

def grid(img, step=50, label=100):
    vis = img.copy()
    for gx in range(X0 - X0 % step, X1, step):
        x, _ = to_px(gx, 0); major = gx % label == 0
        cv2.line(vis, (x, 0), (x, vis.shape[0]), (0, 255, 255) if major else (90, 150, 150), 1)
        if major: cv2.putText(vis, str(gx), (x + 3, 16), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1, cv2.LINE_AA)
    for gy in range(Y0 - Y0 % step, Y1, step):
        _, y = to_px(0, gy); major = gy % label == 0
        cv2.line(vis, (0, y), (vis.shape[1], y), (0, 255, 255) if major else (90, 150, 150), 1)
        if major: cv2.putText(vis, str(gy), (3, y - 3), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1, cv2.LINE_AA)
    return vis

for name in ["strat", "jazz"]:
    out, m = rectify(name)
    vis = out.copy(); vis[m == 0] = (vis[m == 0] * 0.35 + 30).astype(np.uint8)
    vis = grid(vis)
    # theoretical frets and the bridge, to check the frame against the photo
    for n in range(0, 23):
        x, _ = to_px(1000 * (1 - 2 ** (-n / 12)), 0); cv2.line(vis, (x, to_px(0, -30)[1]), (x, to_px(0, 30)[1]), (0, 0, 255), 1)
    xb, _ = to_px(1000, 0); cv2.line(vis, (xb, to_px(0, -80)[1]), (xb, to_px(0, 80)[1]), (255, 0, 255), 2)
    cv2.imwrite(f"reference/trace/{name}-grid.png", cv2.resize(vis, None, fx=0.62, fy=0.62, interpolation=cv2.INTER_AREA))
    # how wide the neck is, in frame units
    ys = lambda fx: np.where(m[:, to_px(fx, 0)[0]] > 0)[0]
    for fx in (20, 250, 500):
        r = ys(fx); print(f"   neck at x={fx}: y {r[0]/PX+Y0:+.1f} .. {r[-1]/PX+Y0:+.1f}  (half-width {(r[-1]-r[0])/PX/2:.1f})")
json.dump(frame, open("reference/trace/frame.json", "w"), indent=1)
