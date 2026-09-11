"use client";

import Navigator from "@/components/navigator";
import {
  DownloadIcon,
  GenerateIcon,
  PauseIcon,
  PlayIcon,
} from "@/components/icons";
import { useConfig } from "@/lib/config/configProvider";
import { TTS_HEALTH_URL } from "@/lib/config/endpoints";
import { useEffect, useRef, useState } from "react";
import { useTts, type VoiceHistoryEntry } from "@/lib/voice/useTts";
import { makeRandomSeed } from "@/lib/voice/ttsSource";
import { WaveformProgress } from "@/lib/voice/waveformProgress";
import { formatDuration } from "@/lib/voice/format";
import { useBackendHealth } from "@/lib/useBackendHealth";
import BackgroundImage from "@/components/backgroundImage";
import cyrene from "@/public/voice.jpg";

export default function Voice() {
  const configText = useConfig().voice.text;
  const [text, setText] = useState(configText.defaultText);
  const [speaker, setSpeaker] = useState(configText.defaultSpeaker);

  const health = useBackendHealth({ url: TTS_HEALTH_URL });
  const isReady = health === "ready";
  const healthNotice = isReady
    ? null
    : health === "checking"
      ? configText.healthCheckingText
      : configText.healthCheckFailedText;

  const sessionConfig = {
    speaker,
    task_type: "CustomVoice",
    language: configText.language,
    response_format: "pcm",
    stream_audio: true,
    seed: makeRandomSeed(),
    initial_codec_chunk_frames: 24,
    extra_params: { temperature: 0.7 },
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

  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTo({
        top: historyRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [history]);

  return (
    <div className="h-dvh w-dvw flex font-semibold flex-col items-center">
      <BackgroundImage
        src={cyrene}
        blurred={!isPlaying}
        objectPosition="object-[50%_0%]"
      />
      <Navigator />
      <div className="flex-1 flex flex-col min-h-0 p-2 gap-4 w-full items-center">
        <div
          ref={historyRef}
          className="flex-2 flex flex-col items-center space-y-2 overflow-y-auto min-h-0 w-full"
        >
          {Object.entries(configText.informationTextList).map(
            ([key, value]) => (
              <div
                key={key}
                className="w-full md:w-4/5 xl:w-3/5 flex items-stretch text-neutral-300"
              >
                <div className="w-20 shrink-0 text-end">{key}</div>
                <div className="w-0.5 bg-neutral-300 h-full mx-2 shrink-0" />
                <div className="whitespace-pre-wrap min-w-0">{value}</div>
              </div>
            ),
          )}
          {history.map((item) => (
            <HistoryCard
              key={item.id}
              item={item}
              isActive={activeId === item.id}
              speakerLabel={configText.speakers[item.speaker] ?? item.speaker}
              onSelect={select}
              onDownload={download}
            />
          ))}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center min-h-0 gap-3 w-full lg:w-5/6">
          <div className="flex items-center gap-3 w-full lg:w-7/8 h-full">
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
        <div className="flex-1 flex flex-col items-center w-full lg:w-5/6">
          <div className="flex items-center w-full justify-end">
            <div className="px-3 py-1 flex items-center gap-4 min-w-0">
              <SpeakerPicker
                speakers={configText.speakers}
                speaker={speaker}
                onChange={setSpeaker}
              />
              <button
                onClick={() => generate(text)}
                disabled={isGenerating || !isReady}
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
            value={healthNotice ?? text}
            onChange={(e) => setText(e.target.value)}
            placeholder={configText.placeholderText}
            readOnly={!isReady}
            className="w-full flex-1 px-4 py-2 text-center outline-none resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!isGenerating && isReady) generate(text);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

function HistoryCard({
  item,
  isActive,
  speakerLabel,
  onSelect,
  onDownload,
}: {
  item: VoiceHistoryEntry;
  isActive: boolean;
  speakerLabel: string;
  onSelect: (id: number) => void;
  onDownload: (id: number) => void;
}) {
  return (
    <div
      onClick={() => onSelect(item.id)}
      className={`w-full md:w-4/5 xl:w-3/5 flex items-stretch space-x-2 hover:cursor-pointer hover:text-pink ${isActive ? "text-pink" : ""}`}
    >
      <div className="flex min-w-0">
        <div className="w-20 shrink-0 text-end">{speakerLabel}</div>
        <div className="w-0.5 bg-neutral-100 h-full mx-2 shrink-0" />
        <div className="whitespace-pre-wrap min-w-0">{item.text}</div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDownload(item.id);
        }}
        disabled={!item.sealed}
        className="self-center shrink-0 text-pink hover:cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <DownloadIcon width={20} height={20} />
      </button>
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
