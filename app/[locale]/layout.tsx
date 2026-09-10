import { ConfigProvider } from "@/lib/config/configProvider";
import { LOCALE_LIST, isLocale } from "@/lib/config";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  return LOCALE_LIST.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  return (
    <html
      lang={locale}
      className="antialiased bg-neutral-900 text-neutral-100 overflow-hidden"
    >
      <body>
        <ConfigProvider locale={locale}>{children}</ConfigProvider>
      </body>
    </html>
  );
}
