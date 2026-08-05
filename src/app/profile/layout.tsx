import type { Metadata } from 'next';
import { PRIVATE_ROBOTS } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Profil',
  robots: PRIVATE_ROBOTS,
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
