"use client";

import Navigator from "@/components/navigator";
import Editor from "@monaco-editor/react";
import { useCompiler } from "@/lib/compiler/useCompiler";
import { monacoConfig } from "@/lib/compiler/monaco";
import {
  CollectionIcon,
  CompilationIcon,
  ExecutionIcon,
} from "@/components/icons";
import elysia from "@/public/compiler.jpg";
import { useConfig } from "@/components/i18n";
import { useState } from "react";
import BackgroundImage from "@/components/background-image";

export default function Compiler() {
  const configText = useConfig().compiler.text;

  const [modalOpen, setModalOpen] = useState(false);

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
  const busy = isCompiling || isExecuting;

  const select = <T,>(working: T, compile: T, execute: T): T => {
    return busy ? working : program.binary === undefined ? compile : execute;
  };

  return (
    <div className="h-dvh w-dvw flex flex-col">
      <BackgroundImage
        src={elysia}
        blurred={program.name !== "beloved.fs"}
        objectPosition="object-[80%_50%]"
      />
      <dialog
        open={modalOpen}
        className="h-dvh w-dvw z-20 fade-in-on-mount bg-black/70 text-neutral-100 font-semibold"
      >
        <div className="h-full flex items-center justify-center">
          <ul className="max-h-2/3 w-full flex flex-col items-center space-y-4 overflow-auto">
            {codebase.programs.map((value, key) => (
              <li key={key} className="w-64 text-lg font-bold text-neutral-300">
                <button
                  className={`p-2 w-full  border-neutral-800 border-x-3 ${
                    codebase.cursor === key
                      ? "bg-neutral-800"
                      : "bg-neutral-900"
                  }`}
                  onClick={() => {
                    moveCursor(key);
                    setModalOpen(false);
                  }}
                >
                  {value.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </dialog>
      <Navigator>
        <>
          <button
            className="lg:hidden z-50 hover:cursor-pointer fade-in-on-mount"
            onClick={() => setModalOpen((x) => !x)}
          >
            <CollectionIcon />
          </button>
          <div
            className="flex items-center fade-in-on-mount"
            key={select("working", "compile", "execute")}
          >
            {select(
              <div className="loader" />,
              <button className="hover:cursor-pointer" onClick={handleCompile}>
                <CompilationIcon />
              </button>,
              <button className="hover:cursor-pointer" onClick={handleExecute}>
                <ExecutionIcon />
              </button>,
            )}
          </div>
        </>
      </Navigator>
      <div className="flex-1 flex min-h-0 border-t border-black">
        <div className="hidden w-1/5 lg:block border-e border-black">
          <ul>
            {codebase.programs.map((value, key) => (
              <li key={key}>
                <button
                  className={`py-2 px-4 w-full text-start hover:cursor-pointer hover:bg-neutral-100/10 ${
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
              loading={<div className="vscode-loader" />}
              onMount={monacoConfig}
              value={program.code}
              onChange={handleCodeChange}
            />
          </div>
          <div className="h-1/3 flex flex-col w-full border-t border-black p-3">
            <div>
              <code className="font-bold">
                Felys v{process.env.NEXT_PUBLIC_BUILD_DATE}{" "}
                {configText.runningOn} WASM
              </code>
            </div>
            {program.outcome && (
              <div className="flex-1 overflow-auto mt-4">
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
