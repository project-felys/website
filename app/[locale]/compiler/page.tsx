"use client";

import Navigator from "@/components/navigator";
import Editor, { Monaco } from "@monaco-editor/react";
import { editor } from "monaco-editor";
import { CODEBASE } from "@/lib/codebase";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CollectionIcon,
  CompilationIcon,
  ExecutionIcon,
} from "@/components/icons";
import Image from "next/image";
import elysia from "@/public/elysia.jpg";
import { useConfig } from "@/components/i18n";

export default function Compiler() {
  const configText = useConfig().compiler.text;

  const [codebase, setCodebase] = useState(CODEBASE);
  const program = codebase.programs[codebase.cursor];
  const outcome = program.outcome;
  const code = program.code;

  const [modalOpen, setModalOpen] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const compileWorkerRef = useRef<Worker | null>(null);
  const executeWorkerRef = useRef<Worker | null>(null);

  const select = (working: any, compile: any, execute: any) => {
    return isCompiling || isExecuting
      ? working
      : program.binary === undefined
        ? compile
        : execute;
  };

  useEffect(() => {
    return () => {
      compileWorkerRef.current?.terminate();
      executeWorkerRef.current?.terminate();
    };
  }, []);

  const handleCompile = () => {
    if (isCompiling) return;

    if (compileWorkerRef.current) {
      compileWorkerRef.current.terminate();
    }

    const worker = new Worker(
      new URL("@/lib/workers/compile.ts", import.meta.url),
    );
    compileWorkerRef.current = worker;
    setIsCompiling(true);

    const timeoutId = setTimeout(() => {
      worker.terminate();
      compileWorkerRef.current = null;
      setIsCompiling(false);

      const outcome = {
        stdout: "",
        result: "δ-me13: compiler timeout",
        success: false,
      };
      setCodebase((prev) => ({
        ...prev,
        programs: prev.programs.map((x, i) =>
          i === prev.cursor ? { ...x, outcome } : x,
        ),
      }));
    }, 5000);

    worker.onmessage = (e) => {
      clearTimeout(timeoutId);
      worker.terminate();
      compileWorkerRef.current = null;
      setIsCompiling(false);

      const { binary, outcome } = e.data;

      setCodebase((prev) => ({
        ...prev,
        programs: prev.programs.map((x, i) =>
          i === prev.cursor ? { ...x, binary, outcome } : x,
        ),
      }));
    };

    worker.onerror = (e) => {
      setIsCompiling(false);
      worker.terminate();
    };

    worker.postMessage({ code: program.code, o: 1 });
  };

  const handleExecute = () => {
    if (isExecuting) return;

    if (executeWorkerRef.current) {
      executeWorkerRef.current.terminate();
    }

    const worker = new Worker(
      new URL("@/lib/workers/execute.ts", import.meta.url),
    );
    executeWorkerRef.current = worker;
    setIsExecuting(true);

    const timeoutId = setTimeout(() => {
      worker.terminate();
      executeWorkerRef.current = null;
      setIsExecuting(false);

      const outcome = {
        stdout: "",
        result: "δ-me13: virtual machine timeout",
        success: false,
      };
      setCodebase((prev) => ({
        ...prev,
        programs: prev.programs.map((x, i) =>
          i === prev.cursor ? { ...x, outcome } : x,
        ),
      }));
    }, 5000);

    worker.onmessage = (e) => {
      clearTimeout(timeoutId);
      worker.terminate();
      executeWorkerRef.current = null;
      setIsExecuting(false);

      const outcome = e.data;

      setCodebase((prev) => ({
        ...prev,
        programs: prev.programs.map((x, i) =>
          i === prev.cursor ? { ...x, outcome } : x,
        ),
      }));
    };

    worker.onerror = (e) => {
      setIsExecuting(false);
      worker.terminate();
    };

    worker.postMessage({ binary: program.binary });
  };

  const handleCodeChange = useCallback(
    (newCode: string | undefined) => {
      if (newCode === undefined || newCode === program.code) {
        return;
      }

      setCodebase((prev) => ({
        ...prev,
        programs: prev.programs.map((x, i) =>
          i === prev.cursor ? { ...x, code: newCode, binary: undefined } : x,
        ),
      }));
    },
    [program.code, setCodebase],
  );

  return (
    <div className="h-dvh w-dvw flex flex-col">
      <BackgroundImage visible={program.name === "beloved.fs"} />
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
                    setCodebase((cb) => ({ ...cb, cursor: key }));
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
                  onClick={() => setCodebase((cb) => ({ ...cb, cursor: key }))}
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
              value={code}
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
            {outcome && (
              <div className="flex-1 overflow-auto mt-4">
                {outcome.stdout && (
                  <div className="whitespace-pre-wrap">
                    <code>{outcome.stdout}</code>
                  </div>
                )}
                <div className="whitespace-pre-wrap">
                  {outcome.success ? (
                    <code>
                      <b className="text-pink">Exit: </b>
                      {outcome.result}
                    </code>
                  ) : (
                    <code className="text-red-400">{outcome.result}</code>
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

function BackgroundImage({ visible }: { visible: boolean }) {
  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden transition-all duration-300 ease-in-out"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <Image
        src={elysia}
        alt=""
        fill
        priority
        className="object-cover object-[80%_50%]"
      />
      <div className="absolute inset-0 bg-black/70" />
    </div>
  );
}

const monacoConfig = (_: editor.IStandaloneCodeEditor, monaco: Monaco) => {
  monaco.languages.register({ id: "felys" });

  monaco.languages.setMonarchTokensProvider("felys", {
    tokenizer: {
      root: [
        [/(elysia|cyrene)/, "pink"],
        [/\/\/[^\n]*/, "comment"],
        [
          /(fn|group|impl|if|else|while|break|continue|loop|return|true|false|not|and|or|for|in)(?!\w)/,
          "keyword",
        ],
        [/[a-zA-Z_][\w_]*(?=\s*\()/, "function.call"],
        [/[a-zA-Z_][\w_]*/, "identifier"],
        [/\d+/, "number"],
        [/"/, "string", "@string"],
      ],
      string: [
        [/[^"]+/, "string"],
        [/"/, "string", "@pop"],
      ],
    },
  });

  monaco.editor.defineTheme("felys-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "pink", foreground: "#ffc6f4" },
      { token: "identifier", foreground: "#9cdcfe" },
      { token: "function.call", foreground: "#dcdcaa" },
    ],
    colors: {
      "editor.background": "#00000000",
      "minimap.background": "#00000000",
      "editorWidget.background": "#00000000",
      "input.background": "#00000000",
      "editorOverviewRuler.background": "#00000000",
    },
  });

  monaco.editor.setTheme("felys-dark");
};
