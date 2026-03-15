import { getAuthSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function RootPage() {
  const session = await getAuthSession()

  if (session) {
    redirect("/feed")
  } else {
    redirect("/login")
  }
}
