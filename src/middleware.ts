export { default } from "next-auth/middleware"

export const config = {
  matcher: [
    "/feed/:path*",
    "/asks/:path*",
    "/notifications/:path*",
    "/connections/:path*",
    "/profile/:path*",
    "/admin/:path*",
  ],
}
