/**
 * Syncs post frontmatter dates before `astro build`.
 *
 * - `pubDatetime` = author time of the commit that first added the file (stable).
 *   For files git has never seen, falls back to the file creation time.
 * - `modDatetime` = now, when the file has uncommitted changes (or is new).
 *   Otherwise the author time of the last commit touching it.
 *
 * Dates are written as `YYYY-MM-DDTHH:mm:ssZ`.
 *
 * Usage: node scripts/sync-post-datetime.mjs [--dry-run]
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const POSTS_DIR = path.join(ROOT, "src", "content", "posts");
const EXTS = [".md", ".mdx"];
const DRY_RUN = process.argv.includes("--dry-run");

let gitAvailable = true;

function git(args) {
  const result = spawnSync("git", ["-C", ROOT, ...args], { encoding: "utf8" });
  if (result.error || result.status !== 0) {
    gitAvailable = false;
    return null;
  }
  return result.stdout.trim();
}

/** POSIX path relative to the repo root, for use as a git pathspec. */
function relativeToRoot(file) {
  return path.relative(ROOT, file).split(path.sep).join("/");
}

function gitFirstCommitTime(rel) {
  const out = git(["log", "--diff-filter=A", "--format=%aI", "--", rel]);
  if (!out) return null;
  const lines = out.split("\n").filter(Boolean);
  return lines.at(-1) ?? null;
}

function gitLastCommitTime(rel) {
  const out = git(["log", "-1", "--format=%aI", "--", rel]);
  if (!out) return null;
  return out.split("\n")[0] || null;
}

function gitIsDirty(rel) {
  const out = git(["status", "--porcelain", "--", rel]);
  return out === null || out.length > 0;
}

function collectPosts(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap(entry => {
      if (entry.name.startsWith("_")) return [];
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return collectPosts(full);
      return EXTS.includes(path.extname(entry.name)) ? [full] : [];
    });
}

/** Splits a file into the leading `---` block and the rest of the content. */
function splitFrontmatter(content) {
  const open = /^---[^\S\r\n]*\r?\n/.exec(content);
  if (!open) return null;
  const start = open[0].length;
  const close = /\r?\n---[^\S\r\n]*(?:\r?\n|$)/.exec(content.slice(start));
  if (!close) return null;
  const sepStart = start + close.index;
  return { block: content.slice(start, sepStart), start, sepStart };
}

function readField(block, key) {
  const match = new RegExp(`^[ \\t]*${key}:[ \\t]*(.+?)[ \\t]*$`, "m").exec(
    block
  );
  return match ? match[1].replace(/^["']|["']$/g, "") : null;
}

function writeField(block, key, value) {
  const re = new RegExp(`^([ \\t]*${key}:)[ \\t]*.*$`, "m");
  if (re.test(block)) return block.replace(re, `$1 ${value}`);
  return `${block.replace(/\s+$/, "")}\n${key}: ${value}\n`;
}

/** `YYYY-MM-DDTHH:mm:ssZ` */
function formatZ(value) {
  return new Date(value).toISOString().replace(/\.\d{3}Z$/, "Z");
}

function sameInstant(a, b) {
  if (!a || !b) return false;
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) < 1000;
}

function fileCreationTime(file) {
  const stat = fs.statSync(file);
  return stat.birthtimeMs > 0 ? stat.birthtime : stat.mtime;
}

function resolveDates(file, rel) {
  const firstCommit = gitFirstCommitTime(rel);
  const pubDatetime = firstCommit ?? fileCreationTime(file);

  if (gitIsDirty(rel)) {
    return { pubDatetime, modDatetime: new Date() };
  }

  const lastCommit = gitLastCommitTime(rel);
  const isEdited =
    lastCommit &&
    new Date(lastCommit).getTime() - new Date(pubDatetime).getTime() >= 1000;

  return { pubDatetime, modDatetime: isEdited ? lastCommit : null };
}

function syncFile(file) {
  const content = fs.readFileSync(file, "utf8");
  const parts = splitFrontmatter(content);
  if (!parts) {
    console.warn(`skipped (no frontmatter): ${relativeToRoot(file)}`);
    return false;
  }

  const { pubDatetime, modDatetime } = resolveDates(file, relativeToRoot(file));
  let block = parts.block;
  let changed = false;

  for (const [key, value] of [
    ["pubDatetime", pubDatetime],
    ["modDatetime", modDatetime],
  ]) {
    if (!value) continue;
    const current = readField(block, key);
    if (sameInstant(current, value)) continue;
    block = writeField(block, key, formatZ(value));
    changed = true;
  }

  if (!changed) return false;

  console.log(
    `${relativeToRoot(file)}: pubDatetime=${formatZ(pubDatetime)}` +
      (modDatetime ? ` modDatetime=${formatZ(modDatetime)}` : "")
  );

  if (!DRY_RUN) {
    fs.writeFileSync(
      file,
      content.slice(0, parts.start) + block + content.slice(parts.sepStart)
    );
  }
  return true;
}

if (!fs.existsSync(POSTS_DIR)) {
  console.error(`missing posts directory: ${POSTS_DIR}`);
  process.exit(1);
}

const files = collectPosts(POSTS_DIR);
const updated = files.filter(syncFile).length;

if (!gitAvailable) {
  console.warn(
    "git unavailable — dates fell back to file creation/modification times"
  );
}
console.log(
  `${DRY_RUN ? "[dry-run] " : ""}${updated}/${files.length} post(s) updated`
);
