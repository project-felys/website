"use client";

import Navigator from "@/components/navigator";
import {
  DownloadIcon,
  GenerateIcon,
  PauseIcon,
  PlayIcon,
} from "@/components/icons";
import { useConfig } from "@/lib/config/configProvider";
import { useState } from "react";
import { useTts } from "@/lib/voice/useTts";
import { makeRandomSeed } from "@/lib/voice/ttsSource";
import { WaveformProgress } from "@/lib/voice/waveformProgress";
import { formatClock, formatDuration } from "@/lib/voice/format";
import { hashText } from "@/lib/voice/hash";
import BackgroundImage from "@/components/backgroundImage";
import cyrene from "@/public/voice.jpg";

export default function Voice() {
  const configText = useConfig().voice.text;
  const [text, setText] = useState(configText.defaultText);
  const [speaker, setSpeaker] = useState(configText.defaultSpeaker);

  const sessionConfig = {
    speaker,
    task_type: "CustomVoice",
    language: configText.language,
    response_format: "pcm",
    stream_audio: true,
    seed: makeRandomSeed(),
    initial_codec_chunk_frames: 24,
    extra_params: { temperature: 0.3 },
  };

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
  } = useTts(sessionConfig);

  const isPlaying = status === "playing";
  const hasAudio = total > 0;

  return (
    <div className="h-dvh w-dvw flex flex-col items-center">
      <BackgroundImage
        src={cyrene}
        blurred={!isPlaying}
        objectPosition="object-[50%_0%]"
      />
      <Navigator />
      <div className="flex-1 flex flex-col min-h-0 p-2 gap-4 w-full lg:w-5/6">
        <div className="flex-1 flex-col gap-2 h-36 space-y-1">
          <div className="text-sm text-neutral-400 font-semibold">
            {configText.historyText}
          </div>
          <div className="flex-1 flex gap-2 overflow-x-auto min-h-0">
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
        <div className="flex-2 flex flex-col items-center justify-center min-h-0 gap-3">
          <div className="flex items-center gap-3 w-full lg:w-7/8 h-2/3">
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
            <div className="flex-1 h-full">
              <WaveformProgress
                stream={activeStream}
                cursor={cursor}
                total={total}
                onSeek={move}
                disabled={!hasAudio}
              />
            </div>
            <span className="text-xs text-neutral-400 tabular-nums">
              {formatDuration(cursor)} / {formatDuration(total)}
            </span>
          </div>
        </div>
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-end">
            <div className="px-3 py-1 flex items-center gap-4 min-w-0">
              <SpeakerPicker
                speakers={configText.speakers}
                speaker={speaker}
                onChange={setSpeaker}
              />
              <button
                onClick={() => generate(text)}
                disabled={isGenerating}
                className="flex items-center gap-1.5 text-pink disabled:opacity-30 disabled:cursor-not-allowed hover:cursor-pointer"
              >
                <GenerateIcon width={18} height={18} />
                <span className="text-lg font-semibold whitespace-nowrap">
                  {configText.generateText}
                </span>
              </button>
            </div>
          </div>
          <div className="bg-neutral-400 h-px w-full" />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={configText.placeholderText}
            className="w-full flex-1 px-4 py-2 text-center outline-none resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!isGenerating) generate(text);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

function SpeakerPicker({
  speakers,
  speaker,
  onChange,
}: {
  speakers: Record<string, string>;
  speaker: string;
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      role="listbox"
      aria-label="speaker"
      className={`flex min-w-0 items-center w-full transition-all duration-300 ease-out ${
        isOpen ? "gap-3 overflow-x-auto" : "gap-0 overflow-hidden"
      }`}
    >
      {Object.entries(speakers).map(([value, label]) => {
        const isActive = value === speaker;
        const isHidden = !isOpen && !isActive;
        return (
          <button
            key={value}
            role="option"
            aria-selected={isActive}
            aria-hidden={isHidden}
            inert={isHidden}
            onClick={() => {
              if (isOpen) {
                onChange(value);
                setIsOpen(false);
              } else {
                setIsOpen(true);
              }
            }}
            className={`shrink-0 overflow-hidden whitespace-nowrap text-sm transition-all duration-300 ease-out hover:cursor-pointer hover:text-pink ${
              isActive ? "text-pink font-semibold" : "text-neutral-400"
            } ${isHidden ? "max-w-0 opacity-0" : "max-w-40 opacity-100"}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
