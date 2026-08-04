import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { EN, ZH } from "@/lib/config";

export default async function Home() {
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language") ?? "";
  const primary = acceptLanguage.split(",")[0]?.trim().toLowerCase() ?? "";
  const locale = primary.startsWith("zh") ? ZH.root : EN.root;
  return redirect(`/${locale}`);
}
