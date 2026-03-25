import { requireAdmin } from '@/lib/auth';
import AdminImporter from './AdminImporter';

export default async function AdminPage() {
  await requireAdmin();
  return <AdminImporter />;
}
