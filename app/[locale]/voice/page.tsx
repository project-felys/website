"use client";

import Navigator from "@/components/navigator";
import { useConfig } from "@/components/i18n";
import { useMemo, useState } from "react";
import { ttsDownloadFilename } from "@/lib/audio";
import { useTts } from "@/lib/useTts";

export default function Page() {
  const configText = useConfig().voice.text;
  const [text, setText] = useState(configText.defaultText);

  const sessionConfig = useMemo(
    () => ({
      speaker: "cyrene",
      task_type: "CustomVoice",
      language: configText.language,
      response_format: "pcm",
      stream_audio: true,
    }),
    [configText.language],
  );

  const { canPlay, isPlaying, isGenerating, generate, play, download } =
    useTts(sessionConfig);

  return (
    <div className="h-dvh w-dvw flex flex-col">
      <Navigator />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl flex flex-col sm:flex-row sm:items-center gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={configText.placeholderText}
            className="flex-1 w-full h-32 sm:h-40 px-4 py-2 rounded bg-neutral-800 text-neutral-100 outline-none border border-neutral-700 focus:border-pink resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                generate(text);
              }
            }}
          />
          <div className="flex sm:flex-col gap-2 sm:self-stretch">
            <button
              onClick={play}
              disabled={!canPlay || isPlaying}
              className="flex-1 min-w-0 sm:min-w-36 px-4 py-2 rounded bg-pink text-neutral-900 font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:cursor-pointer"
            >
              {isPlaying ? configText.playingText : configText.playText}
            </button>
            <button
              onClick={() => generate(text)}
              disabled={isGenerating}
              className="flex-1 min-w-0 sm:min-w-36 px-4 py-2 rounded bg-neutral-100 text-neutral-900 font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:cursor-pointer"
            >
              {isGenerating
                ? configText.generatingText
                : configText.generateText}
            </button>
            <button
              onClick={() => download(ttsDownloadFilename())}
              disabled={!canPlay || isGenerating}
              className="flex-1 min-w-0 sm:min-w-36 px-4 py-2 rounded bg-neutral-100 text-neutral-900 font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:cursor-pointer"
            >
              {configText.downloadText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
