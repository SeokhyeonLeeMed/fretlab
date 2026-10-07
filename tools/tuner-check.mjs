/**
 * End-to-end tuner check.
 *
 * Chrome's --use-file-for-fake-audio-capture does not deliver signal in this
 * environment, so instead getUserMedia is replaced with one that returns a
 * genuine MediaStream carrying a synthesized guitar note. Everything after
 * that point is the application's real code: AnalyserNode, the NSDF
 * detector, the smoother, the cents maths and the UI.
 */
import { chromium } from 'playwright';

const E2 = 440 * Math.pow(2, (40 - 69) / 12);
const semis = (n) => Math.pow(2, n / 12);
// Every open string of a 6-string guitar and a 4-string bass, plus a couple of
// deliberately detuned ones and an alternate tuning.
const cases = [
  ...[['E2', 0], ['A2', 5], ['D3', 10], ['G3', 15], ['B3', 19], ['E4', 24]].map(([n, k]) => ({
    name: `guitar open ${n}`, freq: E2 * semis(k), instrument: null, tuning: null, note: n, cents: 0,
  })),
  ...[['E1', -12], ['A1', -7], ['D2', -2], ['G2', 3]].map(([n, k]) => ({
    name: `bass open ${n}`, freq: E2 * semis(k), instrument: ['Bass'], tuning: null, note: n, cents: 0,
  })),
  { name: 'guitar G3, 18 cents flat', freq: E2 * semis(15) * Math.pow(2, -18 / 1200), instrument: null, tuning: null, note: 'G3', cents: -18 },
  { name: 'guitar B3, 25 cents sharp', freq: E2 * semis(19) * Math.pow(2, 25 / 1200), instrument: null, tuning: null, note: 'B3', cents: 25 },
  { name: 'Drop D low string', freq: E2 * semis(-2), instrument: null, tuning: 'drop-d', note: 'D2', cents: 0 },
  // Played softly. The default amplitude below is 0.18; these are a string
  // touched gently, and the quietest the detector will answer at all.
  { name: 'guitar A2, played softly', freq: E2 * semis(5), instrument: null, tuning: null, note: 'A2', cents: 0, gain: 0.004 },
  { name: 'guitar A2, very soft', freq: E2 * semis(5), instrument: null, tuning: null, note: 'A2', cents: 0, gain: 0.0015 },
  { name: 'bass E1, played softly', freq: E2 * semis(-12), instrument: ['Bass'], tuning: null, note: 'E1', cents: 0, gain: 0.004 },
  // A microphone with a DC offset: level that is not sound.
  { name: 'guitar D3 with a DC offset', freq: E2 * semis(10), instrument: null, tuning: null, note: 'D3', cents: 0, dc: 0.02 },
];


const browser = await chromium.launch({
  channel: 'chrome',
  args: ['--autoplay-policy=no-user-gesture-required'],
});
const results = [];

for (const c of cases) {
  const ctx = await browser.newContext({ permissions: ['microphone'], viewport: { width: 1440, height: 950 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  await page.addInitScript(({ freq, gain, dc }) => {
    navigator.mediaDevices.getUserMedia = async () => {
      const ac = new AudioContext();
      await ac.resume();
      const seconds = 2;
      const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * seconds), ac.sampleRate);
      const d = buf.getChannelData(0);
      // Exactly whole cycles, so looping introduces no discontinuity.
      const cycles = Math.round(freq * seconds);
      const f = cycles / seconds;
      for (let i = 0; i < d.length; i++) {
        let v = 0;
        for (let h = 1; h <= 8; h++) v += (1 / h) * Math.sin((2 * Math.PI * f * h * i) / ac.sampleRate + h * 0.7);
        d[i] = v * gain + dc;
      }
      const src = ac.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const dest = ac.createMediaStreamDestination();
      src.connect(dest);
      src.start();
      window.__fakeFreq = f;
      return dest.stream;
    };
  }, { freq: c.freq, gain: c.gain ?? 0.18, dc: c.dc ?? 0 });

  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  if (c.instrument) await page.getByRole('button', { name: new RegExp(`^${c.instrument[0]}$`) }).click();
  if (c.tuning) await page.getByRole('combobox', { name: /Preset/ }).selectOption(c.tuning);
  await page.getByRole('button', { name: 'Tuner', exact: true }).click();
  await page.waitForTimeout(2200);

  const r = await page.evaluate(() => {
    const card = document.querySelector('.tuner-card');
    const text = (sel) => card?.querySelector(sel)?.textContent?.trim() ?? null;
    return {
      note: text('.tuner-note'),
      facts: [...(card?.querySelectorAll('.tuner-facts span') ?? [])].map((s) => s.textContent.trim()),
      verdict: text('.tuner-verdict'),
      needle: card?.querySelector('.tuner-needle')?.style?.left ?? null,
      actualFreq: window.__fakeFreq,
    };
  });
  results.push({ case: c.name, expectNote: c.note, expectCents: c.cents, ...r, errors });
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(results, null, 2));
