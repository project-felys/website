"use client";

import Navigator from "@/components/navigator";
import { useEffect, useRef, useState } from "react";
import cyrene from "@/public/chat.jpg";
import { MovieIcon } from "@/components/icons";
import { useConfig } from "@/components/i18n";
import BackgroundImage from "@/components/background-image";
import { useChatSession } from "@/lib/chat/useChatSession";
import { perplexityToOpacity, type Role } from "@/lib/chat/sdk";

export default function Chat() {
  const configText = useConfig().chat.text;
  const [isMovieMode, setIsMovieMode] = useState(false);

  const {
    status,
    messages,
    speaker,
    line,
    animationKey,
    edit,
    send,
    advance,
    canAdvance,
  } = useChatSession({ manualAdvance: isMovieMode, text: configText });

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

  const handleEnterKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
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
      <BackgroundImage
        src={cyrene}
        blurred={!isMovieMode}
        objectPosition="object-[70%_50%]"
      />
      <Navigator>
        <button
          className="hover:cursor-pointer fade-in-on-mount"
          onClick={() => setIsMovieMode((x) => !x)}
        >
          <MovieIcon />
        </button>
      </Navigator>
      <div className="flex-1 flex flex-col min-h-0">
        <ul
          ref={scrollRef}
          className="flex-8 overflow-y-auto flex flex-col h-full p-2 items-center space-y-2 transition-opacity duration-300 ease-in-out"
          style={{
            opacity: isMovieMode ? 0 : 1,
            pointerEvents: isMovieMode ? "none" : "auto",
          }}
        >
          {Object.entries(configText.informationTextList).map(
            ([key, value]) => (
              <li
                key={key}
                className="w-full md:w-3/4 xl:w-3/5 flex items-stretch text-neutral-300"
              >
                <div className="w-20 shrink-0 text-end">{key}</div>
                <div className="w-0.5 bg-neutral-300 h-full mx-2" />
                <div className="flex-1 whitespace-pre-wrap">{value}</div>
              </li>
            ),
          )}
          {messages.map((msg, index) => (
            <li
              key={index}
              className="w-full md:w-3/4 xl:w-3/5 flex items-stretch"
            >
              <div className="w-20 shrink-0 text-end">
                {roleToName(msg.role)}
              </div>
              <div className="w-0.5 bg-neutral-100 h-full mx-2" />
              <div
                className="flex-1 whitespace-pre-wrap"
                style={{
                  opacity: 0.1 + 0.9 * perplexityToOpacity(msg.perplexity ?? 2),
                }}
              >
                {msg.content}
              </div>
            </li>
          ))}
        </ul>
        <div
          className="flex-3 flex flex-col h-full items-center p-2 bg-linear-to-t from-black/70 to-transparent space-y-1"
          style={{ cursor: canAdvance ? "pointer" : "auto" }}
          onClick={advance}
        >
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
            className="flex-1 text-lg xl:text-xl w-11/12 md:w-3/4 resize-none text-center outline-none overflow-y-auto fade-in-on-mount text-shadow-2xs placeholder:text-neutral-100/70"
            style={{ cursor: "inherit" }}
            placeholder={configText.placeholderText}
            value={line}
            onChange={(e) => edit(e.target.value)}
            onKeyDown={handleEnterKeyDown}
            readOnly={readOnly}
          />
          {canAdvance && (
            <i className="text-sm fade-in-half-on-mount">
              {configText.clickToProceedHint}
            </i>
          )}
        </div>
      </div>
    </div>
  );
}
