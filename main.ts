// meme-sprint-3-ai-agent-goes-rogue — entry program (Node 22).
// Ships the pre-rendered entry.png in this repository to the output
// directory after checking it is a genuine 1024x1024 PNG inside the
// 1 MiB limit. Runs with no network; the bytes written are identical
// on every run.
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
// Competition gate: entry image must be at most 1024x1024 px; this
// entry is rendered at exactly 1024x1024, so anything else is a
// wrong file and must fail loudly instead of being submitted.
const EXPECTED_WIDTH = 1024;
const EXPECTED_HEIGHT = 1024;
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
  const bytes = readFileSync(path);
  const head = bytes.subarray(0, PNG_SIGNATURE.length);
  if (!head.equals(PNG_SIGNATURE)) {
    abort(`${label} does not begin with the PNG signature`);
  }
  // The first chunk of a valid PNG must be IHDR; its first 8 data
  // bytes are the width and height as big-endian uint32s.
  if (bytes.length < 24 || bytes.subarray(12, 16).toString("ascii") !== "IHDR") {
    abort(`${label} has no IHDR chunk — not a valid PNG`);
  }
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  if (width !== EXPECTED_WIDTH || height !== EXPECTED_HEIGHT) {
    abort(
      `${label} is ${width}x${height}, expected ${EXPECTED_WIDTH}x${EXPECTED_HEIGHT}`,
    );
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
