export type CommunityRoleLabel = 'Okur' | 'Misafir';

export function getCommunityRoleLabel({
  isAdmin,
  isRegistered,
}: {
  isAdmin: boolean;
  isRegistered: boolean;
}): CommunityRoleLabel | null {
  if (isAdmin) return null;
  return isRegistered ? 'Okur' : 'Misafir';
}
