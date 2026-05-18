import { AuthProvider } from "@/components/providers/auth-provider";
import { AgencyPageClient } from "@/components/agency-page-client";

export default function AgencyPage() {
  return (
    <AuthProvider>
      <AgencyPageClient />
    </AuthProvider>
  );
}
