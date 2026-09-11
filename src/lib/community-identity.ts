type PublicIdentityProfile = {
  username?: string | null;
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
};

type CommunityAuthor = {
  user_id: string | null;
  guest_name: string | null;
  profiles: PublicIdentityProfile | null;
};

export function formatPublicUsername(username: string | null | undefined): string | null {
  const normalized = username?.trim().replace(/^@+/, '');
  return normalized ? `@${normalized}` : null;
}

export function getCommunityDisplayName(author: CommunityAuthor): string {
  const username = formatPublicUsername(author.profiles?.username);
  if (username) return username;

  if (author.profiles?.first_name?.trim()) {
    const firstName = author.profiles.first_name.trim();
    const lastInitial = author.profiles.last_name?.trim()
      ? ` ${author.profiles.last_name.trim().charAt(0)}.`
      : '';
    return `${firstName}${lastInitial}`;
  }

  if (author.profiles?.display_name?.trim()) {
    const parts = author.profiles.display_name.trim().split(/\s+/);
    return parts.length > 1
      ? `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`
      : parts[0];
  }

  return author.guest_name?.trim() || (author.user_id ? 'Okur' : 'Anonim');
}
