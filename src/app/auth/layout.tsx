import type { Metadata } from 'next';
import { PRIVATE_ROBOTS } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Hesap',
  robots: PRIVATE_ROBOTS,
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
