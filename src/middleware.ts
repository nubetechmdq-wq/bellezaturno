import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rutas públicas que NO requieren autenticación
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/s/(.*)",             // Landing pages públicas de salones
  "/api/webhooks/(.*)", // Webhooks de Clerk, Mercado Pago, WhatsApp
  "/api/booking/(.*)",  // Endpoints públicos de reservas
]);

// Rutas del dashboard que SÍ requieren auth
const isDashboardRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/onboarding(.*)",
]);

export default clerkMiddleware(async (auth, request: NextRequest) => {
  const { userId } = await auth();
  const url = request.nextUrl;

  // RUTEO MULTI-TENANT (CUSTOM DOMAINS)
  let hostname = request.headers.get("host") || "";
  console.log(`[Middleware] Host: ${hostname}, Path: ${url.pathname}`);
  hostname = hostname.split(':')[0]; // Remover puerto en localhost

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace("https://", "").replace("http://", "").split(':')[0] || "";
  const mainDomains = ["fadeos.com", "localhost", "127.0.0.1", appUrl];

  const isCustomDomain = !mainDomains.includes(hostname) && !hostname.endsWith(".vercel.app");

  if (isCustomDomain) {
    // Si es un custom domain, y no está pidiendo recursos internos o APIs de la app principal...
    if (!url.pathname.startsWith("/api") && !url.pathname.startsWith("/_next") && !url.pathname.startsWith("/sign-")) {
      // Reescribir silenciosamente a la ruta /_site/[domain]
      return NextResponse.rewrite(new URL(`/_site/${hostname}${url.pathname}`, request.url));
    }
  }

  // RUTEO NORMAL (DASHBOARD AUTH)
  if (isDashboardRoute(request) && !userId) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  if (userId && url.pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (
    userId &&
    (url.pathname.startsWith("/sign-in") || url.pathname.startsWith("/sign-up"))
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Excluir archivos estáticos y _next
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico).*)",
  ],
};
