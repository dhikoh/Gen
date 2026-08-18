import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function AuthRedirectPage() {
  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "id";
  redirect(`/${locale}/auth`);
}
