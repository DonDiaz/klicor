import { NextResponse } from "next/server";
import { formatDate, toDate } from "@/lib/utils";
import { verifyRequest, requireAdmin } from "@/lib/auth";
import { getAccountView, getAdminSettings } from "@/lib/firestore";
import { getAdminDb } from "@/lib/firebase-admin";

export async function GET(request) {
  try {
    const { user } = await verifyRequest(request);
    const settings = await getAdminSettings();
    const account = getAccountView(user);
    let adminUsers = [];

    if (user.role === "admin") {
      requireAdmin(user);
      const usersSnap = await getAdminDb().collection("users").orderBy("createdAt", "desc").limit(25).get();
      adminUsers = usersSnap.docs.map((doc) => {
        const data = doc.data();
        return {
          uid: data.uid,
          businessName: data.businessName,
          email: data.email,
          status: data.status,
          plan: data.plan,
          expiresAtLabel: formatDate(toDate(data.expiresAt)),
        };
      });
    }

    return NextResponse.json({
      user: {
        ...account,
        trialEndsAtLabel: formatDate(account.trialEndsAt),
        expiresAtLabel: formatDate(account.expiresAt),
      },
      settings,
      publicUrl: account.username ? `${process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000"}/${account.username}` : "",
      adminUsers,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}