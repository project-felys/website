"use client";

import Image, { type StaticImageData } from "next/image";
import { useState } from "react";

export default function BackgroundImage({
  src,
  blurred,
  objectPosition,
}: {
  src: StaticImageData;
  blurred: boolean;
  objectPosition: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden transition-all duration-1000 ease-in-out"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div
        className={`absolute inset-0 transition-all duration-500 ease-in-out ${
          blurred ? "scale-105 blur-md" : "scale-100 blur-0"
        }`}
      >
        <Image
          src={src}
          alt=""
          fill
          placeholder="blur"
          className={`object-cover ${objectPosition}`}
          onLoad={() => setVisible(true)}
        />
      </div>
      <div
        className="absolute inset-0 bg-black transition-opacity duration-500 ease-in-out"
        style={{ opacity: blurred ? 0.7 : 0.4 }}
      />
    </div>
  );
}
