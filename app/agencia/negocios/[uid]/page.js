import { AgencyBusinessDashboardClient } from "@/components/agency-business-dashboard-client";

export default function AgencyBusinessPage({ params }) {
  return <AgencyBusinessDashboardClient businessUid={params.uid} />;
}
