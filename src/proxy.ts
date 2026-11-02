import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const OLD_HOST = "katha-and-kala.vercel.app";
const NEW_ORIGIN = "https://www.kathakaala.com";

export function proxy(request: NextRequest) {
  if (request.headers.get("host") === OLD_HOST) {
    const url = `${NEW_ORIGIN}${request.nextUrl.pathname}${request.nextUrl.search}`;
    return NextResponse.redirect(url, 308);
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
