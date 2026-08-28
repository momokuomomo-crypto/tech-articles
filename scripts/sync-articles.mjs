#!/usr/bin/env node
// drafts/<slug>.md を唯一のソースとして、Qiita 用 public/<slug>.md と
// Zenn 用 articles/<slug>.md を生成する。
//
// 生成先に既にある値のうち、CLI やユーザーが書き込んだものは引き継ぐ：
//   Qiita: id / updated_at   … qiita-cli が初回投稿後に書き戻す。消すと記事が二重投稿になる
//   Zenn : published         … 公開フラグを勝手に false へ戻さない
//
// 使い方:  node scripts/sync-articles.mjs [--check]
//   --check … 書き込まず、差分があれば終了コード1（CI 向け）

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const checkOnly = process.argv.includes("--check");
const config = JSON.parse(readFileSync(join(root, "articles.config.json"), "utf8"));

// 既存ファイルの front matter から、保持したいキーだけを拾う
function readFrontMatter(path) {
  if (!existsSync(path)) return {};
  const text = readFileSync(path, "utf8");
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return {};
  const out = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
    if (kv) out[kv[1]] = kv[2].trim();
  }
  return out;
}

// YAML のダブルクォート文字列として安全に出す
const q = (s) => `"${String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

function splitDraft(slug) {
  const path = join(root, "drafts", `${slug}.md`);
  const text = readFileSync(path, "utf8");
  const lines = text.split("\n");
  const i = lines.findIndex((l) => l.startsWith("# "));
  if (i === -1) throw new Error(`${slug}: H1 見出しが無い`);
  const title = lines[i].slice(2).trim();
  // H1 と、その直後の空行を落とす（タイトルは front matter 側で持つ）
  const rest = lines.slice(i + 1);
  while (rest.length && rest[0].trim() === "") rest.shift();
  return { title, body: rest.join("\n").replace(/\s*$/, "") + "\n" };
}

// 本文中の (@NN) を、対象プラットフォームの実URLへ解決する
function resolveLinks(body, platform) {
  // [表示テキスト](@NN) 全体を対象にする。URL 未設定なら、リンクを外して
  // 表示テキストだけ残す（`](#)` のような踏めないリンクを公開面に出さないため）
  return body.replace(/\[([^\]]+)\]\(@(\d{2})\)/g, (whole, text, ref) => {
    const target = config.articles.find((a) => a.ref === ref);
    if (!target) throw new Error(`未知の参照 @${ref}`);
    const url = platform === "qiita" ? target.qiitaUrl : target.zennUrl;
    return url ? `[${text}](${url})` : text;
  });
}

function buildQiita(a, title, body) {
  const prev = readFrontMatter(join(root, "public", `${a.slug}.md`));
  const fm = [
    "---",
    `title: ${q(title)}`,
    "tags:",
    ...a.qiita.tags.map((t) => `  - ${q(t)}`),
    `private: ${a.qiita.private}`,
    `updated_at: ${prev.updated_at ?? "''"}`,
    `id: ${prev.id ?? "null"}`,
    `organization_url_name: ${prev.organization_url_name ?? "null"}`,
    "slide: false",
    "ignorePublish: false",
    "---",
    "",
  ].join("\n");
  return fm + resolveLinks(body, "qiita");
}

function buildZenn(a, title, body) {
  const prev = readFrontMatter(join(root, "articles", `${a.slug}.md`));
  const published = prev.published ?? String(a.zenn.published);
  const fm = [
    "---",
    `title: ${q(title)}`,
    `emoji: ${q(a.zenn.emoji)}`,
    `type: ${q(a.zenn.type)}`,
    `topics: [${a.zenn.topics.map(q).join(", ")}]`,
    `published: ${published}`,
    "---",
    "",
  ].join("\n");
  return fm + resolveLinks(body, "zenn");
}

let changed = 0;
for (const a of config.articles) {
  const { title, body } = splitDraft(a.slug);
  for (const [dir, build] of [["public", buildQiita], ["articles", buildZenn]]) {
    const dest = join(root, dir, `${a.slug}.md`);
    mkdirSync(dirname(dest), { recursive: true });
    const next = build(a, title, body);
    const cur = existsSync(dest) ? readFileSync(dest, "utf8") : null;
    if (cur === next) continue;
    changed++;
    if (checkOnly) console.log(`差分あり: ${dir}/${a.slug}.md`);
    else { writeFileSync(dest, next); console.log(`書き出し: ${dir}/${a.slug}.md`); }
  }
}

if (checkOnly && changed) {
  console.error(`\n${changed} 件が drafts/ と同期していない。node scripts/sync-articles.mjs を実行すること。`);
  process.exit(1);
}
console.log(changed ? `\n完了（${changed} 件）` : "すべて同期済み");
