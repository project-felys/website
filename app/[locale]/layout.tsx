import { ConfigProvider } from "@/components/i18n";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale !== "en" && locale !== "zh") {
    notFound();
  }

  return (
    <html lang={locale} className="antialiased bg-neutral-900 text-neutral-100 overflow-hidden">
      <body>
        <ConfigProvider locale={locale}>{children}</ConfigProvider>
      </body>
    </html>
  );
}
