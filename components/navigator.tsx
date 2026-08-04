"use client";

import Link from "next/link";
import { useConfig } from "./i18n";
import { usePathname, useRouter } from "next/navigation";
import { EN, ZH, type Locale } from "@/lib/config";
import { LanguageIcon } from "./icons";

export default function Navigator({
  children,
}: {
  children?: React.ReactNode;
}) {
  const { root, articleNamespace, chat, compiler, voice } = useConfig();
  const pathname = usePathname();
  const router = useRouter();

  const switchTo = (locale: Locale) => {
    const newPathname = pathname.replace(`/${root}`, `/${locale}`);
    router.push(newPathname);
  };

  const handleSwitchLanguage = () => {
    switchTo(root === EN.root ? ZH.root : EN.root);
  };

  return (
    <header className="h-10 w-dvw flex justify-between py-2 px-4 lg:px-6 space-x-4 bg-linear-to-b from-black/20 to-transparent">
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
          <Link href="https://book.felys.dev" target="_blank">
            {articleNamespace}
          </Link>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        {children}
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
