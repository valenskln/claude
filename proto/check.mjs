import { chromium } from 'playwright-core';
const dir = '/tmp/claude-0/-home-user-claude/5b1c6e0a-8cea-5dd4-8090-082e2b430c4b/scratchpad';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1440, height: 850 } });
const errors = [];
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
// wrap like the artifact host does
import fs from 'fs';
const body = fs.readFileSync(dir + '/vigie.html', 'utf8');
fs.writeFileSync(dir + '/wrapped.html', '<!doctype html><html><head><meta charset="utf-8"></head><body>' + body + '</body></html>');
await page.goto('file://' + dir + '/wrapped.html');
await page.waitForTimeout(4000);
await page.screenshot({ path: dir + '/shot1.png' });
// click a ship row in the ranking to open detail
const rows = await page.locator('.srow').count();
if (rows > 0) { await page.locator('.srow').first().click(); await page.waitForTimeout(800); }
await page.screenshot({ path: dir + '/shot2.png' });
// click a zone in left panel
await page.locator('.zrow').first().click();
await page.waitForTimeout(800);
await page.screenshot({ path: dir + '/shot3.png' });
// switch to day theme
await page.locator('#bTheme').click();
await page.waitForTimeout(800);
await page.screenshot({ path: dir + '/shot4-light.png' });
console.log('theme after toggle:', await page.evaluate(() => document.documentElement.dataset.theme));
console.log('font loaded:', await page.evaluate(() => document.fonts.check('14px Manrope')));
// AIS modal flow
await page.locator('#bMode').click();
await page.waitForTimeout(400);
console.log('ais modal visible:', await page.locator('#aismodal').isVisible());
await page.screenshot({ path: dir + '/shot5-ais.png' });
// connect with a dummy key: should reach the server and get an auth error (proves the plumbing)
await page.locator('#aiskey').fill('cle-de-test-invalide');
await page.locator('#aisconnect').click();
await page.waitForTimeout(6000);
console.log('ais status:', JSON.stringify(await page.locator('#aisstatus').textContent()));
console.log('mode still sim:', await page.evaluate(() => typeof MODE !== 'undefined' ? MODE : 'n/a'));
await page.screenshot({ path: dir + '/shot6-ais-status.png' });
console.log('ship rows:', rows);
console.log('kpis:', await page.locator('#kShips').textContent(), await page.locator('#kAlerts').textContent());
console.log('errors:', errors.length ? errors.join('\n') : 'none');
await browser.close();
