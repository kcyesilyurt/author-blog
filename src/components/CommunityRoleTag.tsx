import { getCommunityRoleLabel } from '@/lib/community-role';

export default function CommunityRoleTag({
  isAdmin,
  isRegistered,
}: {
  isAdmin: boolean;
  isRegistered: boolean;
}) {
  const label = getCommunityRoleLabel({ isAdmin, isRegistered });
  if (!label) return null;

  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-[#64090C]/15 text-[#EFEACD]/50 border border-[#64090C]/40">
      {label}
    </span>
  );
}
