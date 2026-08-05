import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sourceUrls = {
  contact: new URL('../src/components/ContactForm.tsx', import.meta.url),
  login: new URL('../src/app/auth/login/page.tsx', import.meta.url),
  signup: new URL('../src/app/auth/signup/page.tsx', import.meta.url),
  profile: new URL('../src/app/profile/page.tsx', import.meta.url),
  reactions: new URL('../src/components/ReactionPicker.tsx', import.meta.url),
};

async function readSource(name) {
  return readFile(sourceUrls[name], 'utf8');
}

test('public form fields avoid iOS focus zoom and use mobile-sized controls', async () => {
  const [contact, login, signup, profile] = await Promise.all([
    readSource('contact'),
    readSource('login'),
    readSource('signup'),
    readSource('profile'),
  ]);

  assert.match(contact, /'min-h-12[^']*text-base/);
  assert.match(contact, /min-h-12 w-full[^"\n]*sm:w-auto/);
  assert.match(login, /min-h-\[calc\(100dvh-8rem\)\]/);
  assert.match(login, /autoComplete="email"/);
  assert.match(login, /autoComplete="current-password"/);
  assert.match(signup, /grid grid-cols-1 gap-4 sm:grid-cols-2/);
  assert.match(signup, /autoComplete="given-name"/);
  assert.match(signup, /autoComplete="family-name"/);
  assert.match(signup, /autoComplete="new-password"/);
  assert.match(profile, /grid grid-cols-1 gap-4 sm:grid-cols-2/);
  assert.match(profile, /min-h-11 cursor-pointer/);
  assert.doesNotMatch(profile, /focus:[^"\n]*text-sm/);
});

test('form labels are connected to their controls', async () => {
  const [login, signup, profile] = await Promise.all([
    readSource('login'),
    readSource('signup'),
    readSource('profile'),
  ]);

  for (const id of ['login-email', 'login-password']) {
    assert.match(login, new RegExp(`htmlFor="${id}"`));
    assert.match(login, new RegExp(`id="${id}"`));
  }

  for (const id of ['signup-first-name', 'signup-last-name', 'signup-email', 'signup-password']) {
    assert.match(signup, new RegExp(`htmlFor="${id}"`));
    assert.match(signup, new RegExp(`id="${id}"`));
  }

  for (const id of ['profile-avatar', 'profile-email', 'profile-first-name', 'profile-last-name']) {
    assert.match(profile, new RegExp(`htmlFor="${id}"`));
    assert.match(profile, new RegExp(`id="${id}"`));
  }
});

test('reaction controls meet the minimum mobile touch target', async () => {
  const reactions = await readSource('reactions');
  assert.match(reactions, /group flex min-h-11 items-center/);
});
