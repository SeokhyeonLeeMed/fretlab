// Renders docs/report.html to a print-quality PDF using Chrome.
import { chromium } from 'playwright';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const html = path.resolve('docs/report.html');
const out = path.resolve('docs/FretLab-report.pdf');

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();
await page.goto(pathToFileURL(html).href, { waitUntil: 'networkidle' });
await page.emulateMedia({ media: 'print' });
await page.pdf({
  path: out,
  format: 'A4',
  printBackground: true,
  margin: { top: '18mm', bottom: '18mm', left: '16mm', right: '16mm' },
  displayHeaderFooter: true,
  headerTemplate: '<div></div>',
  footerTemplate:
    '<div style="width:100%;font-family:\'Noto Sans\',sans-serif;font-size:8pt;color:#8a929c;padding:0 16mm;display:flex;justify-content:space-between;">' +
    '<span>FretLab — Project Report</span><span class="pageNumber"></span></div>',
});
await browser.close();
console.log('wrote', out);
