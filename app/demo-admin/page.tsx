import { requireAdmin } from '@/lib/auth';
import DemoAdminClient from './DemoAdminClient';

export const metadata = {
  title: 'Demo Admin — FlashAprova',
};

export default async function DemoAdminPage() {
  await requireAdmin(); // redireciona para /dashboard?error=unauthorized se não for admin
  return <DemoAdminClient />;
}
