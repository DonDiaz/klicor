import { NextResponse } from "next/server";
import { requireAdmin, verifyRequest } from "@/lib/auth";
import { getAdminPanelSnapshot } from "@/lib/admin-panel";
import { getRequestAppUrl } from "@/lib/env";

export async function GET(request) {
  try {
    const auth = await verifyRequest(request);
    requireAdmin(auth);
    const searchParams = request.nextUrl.searchParams;
    return NextResponse.json(await getAdminPanelSnapshot({
      baseUrl: getRequestAppUrl(request),
      usersQuery: {
        pageSize: searchParams.get("pageSize") || 25,
        cursor: searchParams.get("cursor") || "",
        search: searchParams.get("search") || "",
        origin: searchParams.get("origin") || "all",
        accountStatus: searchParams.get("accountStatus") || "all",
        plan: searchParams.get("plan") || "all",
        renewal: searchParams.get("renewal") || "all",
        sort: searchParams.get("sort") || "created_desc",
      },
    }));
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
