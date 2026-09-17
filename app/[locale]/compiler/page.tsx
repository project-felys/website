"use client";

import Editor from "@monaco-editor/react";
import { useCompiler } from "@/lib/compiler/useCompiler";
import { configureMonaco } from "@/lib/compiler/monaco";
import {
  CollectionIcon,
  CompilationIcon,
  ExecutionIcon,
} from "@/components/icons";
import elysia from "@/public/compiler.jpg";
import { useConfig } from "@/lib/config/configProvider";
import { useState } from "react";
import BackgroundImage from "@/components/backgroundImage";

export default function Compiler() {
  const config = useConfig();
  const configText = config.compiler.text;

  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    codebase,
    isCompiling,
    isExecuting,
    moveCursor,
    handleCompile,
    handleExecute,
    handleCodeChange,
  } = useCompiler();

  const program = codebase.programs[codebase.cursor];
  const isBusy = isCompiling || isExecuting;

  const select = <T,>(working: T, compile: T, execute: T): T => {
    return isBusy ? working : program.binary === undefined ? compile : execute;
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {config.root === "zh" && (
        <BackgroundImage
          src={elysia}
          blurred={program.name !== "beloved.fs"}
          objectPosition="object-[80%_50%]"
        />
      )}
      <dialog
        open={isModalOpen}
        className="z-20 h-dvh w-dvw font-semibold bg-black/70 text-neutral-100 fade-in-on-mount"
      >
        <div className="flex h-full items-center justify-center">
          <ul className="flex flex-col items-center w-full max-h-2/3 space-y-4 overflow-auto">
            {codebase.programs.map((value, key) => (
              <li key={key} className="w-64 text-lg font-bold text-neutral-300">
                <button
                  className={`w-full p-2 border-x-3 border-neutral-800 ${
                    codebase.cursor === key
                      ? "bg-neutral-800"
                      : "bg-neutral-900"
                  }`}
                  onClick={() => {
                    moveCursor(key);
                    setIsModalOpen(false);
                  }}
                >
                  {value.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </dialog>
      <div className="flex flex-1 min-h-0 border-t border-black">
        <div className="hidden w-1/5 border-e border-black lg:block">
          <ul>
            {codebase.programs.map((value, key) => (
              <li key={key}>
                <button
                  className={`w-full px-4 py-2 text-start hover:bg-neutral-100/10 hover:cursor-pointer ${
                    codebase.cursor === key ? "bg-neutral-100/10" : ""
                  }`}
                  onClick={() => moveCursor(key)}
                >
                  {value.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="w-full lg:w-4/5">
          <div className="h-2/3">
            <Editor
              options={{
                lineNumbersMinChars: 3,
                fontSize: 16,
                scrollbar: { horizontal: "hidden" },
                stickyScroll: { enabled: false },
              }}
              defaultLanguage="felys"
              theme="felys-dark"
              loading={<div className="vscode-loader" />}
              beforeMount={configureMonaco}
              value={program.code}
              onChange={handleCodeChange}
            />
          </div>
          <div className="flex flex-col h-1/3 p-3 border-t border-black">
            <div className="flex items-center justify-between">
              <code className="font-bold">
                Felys v{process.env.NEXT_PUBLIC_BUILD_DATE}{" "}
                {configText.runningOn} WASM
              </code>
              <div className="flex items-center space-x-4">
                <button
                  className="lg:hidden hover:cursor-pointer fade-in-on-mount"
                  onClick={() => setIsModalOpen((x) => !x)}
                >
                  <CollectionIcon />
                </button>
                <div
                  className="flex items-center fade-in-on-mount"
                  key={select("working", "compile", "execute")}
                >
                  {select(
                    <div className="loader" />,
                    <button
                      className="text-pink hover:cursor-pointer"
                      onClick={handleCompile}
                    >
                      <CompilationIcon />
                    </button>,
                    <button
                      className="text-pink hover:cursor-pointer"
                      onClick={handleExecute}
                    >
                      <ExecutionIcon />
                    </button>,
                  )}
                </div>
              </div>
            </div>
            {program.outcome && (
              <div className="flex-1 mt-4 overflow-auto">
                {program.outcome.stdout && (
                  <div className="whitespace-pre-wrap">
                    <code>{program.outcome.stdout}</code>
                  </div>
                )}
                <div className="whitespace-pre-wrap">
                  {program.outcome.success ? (
                    <code>
                      <b className="text-pink">Exit: </b>
                      {program.outcome.result}
                    </code>
                  ) : (
                    <code className="text-red-400">
                      {program.outcome.result}
                    </code>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
