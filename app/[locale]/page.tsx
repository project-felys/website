"use client";

import { useConfig } from "@/lib/config/configProvider";
import Navigator from "@/components/navigator";

export default function Home() {
  const config = useConfig();

  return (
    <div className="h-dvh w-dvw flex flex-col">
      <Navigator />
      <div className="flex-1 flex items-center justify-center">
        <div
          key={config.root}
          className="space-y-1 text-center m-3 fade-in-on-mount"
        >
          <h1 className="text-4xl font-bold">{config.title}</h1>
          <p className="text-pink">{config.subTitle}</p>
        </div>
      </div>
    </div>
  );
}
