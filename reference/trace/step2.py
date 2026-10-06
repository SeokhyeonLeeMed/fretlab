"""Level the neck, detect the fret wires, and fit the scale length to them."""
import cv2, numpy as np, json
from scipy.signal import find_peaks

R = lambda n: 1 - 2 ** (-np.asarray(n, float) / 12)

def analyse(name, neck_x, s_range, thr):
    bgr = cv2.imread(f"reference/trace/{name}-rot.png"); mask = np.load(f"reference/trace/{name}-mask.npy")
    h, w = mask.shape
    top = lambda x: int(np.argmax(mask[:, x])); bot = lambda x: int(h - 1 - np.argmax(mask[::-1, x]))
    xs = np.arange(neck_x[0], neck_x[1], 4)
    mids = np.array([(top(x) + bot(x)) / 2 for x in xs])
    slope, icpt = np.polyfit(xs, mids, 1); angle = np.degrees(np.arctan(slope))
    cx = float(np.mean(neck_x)); cy = slope * cx + icpt
    M = cv2.getRotationMatrix2D((cx, cy), angle, 1.0)
    bgr = cv2.warpAffine(bgr, M, (w, h), flags=cv2.INTER_CUBIC, borderValue=(0, 0, 0))
    mask = cv2.warpAffine(mask, M, (w, h), flags=cv2.INTER_NEAREST)
    top = lambda x: int(np.argmax(mask[:, x])); bot = lambda x: int(h - 1 - np.argmax(mask[::-1, x]))
    axis_y = float(np.median([(top(x) + bot(x)) / 2 for x in xs]))
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY).astype(float)

    # A fret is a bright line across the whole neck. "Coverage" is the share of
    # the neck's width that is bright at each x: ~1 on a fret, small on a dot
    # inlay or a patch of grain.
    cov = np.zeros(w)
    lo, hi = neck_x[0] - 40, neck_x[1] + 260
    for x in range(lo, min(hi, w - 1)):
        half = min((bot(x) - top(x)) / 2, 1.3 * (bot(neck_x[1]) - top(neck_x[1])) / 2)
        col = gray[int(axis_y - 0.86 * half):int(axis_y + 0.86 * half), x]
        cov[x] = (col > thr).mean() if len(col) else 0
    covs = cv2.GaussianBlur(cov.reshape(1, -1), (0, 0), 1.2).ravel()
    peaks, _ = find_peaks(covs, height=0.42, distance=max(5, int(0.006 * s_range[0])))
    print(f"{name}: tilt {angle:+.2f} deg, axis y {axis_y:.1f}; {len(peaks)} fret candidates: {peaks.tolist()}")

    best = None
    for i in range(len(peaks)):
        for j in range(i + 4, len(peaks)):
            for m in range(0, 6):
                for n in range(m + 4, 25):
                    S = (peaks[j] - peaks[i]) / (R(n) - R(m))
                    if not (s_range[0] <= S <= s_range[1]): continue
                    x0 = peaks[i] - S * R(m)
                    pred = x0 + S * R(np.arange(0, 25))
                    d = np.abs(peaks[:, None] - pred[None, :]).min(axis=1)
                    inl = int((d < 0.0016 * S).sum()); err = float(d[d < 0.0016 * S].sum())
                    if best is None or (inl, -err) > (best[0], -best[3]): best = (inl, S, x0, err)
    inl, S, x0, _ = best
    pred = x0 + S * R(np.arange(0, 25)); d = np.abs(peaks[:, None] - pred[None, :]); k = d.argmin(axis=1)
    ok = d.min(axis=1) < 0.002 * S
    A = np.c_[np.ones(ok.sum()), R(k[ok])]; x0, S = np.linalg.lstsq(A, peaks[ok].astype(float), rcond=None)[0]
    res = peaks[ok] - (x0 + S * R(k[ok]))
    print(f"   nut x0 = {x0:.1f}, scale S = {S:.1f} px, bridge = {x0+S:.1f}; matched frets {k[ok].tolist()}")
    print(f"   residual rms {np.sqrt((res**2).mean()):.2f} px ({np.sqrt((res**2).mean())/S*1000:.2f} per mille of scale), max {np.abs(res).max():.2f}; res {np.round(res,1).tolist()}")
    np.save(f"reference/trace/{name}-level-mask.npy", mask); cv2.imwrite(f"reference/trace/{name}-level.png", bgr)
    return dict(x0=float(x0), S=float(S), axis_y=axis_y)

out = {"strat": analyse("strat", (820, 1960), (2200, 2900), 135),
       "jazz": analyse("jazz", (420, 1040), (1150, 1650), 140)}
json.dump(out, open("reference/trace/frame.json", "w"), indent=1)
