"use client";

import Navigator from "@/components/navigator";
import { useEffect, useRef } from "react";
import cyrene from "@/public/chat.jpg";
import { useConfig } from "@/lib/config/configProvider";
import BackgroundImage from "@/components/backgroundImage";
import { useChatSession } from "@/lib/chat/useChatSession";
import { perplexityToOpacity, type Role } from "@/lib/chat/message";

export default function Chat() {
  const configText = useConfig().chat.text;

  const { status, messages, speaker, line, animationKey, edit, send } =
    useChatSession(configText);

  const scrollRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // The box is editable only while the session is idle.
  const readOnly = status !== "idle";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  useEffect(() => {
    if (!readOnly) {
      inputRef.current?.focus();
    }
  }, [readOnly]);

  const roleToName = (role: Role) => {
    if (role === "user") {
      return configText.userName;
    } else if (role === "assistant") {
      return configText.cyreneName;
    } else {
      return configText.systemName;
    }
  };

  const handleEnterKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (readOnly || e.key !== "Enter") {
      return;
    }

    e.preventDefault();
    if (!line) {
      return;
    }

    void send(line);
  };

  return (
    <div className="h-dvh w-dvw flex flex-col font-semibold">
      <BackgroundImage src={cyrene} blurred objectPosition="object-[70%_50%]" />
      <Navigator />
      <div className="flex-1 flex flex-col min-h-0">
        <ul
          ref={scrollRef}
          className="flex-8 min-h-0 flex flex-col overflow-y-auto p-2 items-center space-y-2"
        >
          {Object.entries(configText.informationTextList).map(
            ([key, value]) => (
              <li
                key={key}
                className="w-full md:w-3/4 xl:w-3/5 flex items-stretch text-neutral-300"
              >
                <div className="w-20 shrink-0 text-end">{key}</div>
                <div className="w-0.5 h-full mx-2 shrink-0 bg-neutral-300" />
                <div className="flex-1 min-w-0 whitespace-pre-wrap">
                  {value}
                </div>
              </li>
            ),
          )}
          {messages.toDisplayMessages().map((msg, index) => (
            <li
              key={index}
              className="w-full md:w-3/4 xl:w-3/5 flex items-stretch"
            >
              <div className="w-20 shrink-0 text-end">
                {roleToName(msg.role)}
              </div>
              <div className="w-0.5 h-full mx-2 shrink-0 bg-neutral-100" />
              <div
                className="flex-1 min-w-0 whitespace-pre-wrap"
                style={{
                  opacity: 0.1 + 0.9 * perplexityToOpacity(msg.perplexity ?? 2),
                }}
              >
                {msg.line}
              </div>
            </li>
          ))}
        </ul>
        <div className="flex-3 flex flex-col items-center p-2 space-y-1 bg-linear-to-t from-black/70 to-transparent">
          <svg viewBox="0 0 100 20" className="h-10 w-full">
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="central"
              paintOrder="stroke"
              fill="currentColor"
              strokeWidth={1}
              className="font-bold text-yellow-100 stroke-neutral-900/70"
            >
              {speaker}
            </text>
          </svg>
          <div className="bg-yellow-50 h-px w-11/12 md:w-3/4" />
          <textarea
            ref={inputRef}
            key={animationKey}
            className="flex-1 w-11/12 md:w-3/4 text-lg xl:text-xl text-center text-shadow-2xs resize-none outline-none overflow-y-auto placeholder:text-neutral-100/70 fade-in-on-mount"
            placeholder={configText.placeholderText}
            value={line}
            onChange={(e) => edit(e.target.value)}
            onKeyDown={handleEnterKeyDown}
            readOnly={readOnly}
          />
        </div>
      </div>
    </div>
  );
}
