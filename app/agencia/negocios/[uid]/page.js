import { AgencyBusinessDashboardClient } from "@/components/agency-business-dashboard-client";

export default async function AgencyBusinessPage({ params }) {
  const resolvedParams = await params;
  return <AgencyBusinessDashboardClient businessUid={resolvedParams.uid} />;
}
