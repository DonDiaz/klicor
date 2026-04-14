import { NextResponse } from "next/server";

const DORIKA_HOSTS = new Set(["dorika.com.co", "www.dorika.com.co"]);
const KLICOR_HOSTS = new Set([
  "klicor.com",
  "www.klicor.com",
  "klicor.com.co",
  "www.klicor.com.co",
]);

function getCleanHost(request) {
  return (request.headers.get("host") || "").split(":")[0].toLowerCase();
}

export function middleware(request) {
  const host = getCleanHost(request);
  const { pathname, search } = request.nextUrl;

  if (DORIKA_HOSTS.has(host)) {
    if (pathname === "/") {
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = "/dorika";
      return NextResponse.rewrite(rewriteUrl);
    }

    if (pathname === "/dorika") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/";
      return NextResponse.redirect(redirectUrl, 308);
    }

    return NextResponse.next();
  }

  if (KLICOR_HOSTS.has(host) && pathname === "/dorika") {
    return NextResponse.redirect(`https://dorika.com.co${search}`, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dorika"],
};
