import { AuthProvider } from "@/components/providers/auth-provider";
import { DashboardClient } from "@/components/dashboard-client";

export default function DashboardPage() {
  return (
    <AuthProvider>
      <DashboardClient />
    </AuthProvider>
  );
}
