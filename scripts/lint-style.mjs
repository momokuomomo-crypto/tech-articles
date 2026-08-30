#!/usr/bin/env node
// 日本語技術文書の文章規範チェッカー
// 規範の出典: https://gist.github.com/k16shikano/fd287c3133457c4fd8f5601d34aa817d
//
// 機械判定できる項目だけを対象にする。論証の厳密さ・段落構成・冗長の排除など
// 判断を要する項目は対象外で、それらはAIによる添削側で見る。
//
// 使い方: node scripts/lint-style.mjs [ファイル...]   （既定は drafts/*.md）

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// 「LLMっぽい表現の禁止」節
const LLM_PHRASES = [
  "重要なのは", "本章では", "本記事では", "見ていきます", "見ていく",
  "まとめると", "要するに", "に他ならない", "にほかならない",
  "正面から", "不可欠", "核心的", "鍵となる", "根本的な",
  "多角的", "包括的", "総合的", "掘り下げ", "深掘り", "言語化",
  "という側面", "の観点から", "と言えるでしょう", "と言えるだろう",
  "非常に", "極めて", "大いに",
];

// 「演出の抑制」節
const COMMANDING = [/してはならない/g, /してはいけません/g, /必ず[^。]{0,12}してください/g];

const rules = [
  { id: "ダッシュ", test: (t) => /[—―–]|──/.test(t), why: "ダッシュを日本語の地の文・見出しで使わない" },
  { id: "イ形容詞+です", test: (t) => /[高低多少早遅長短強弱良悪深浅広狭重軽]いです/.test(t), why: "イ形容詞の終止に「です」を続けない" },
  { id: "読者をあなた", test: (t) => /あなた(は|が|の|に|を)/.test(t), why: "読者を「あなた」と呼ばず役割名で書く" },
];

function stripCode(md) {
  return md.replace(/```[\s\S]*?```/g, "").replace(/`[^`]*`/g, "");
}

function lint(path) {
  const raw = readFileSync(path, "utf8");
  const lines = raw.split("\n");
  const out = [];
  let inFence = false;
  let bold = 0, paras = 0, multiSentenceLines = 0, headingsWithTwoParts = 0;
  const conj = [];

  lines.forEach((line, i) => {
    const no = i + 1;
    if (/^```/.test(line)) { inFence = !inFence; return; }
    if (inFence) return;
    const t = line.replace(/`[^`]*`/g, "");
    if (!t.trim()) return;

    const isHeading = /^#{1,6}\s/.test(t);
    const isTable = /^\s*\|/.test(t);

    // 見出しに二要素を詰め込んでいないか
    if (isHeading && /[—―–]|──|:\s|：/.test(t.replace(/^#{1,6}\s/, ""))) {
      headingsWithTwoParts++;
      out.push([no, "見出し2要素", "見出しに二要素を詰め込まない", t.trim().slice(0, 50)]);
    }

    if (!isTable) {
      for (const r of rules) {
        if (r.test(t)) out.push([no, r.id, r.why, (t.match(/.{0,14}(?:[—―–]|──|いです|あなた.)/) || [t])[0].trim().slice(0, 40)]);
      }
      for (const p of LLM_PHRASES) {
        if (t.includes(p)) out.push([no, "LLM表現", `「${p}」を使わない`, p]);
      }
      for (const re of COMMANDING) {
        const m = t.match(re);
        if (m) out.push([no, "命令調", "命令調の断定を避ける", m[0]]);
      }
      // 一文一行：1行に「。」が2つ以上
      if (!isHeading && (t.match(/。/g) || []).length >= 2) multiSentenceLines++;
      // 接続表現の連打
      const c = t.match(/^(さらに|また|加えて)/);
      if (c) conj.push([no, c[1]]);
    }

    if (!isHeading && !isTable) {
      paras++;
      bold += (t.match(/\*\*[^*]+\*\*/g) || []).length;
    }
  });

  // 「さらに」「また」「加えて」が近接して現れていないか
  for (let i = 1; i < conj.length; i++) {
    if (conj[i][0] - conj[i - 1][0] <= 6) {
      out.push([conj[i][0], "接続連打", `「${conj[i - 1][1]}」の直後に「${conj[i][1]}」`, conj[i][1]]);
    }
  }

  return { out, bold, paras, multiSentenceLines, headingsWithTwoParts };
}

const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : readdirSync("drafts").filter((f) => f.endsWith(".md")).map((f) => join("drafts", f)).sort();

let total = 0;
const summary = [];
for (const f of files) {
  const { out, bold, paras, multiSentenceLines } = lint(f);
  const counts = {};
  for (const [, kind] of out) counts[kind] = (counts[kind] || 0) + 1;
  summary.push([f, out.length, bold, paras, multiSentenceLines, counts]);
  total += out.length;
}

console.log("ファイル".padEnd(38), "違反", "太字", "段落", "複文行");
for (const [f, n, bold, paras, multi] of summary) {
  console.log(f.padEnd(38), String(n).padStart(4), String(bold).padStart(4), String(paras).padStart(4), String(multi).padStart(6));
}
console.log("\n=== 違反の内訳 ===");
const all = {};
for (const [, , , , , counts] of summary) for (const k in counts) all[k] = (all[k] || 0) + counts[k];
for (const [k, v] of Object.entries(all).sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(14)} ${v}`);
console.log(`\n合計 ${total} 件`);
