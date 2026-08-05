import test from 'node:test';
import assert from 'node:assert/strict';
import { getCommunityRoleLabel } from '../src/lib/community-role.ts';

test('community role labels distinguish admins, readers and guests', () => {
  assert.equal(
    getCommunityRoleLabel({ isAdmin: true, isRegistered: true }),
    null
  );
  assert.equal(
    getCommunityRoleLabel({ isAdmin: false, isRegistered: true }),
    'Okur'
  );
  assert.equal(
    getCommunityRoleLabel({ isAdmin: false, isRegistered: false }),
    'Misafir'
  );
});
