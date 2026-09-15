"use client";

import Link from "next/link";
import { useConfig } from "@/lib/config/configProvider";
import { usePathname, useRouter } from "next/navigation";
import { BOOK_URL, LOCALE_LIST, type Locale } from "@/lib/config";
import { LanguageIcon } from "@/components/icons";

export default function Navigator() {
  const { root, articleNamespace, chat, compiler, voice } = useConfig();
  const pathname = usePathname();
  const router = useRouter();

  const switchTo = (locale: Locale) => {
    // Only the leading segment is the locale, so match it anchored.
    const newPathname = pathname.replace(new RegExp(`^/${root}(?=/|$)`), `/${locale}`);
    router.push(newPathname);
  };

  const handleSwitchLanguage = () => {
    const index = LOCALE_LIST.indexOf(root);
    const next = LOCALE_LIST[(index + 1) % LOCALE_LIST.length];
    switchTo(next);
  };

  return (
    <header className="h-10 w-dvw flex justify-between py-2 px-4 lg:px-6 space-x-4">
      <div className="flex-1 min-w-0 flex items-center space-x-4 font-medium text-shadow-2xs">
        <h1 className="text-xl font-bold">
          <Link href={`/${root}`} className="text-pink italic">
            Felys
          </Link>
        </h1>
        <div className="flex-1 min-w-0 flex items-center space-x-4 overflow-x-auto whitespace-nowrap">
          <Link href={`/${root}/${compiler.route}`}>{compiler.namespace}</Link>
          <Link href={`/${root}/${chat.route}`}>{chat.namespace}</Link>
          <Link href={`/${root}/${voice.route}`}>{voice.namespace}</Link>
          <Link href={BOOK_URL} target="_blank">
            {articleNamespace}
          </Link>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <button
          className="hover:cursor-pointer"
          onClick={handleSwitchLanguage}
        >
          <LanguageIcon />
        </button>
      </div>
    </header>
  );
}
