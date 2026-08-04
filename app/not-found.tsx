import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "404",
};

export default function NotFound() {
  return (
    <html lang="en" className="antialiased bg-neutral-900 text-neutral-100">
      <body>
        <div className="h-dvh w-dvw flex items-center justify-center">
          <div className="flex items-center text-xl font-semibold">
            Page Not Found
            <div className="mx-3 w-0.5 h-5 bg-neutral-100" />
            <Link href="/" className="text-pink">
              Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
