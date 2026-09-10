import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { resolveLocale } from "@/lib/config";

export default async function Home() {
  const headersList = await headers();
  return redirect(`/${resolveLocale(headersList.get("accept-language"))}`);
}
