// meme-sprint-3-ai-agent-goes-rogue — entry program (Node 22).
// Ships the pre-rendered entry.png in this repository to the output
// directory after checking it is a genuine PNG inside the 1 MiB limit.
// Runs with no network; the bytes written are identical on every run.
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
} from "node:fs";
import { join, resolve } from "node:path";

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const MAX_BYTES = 1024 * 1024;
const ENTRY_NAME = "entry.png";

function abort(message: string): never {
  console.error(`error: ${message}`);
  process.exit(1);
}

function validatePng(path: string, label: string): number {
  if (!existsSync(path)) {
    abort(`${label} missing: ${path}`);
  }
  const size = statSync(path).size;
  if (size < PNG_SIGNATURE.length || size > MAX_BYTES) {
    abort(`${label} is ${size} bytes, outside 8..${MAX_BYTES}`);
  }
  const head = readFileSync(path).subarray(0, PNG_SIGNATURE.length);
  if (!head.equals(PNG_SIGNATURE)) {
    abort(`${label} does not begin with the PNG signature`);
  }
  return size;
}

function run(): void {
  const source = resolve(import.meta.dirname, ENTRY_NAME);
  const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? "/output");
  const target = join(outDir, ENTRY_NAME);

  const size = validatePng(source, ENTRY_NAME);
  mkdirSync(outDir, { recursive: true });
  copyFileSync(source, target);
  const copied = validatePng(target, `output ${ENTRY_NAME}`);
  if (copied !== size) {
    abort(`output is ${copied} bytes but source is ${size}`);
  }
  console.log(`wrote ${target} (${copied} bytes)`);
}

run();
