import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";

export async function getApiTranslator() {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'id';
  return await getTranslations({ locale, namespace: 'API' });
}
