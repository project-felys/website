import init, { execute } from "@/wasm/pkg";
const wasm = new URL("@/wasm/pkg/wasm_bg.wasm", import.meta.url);

onmessage = async (e) => {
  const { binary } = e.data;
  try {
    const url = new URL(wasm, self.location.origin);
    await init({ module_or_path: url });
    const outcome = execute(binary);
    postMessage(outcome);
  } catch (err) {
    postMessage({ stdout: "", result: String(err), success: false });
  }
};
