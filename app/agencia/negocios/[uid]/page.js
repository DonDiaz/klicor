import { AuthProvider } from "@/components/providers/auth-provider";
import { AgencyBusinessDashboardClient } from "@/components/agency-business-dashboard-client";

export default async function AgencyBusinessPage({ params }) {
  const resolvedParams = await params;
  return (
    <AuthProvider>
      <AgencyBusinessDashboardClient businessUid={resolvedParams.uid} />
    </AuthProvider>
  );
}
