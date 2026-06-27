"use client";

import Navigator from "@/components/navigator";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import cyrene from "@/public/cyrene.jpg";
import { LineStreamResult, sseToLineStream } from "@/lib/sse-stream";
import { MovieIcon } from "@/components/icons";
import { useConfig } from "@/components/i18n";
import {
  DisplayMessage,
  makeDisplayMessages,
  makeChatML,
  Role,
  useBackendHealth,
  perplexityToOpacity,
} from "@/lib/chat-sdk";

export default function Chat() {
  const configText = useConfig().chat.text;
  const [isMovieMode, setIsMovieMode] = useState(false);

  const [name, setName] = useState(configText.systemName);
  const [userInput, setUserInput] = useState(configText.healthCheckingText);
  const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>(
    makeDisplayMessages("system", configText.systemPrompt),
  );

  const [readOnly, setReadOnly] = useState(true);
  const [isClickable, setIsClickable] = useState(false);
  const [textareaKey, setTextareaKey] = useState(0);

  const lineIteratorRef = useRef<AsyncIterableIterator<LineStreamResult>>(null);
  const scrollRef = useRef<HTMLUListElement>(null);
  const isFastForwardingRef = useRef(false);
  const allowNextLineClick = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isHealthCheckingRef = useBackendHealth(
    () => backToUserInput(),
    () => setAnimatedUserInput(configText.healthCheckFailedText),
  );

  const timeout = 400;

  const setAnimatedUserInput = (line: string) => {
    setUserInput(line);
    setTextareaKey((prev) => prev + 1);
  };

  const roleToName = (role: Role) => {
    if (role === "user") {
      return configText.userName;
    } else if (role === "assistant") {
      return configText.cyreneName;
    } else {
      return configText.systemName;
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [displayMessages]);

  const consumeOneMessageWithTimeout = async (ms: number) => {
    allowNextLineClick.current = false;
    const next = await lineIteratorRef.current?.next();
    if (next && !next.done) {
      applyAssistantMessageLine(next.value);
      await new Promise((resolve) => setTimeout(resolve, ms));
      allowNextLineClick.current = true;
      return false;
    } else {
      backToUserInput();
      return true;
    }
  };

  const applyAssistantMessageLine = (value: LineStreamResult) => {
    setName(configText.cyreneName);
    setAnimatedUserInput(value.line);
    if (isMovieMode) {
      setIsClickable(true);
    }
    setDisplayMessages((prev) => [
      ...prev,
      { role: "assistant", content: value.line, perplexity: value.perplexity },
    ]);
  };

  const backToUserInput = () => {
    lineIteratorRef.current = null;
    inputRef.current?.focus();
    setName(configText.userName);
    setUserInput("");
    setIsClickable(false);
    setReadOnly(false);
  };

  const startFastForwardingLoop = async (ms: number) => {
    while (isFastForwardingRef.current) {
      const done = await consumeOneMessageWithTimeout(ms);
      if (done) {
        break;
      }
    }
  };

  useEffect(() => {
    isFastForwardingRef.current = !isMovieMode;
    if (!isHealthCheckingRef.current) {
      startFastForwardingLoop(timeout);
    }
  }, [isMovieMode]);

  const handleEnterKeyDown = async (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (readOnly || e.key !== "Enter") {
      return;
    }

    e.preventDefault();
    if (!userInput) {
      return;
    }

    setReadOnly(true);

    const userLines = makeDisplayMessages("user", userInput);
    const nextDisplayMessages = [...displayMessages, ...userLines];
    setDisplayMessages(nextDisplayMessages);

    try {
      setName(configText.systemName);
      setAnimatedUserInput(configText.sendingMessageText);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(makeChatML(nextDisplayMessages)),
      });

      setAnimatedUserInput(configText.waitingForReplyText);

      lineIteratorRef.current = sseToLineStream(response);
      await consumeOneMessageWithTimeout(timeout);
      await startFastForwardingLoop(timeout);
    } catch (e) {
      setAnimatedUserInput(configText.failedToSendMessageText);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      backToUserInput();
    }
  };

  const handleChatClick = async () => {
    if (allowNextLineClick.current) {
      await consumeOneMessageWithTimeout(timeout);
    }
  };

  return (
    <div className="h-dvh w-dvw flex flex-col font-semibold">
      <BackgroundImage blurred={!isMovieMode} />
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
          {displayMessages.map((msg, index) => (
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
          className="flex-3 flex flex-col h-full items-center p-1 bg-linear-to-t from-black/70 to-transparent space-y-1"
          style={{ cursor: isClickable ? "pointer" : "auto" }}
          onClick={handleChatClick}
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
              {name}
            </text>
          </svg>
          <div className="bg-yellow-50 h-px w-11/12 md:w-3/4" />
          <textarea
            ref={inputRef}
            key={textareaKey}
            className="flex-1 text-lg xl:text-xl w-11/12 md:w-3/4 resize-none text-center outline-none overflow-y-auto fade-in-on-mount text-shadow-2xs placeholder:text-neutral-100/70"
            style={{ cursor: "inherit" }}
            placeholder={configText.placeholderText}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleEnterKeyDown}
            readOnly={readOnly}
          />
          {isClickable && (
            <i className="text-sm fade-in-half-on-mount">
              {configText.clickToProceedHint}
            </i>
          )}
        </div>
      </div>
    </div>
  );
}

function BackgroundImage({ blurred }: { blurred: boolean }) {
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
          src={cyrene}
          alt=""
          fill
          placeholder="blur"
          className="object-cover object-[70%_50%]"
          onLoad={() => setVisible(true)}
        />
      </div>
      <div
        className="absolute inset-0 bg-black transition-opacity duration-500 ease-in-out"
        style={{ opacity: blurred ? 0.7 : 0.2 }}
      />
    </div>
  );
}
