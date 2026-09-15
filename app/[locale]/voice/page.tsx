"use client";

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
import { OptionPicker } from "@/lib/voice/optionPicker";
import { WaveformProgress } from "@/lib/voice/waveformProgress";
import { formatClock, formatDuration } from "@/lib/voice/format";
import { hashText } from "@/lib/voice/hash";
import { useBackendHealth } from "@/lib/useBackendHealth";
import BackgroundImage from "@/components/backgroundImage";
import cyrene from "@/public/voice.jpg";

export default function Voice() {
  const configText = useConfig().voice.text;
  const [text, setText] = useState(configText.defaultText);
  const [speaker, setSpeaker] = useState(configText.defaultSpeaker);
  const [language, setLanguage] = useState(configText.defaultLanguage);
  const [openPicker, setOpenPicker] = useState<"language" | "speaker" | null>(
    null,
  );

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
    language,
    response_format: "pcm",
    stream: true,
    stream_format: "audio",
    initial_codec_chunk_frames: 24,
    extra_params: { temperature: 0.9 },
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
    <div className="flex-1 min-h-0 flex flex-col items-center font-semibold">
      <BackgroundImage
        src={cyrene}
        blurred={!isPlaying}
        objectPosition="object-[50%_0%]"
      />
      <div className="flex-1 w-full min-h-0 flex flex-col items-center gap-4">
        <div
          ref={historyRef}
          className="flex-2 min-h-0 w-full flex flex-col overflow-y-auto p-2 items-center space-y-2"
        >
          {Object.entries(configText.informationTextList).map(
            ([key, value]) => (
              <div
                key={key}
                className="w-full md:w-3/4 xl:w-3/5 flex items-stretch text-neutral-300"
              >
                <div className="w-20 shrink-0 text-end">{key}</div>
                <div className="w-0.5 h-full mx-2 shrink-0 bg-neutral-300" />
                <div className="flex-1 min-w-0 whitespace-pre-wrap">{value}</div>
              </div>
            ),
          )}
          {history.map((item) => (
            <HistoryCard
              key={item.id}
              item={item}
              isActive={activeId === item.id}
              speaker={configText.speakers[item.speaker] ?? item.speaker}
              language={configText.languages[item.language] ?? item.language}
              onSelect={select}
              onDownload={download}
            />
          ))}
        </div>
        <div className="flex-1 w-full lg:w-5/6 min-h-0 flex flex-col items-center justify-center gap-3 p-2">
          <div className="flex h-full w-full lg:w-7/8 items-center gap-3">
            <button
              onClick={() => (isPlaying ? pause() : play())}
              disabled={!hasAudio}
              aria-label={
                isPlaying ? configText.pauseText : configText.playText
              }
              className="hover:cursor-pointer rounded text-pink disabled:cursor-not-allowed disabled:opacity-30"
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
        <div className="flex-1 w-full lg:w-5/6 flex flex-col items-center p-2">
          <div className="flex w-full items-center justify-end">
            <div className="flex min-w-0 items-center gap-4 px-3 py-1">
              <OptionPicker
                label="speaker"
                options={configText.speakers}
                value={speaker}
                open={openPicker === "speaker"}
                onOpenChange={(isOpen) =>
                  setOpenPicker(isOpen ? "speaker" : null)
                }
                onChange={setSpeaker}
              />
              <OptionPicker
                label="language"
                options={configText.languages}
                value={language}
                open={openPicker === "language"}
                onOpenChange={(isOpen) =>
                  setOpenPicker(isOpen ? "language" : null)
                }
                onChange={setLanguage}
              />
              <button
                onClick={() => generate(text)}
                disabled={isGenerating || !isReady}
                className="flex items-center gap-1.5 hover:cursor-pointer text-pink disabled:cursor-not-allowed disabled:opacity-30"
              >
                <GenerateIcon width={18} height={18} />
                <span className="text-lg font-semibold whitespace-nowrap">
                  {configText.generateText}
                </span>
              </button>
            </div>
          </div>
          <div className="h-px w-full bg-neutral-400" />
          <textarea
            value={healthNotice ?? text}
            onChange={(e) => setText(e.target.value)}
            placeholder={configText.placeholderText}
            readOnly={!isReady}
            className="flex-1 w-full px-4 py-2 text-lg text-center outline-none resize-none"
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
  speaker: speakerLabel,
  language: languageLabel,
  onSelect,
  onDownload,
}: {
  item: VoiceHistoryEntry;
  isActive: boolean;
  speaker: string;
  language: string;
  onSelect: (id: number) => void;
  onDownload: (id: number) => void;
}) {
  return (
    <div
      onClick={() => onSelect(item.id)}
      className={`w-full md:w-3/4 xl:w-3/5 flex items-stretch space-x-2 hover:cursor-pointer hover:text-pink ${isActive ? "text-pink" : ""}`}
    >
      <div className="flex min-w-0">
        <div className="w-20 shrink-0 text-end">{speakerLabel}</div>
        <div className="w-0.5 h-full mx-2 shrink-0 bg-neutral-100" />
        <div className="flex min-w-0 flex-col">
          <div className="min-w-0 whitespace-pre-wrap">{item.text}</div>
          <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap text-xs text-neutral-500">
            <span>{languageLabel}</span>
            <span>·</span>
            <span className="tabular-nums">{hashText(item.text)}</span>
            <span>·</span>
            <span className="tabular-nums">{formatClock(item.time)}</span>
          </div>
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDownload(item.id);
        }}
        disabled={!item.sealed}
        className="self-center shrink-0 hover:cursor-pointer text-pink disabled:cursor-not-allowed disabled:opacity-30"
      >
        <DownloadIcon width={20} height={20} />
      </button>
    </div>
  );
}
