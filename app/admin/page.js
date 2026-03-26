import { AuthProvider } from "@/components/providers/auth-provider";
import { AdminPageClient } from "@/components/admin-page-client";

export default function AdminPage() {
  return (
    <AuthProvider>
      <AdminPageClient />
    </AuthProvider>
  );
}
