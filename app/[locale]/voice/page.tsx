"use client";

import Navigator from "@/components/navigator";
import {
  DownloadIcon,
  GenerateIcon,
  PauseIcon,
  PlayIcon,
} from "@/components/icons";
import { useConfig } from "@/components/i18n";
import { useMemo, useState } from "react";
import { useTtsStream } from "@/lib/voice/useTtsStream";
import { WaveformProgress } from "@/lib/voice/WaveformProgress";
import { formatClock, formatDuration } from "@/lib/voice/wav";
import { hashText } from "@/lib/voice/hash";
import BackgroundImage from "@/components/background-image";
import cyrene from "@/public/voice.jpg";

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
      initial_codec_chunk_frames: 24000,
    }),
    [configText.language],
  );

  const {
    isGenerating,
    history,
    activeId,
    activeStream,
    status,
    cursor,
    total,
    generate,
    select,
    download,
    move,
    play,
    pause,
  } = useTtsStream(sessionConfig);

  const isPlaying = status === "playing";
  const hasAudio = total > 0;

  return (
    <div className="h-dvh w-dvw flex flex-col">
      <BackgroundImage
        src={cyrene}
        blurred={!isPlaying}
        objectPosition="object-[50%_0%]"
      />
      <Navigator />
      <div className="flex-1 flex flex-col min-h-0 p-4 gap-4">
        <div className="shrink-0 flex flex-col gap-2 h-36">
          <div className="text-sm text-neutral-400 font-semibold">
            {configText.historyText}
          </div>
          <div className="flex-1 flex gap-2 overflow-x-auto pb-1 min-h-0">
            {history.length === 0 ? (
              <div className="flex items-center justify-center w-28 h-28 shrink-0 rounded border border-neutral-700 bg-neutral-900/50 text-sm text-neutral-600">
                {configText.noHistoryText}
              </div>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => select(item.id)}
                  title={item.text}
                  className={`flex flex-col items-center justify-center gap-1 w-28 h-28 shrink-0 rounded border border-neutral-700 bg-neutral-900/50 hover:cursor-pointer hover:bg-neutral-800/50 ${activeId === item.id ? "bg-neutral-800" : ""}`}
                >
                  <code className="text-sm text-pink">
                    {hashText(item.text)}
                  </code>
                  <span className="text-xs text-neutral-500 tabular-nums">
                    {formatClock(item.time)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      download(item.id);
                    }}
                    disabled={!item.sealed}
                    className="p-1 text-pink hover:cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <DownloadIcon width={20} height={20} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center min-h-0 gap-3">
          <div className="flex items-center gap-3 w-full max-w-5xl">
            <button
              onClick={() => (isPlaying ? pause() : play())}
              disabled={!hasAudio}
              aria-label={
                isPlaying ? configText.pauseText : configText.playText
              }
              className="rounded text-pink disabled:opacity-30 disabled:cursor-not-allowed hover:cursor-pointer"
            >
              {isPlaying ? (
                <PauseIcon width={32} height={32} />
              ) : (
                <PlayIcon width={32} height={32} />
              )}
            </button>
            <WaveformProgress
              stream={activeStream}
              cursor={cursor}
              total={total}
              onSeek={move}
              disabled={!hasAudio}
              className="h-48"
            />
            <span className="text-xs text-neutral-400 tabular-nums">
              {formatDuration(cursor)} / {formatDuration(total)}
            </span>
          </div>
        </div>
        <div className="shrink-0 flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <p className="text-xs text-neutral-400">{configText.notice}</p>
            <button
              onClick={() => generate(text)}
              disabled={isGenerating}
              className="px-3 py-1 flex items-center gap-1.5 text-lg text-pink font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:cursor-pointer"
            >
              <GenerateIcon width={18} height={18} />
              {configText.generateText}
            </button>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={configText.placeholderText}
            className="w-full px-4 py-2 text-center rounded border border-neutral-700 bg-neutral-900/50 text-neutral-100 outline-none resize-none min-h-24"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                generate(text);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
