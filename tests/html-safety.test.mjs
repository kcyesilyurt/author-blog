import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, sanitizeMarkdownUrl } from '../src/lib/html-safety.ts';

test('HTML escaping protects attribute delimiters', () => {
  assert.equal(
    escapeHtml('<img src="x" onerror="alert(1)">'),
    '&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;'
  );
});

test('Markdown URL validation rejects executable protocols', () => {
  assert.equal(sanitizeMarkdownUrl('javascript:alert(1)', false), null);
  assert.equal(sanitizeMarkdownUrl('data:text/html,<script>alert(1)</script>', true), null);
  assert.equal(sanitizeMarkdownUrl('https://example.com/page', false), 'https://example.com/page');
  assert.equal(sanitizeMarkdownUrl('/images/chapter.png', true), '/images/chapter.png');
});
