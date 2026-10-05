import { chromium } from 'playwright';

const browser = await chromium.launch({ channel: 'chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

// Instrument Web Audio before the app loads so nothing is mocked away:
// the real engine runs, we only observe it.
await page.addInitScript(() => {
  window.__audio = { sources: [], buffers: [], ctxState: null, sampleRate: null };
  const realStart = AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start = function (when, ...rest) {
    const b = this.buffer;
    let peak = 0;
    if (b) {
      const d = b.getChannelData(0);
      for (let i = 0; i < Math.min(d.length, 20000); i += 7) peak = Math.max(peak, Math.abs(d[i]));
    }
    window.__audio.sources.push({ when, duration: b ? b.duration : 0, peak });
    return realStart.call(this, when, ...rest);
  };
});

await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
await page.waitForSelector('svg[role="group"]');

// Click a real fretboard position.
await page.getByRole('gridcell', { name: 'G2, string 6, fret 3' }).click();
await page.waitForTimeout(500);
const afterNote = await page.evaluate(() => ({ ...window.__audio, sources: window.__audio.sources.slice() }));

// Strum the selected chord shape.
await page.getByRole('button', { name: 'Chords', exact: true }).click();
await page.evaluate(() => { window.__audio.sources.length = 0; });
await page.getByRole('button', { name: /Down strum/ }).click();
await page.waitForTimeout(600);
const down = await page.evaluate(() => window.__audio.sources.slice());

await page.evaluate(() => { window.__audio.sources.length = 0; });
await page.getByRole('button', { name: /Up strum/ }).click();
await page.waitForTimeout(600);
const up = await page.evaluate(() => window.__audio.sources.slice());

const ctx = await page.evaluate(() => {
  const el = document.querySelector('canvas');
  return { hasAudioContext: typeof AudioContext !== 'undefined' };
});

console.log(JSON.stringify({
  noteSources: afterNote.sources.length,
  notePeak: afterNote.sources[0]?.peak,
  noteDuration: afterNote.sources[0]?.duration,
  downCount: down.length,
  downOffsets: down.map((s) => +(s.when - down[0].when).toFixed(4)),
  downDurations: down.map((s) => +s.duration.toFixed(2)),
  upDurations: up.map((s) => +s.duration.toFixed(2)),
  ctx,
  errors,
}, null, 2));
await browser.close();
