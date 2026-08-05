import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const navbarUrl = new URL('../src/components/Navbar.tsx', import.meta.url);
const stylesUrl = new URL('../src/components/Navbar.module.css', import.meta.url);

test('mobile navigation is rendered outside the filtered navbar', async () => {
  const source = await readFile(navbarUrl, 'utf8');
  const navbarEnd = source.indexOf('</nav>');
  const mobileMenuStart = source.indexOf('{menuOpen &&');

  assert.ok(navbarEnd !== -1);
  assert.ok(mobileMenuStart > navbarEnd);
  assert.match(source, /aria-expanded=\{menuOpen\}/);
  assert.match(source, /aria-modal="true"/);
});

test('mobile navigation locks page scroll and supports keyboard dismissal', async () => {
  const source = await readFile(navbarUrl, 'utf8');

  assert.match(source, /document\.body\.style\.overflow = 'hidden'/);
  assert.match(source, /document\.documentElement\.style\.overflow = 'hidden'/);
  assert.match(source, /event\.key !== 'Escape'/);
  assert.match(source, /event\.key !== 'Tab'/);
  assert.match(source, /element\.inert = true/);
  assert.match(source, /setAttribute\('aria-hidden', 'true'\)/);
  assert.match(source, /addEventListener\('popstate'/);
  assert.match(source, /addEventListener\('hashchange'/);
  assert.match(source, /min-h-12/);
  assert.match(source, /min-h-0/);
});

test('mobile drawer uses dynamic viewport height and safe areas', async () => {
  const styles = await readFile(stylesUrl, 'utf8');

  assert.match(styles, /height:\s*100dvh/);
  assert.match(styles, /safe-area-inset-top/);
  assert.match(styles, /safe-area-inset-bottom/);
  assert.match(styles, /overscroll-behavior:\s*contain/);
  assert.match(styles, /prefers-reduced-motion:\s*reduce/);
});
