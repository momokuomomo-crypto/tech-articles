#!/usr/bin/env node
// 日本語テクニカルライティングの定番ルールで原稿を検査する。
// 参考にした観点：一文一義／冗長表現の削除／「の」の連続／敬体・常体の統一／
// 表記ゆれ／二重否定。機械的に判定できるものだけを対象にしている。
//
// 使い方: node scripts/lint-ja.mjs [ファイル...]   （既定は drafts/*.md）

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const MAX_LEN = 60; // 一文の目安。超えたら分割を検討する

const REDUNDANT = [
  [/することができ(る|ます|ない|ません)/g, "「〜できる」に短縮できる"],
  [/を行(う|います|った|いました)/g, "動詞1語にできることが多い（例：実行を行う→実行する）"],
  [/という(こと|もの|点)/g, "多くの場合そのまま削れる"],
  [/について(は|の)/g, "「は」「の」だけで足りることがある"],
  [/においては/g, "「では」に短縮できる"],
  [/に関して/g, "「について」または削除"],
  [/してしまい(ます|ました)/g, "「します」「しました」で足りることが多い"],
  [/(な|で)いただく/g, "敬語の重複がないか確認"],
];

const DOUBLE_NEG = [
  [/なくはない/g, "二重否定。肯定形にする"],
  [/ないことはない/g, "二重否定。肯定形にする"],
  [/なくもない/g, "二重否定。肯定形にする"],
];

// 文末が敬体か常体かを判定する
const KEITAI = /(です|でした|ます|ました|ません|でしょう|ましょう|ください)。$/;
const JOUTAI = /(である|だった|した|する|ない|いる|なる|た|る)。$/;

function sentences(line) {
  // 「。」で切る。コード中の記号は対象外にしたいので、行単位で呼ぶ前提
  return line.split(/(?<=。)/).map((s) => s.trim()).filter(Boolean);
}

function lintFile(path) {
  const raw = readFileSync(path, "utf8");
  const lines = raw.split("\n");
  const issues = [];
  let inFence = false;
  let keitai = 0, joutai = 0;

  lines.forEach((line, i) => {
    const no = i + 1;
    if (/^```/.test(line)) { inFence = !inFence; return; }
    if (inFence) return;                       // コードブロックは対象外
    if (/^\s*[|>#-]/.test(line)) return;        // 表・引用・見出し・箇条書きは対象外
    if (!line.trim()) return;

    for (const s of sentences(line)) {
      // 装飾記号は読む長さに含めないので、数える前に落とす
      const plain = s
        .replace(/`[^`]*`/g, "")                       // インラインコード
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")       // リンクは表示テキストだけ残す
        .replace(/\*\*([^*]*)\*\*/g, "$1")             // 太字
        .replace(/\*([^*]*)\*/g, "$1");                // 斜体
      if (!plain.includes("。")) continue;

      if (plain.length > MAX_LEN) {
        issues.push([no, "長文", `${plain.length}字。${MAX_LEN}字を目安に分割を検討`, plain.slice(0, 40) + "…"]);
      }
      const noNo = plain.match(/(の[^、。]{1,6}){3,}の/);
      if (noNo) issues.push([no, "「の」連続", "「の」が3つ以上連続している", noNo[0]]);

      for (const [re, msg] of [...REDUNDANT, ...DOUBLE_NEG]) {
        const m = plain.match(re);
        if (m) issues.push([no, "冗長/二重否定", msg, m[0]]);
      }
      if (KEITAI.test(plain)) keitai++;
      else if (JOUTAI.test(plain)) joutai++;
    }
  });

  // 表記ゆれ（本文全体で比較）
  const body = raw.replace(/```[\s\S]*?```/g, "");
  const pairs = [["等", "など"], ["下さい", "ください"], ["出来る", "できる"], ["行なう", "行う"]];
  for (const [a, b] of pairs) {
    const ca = (body.match(new RegExp(a, "g")) || []).length;
    const cb = (body.match(new RegExp(b, "g")) || []).length;
    if (ca && cb) issues.push(["-", "表記ゆれ", `「${a}」${ca}件 と 「${b}」${cb}件 が混在`, `${a} / ${b}`]);
  }

  return { issues, keitai, joutai };
}

const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : readdirSync("drafts").filter((f) => f.endsWith(".md")).map((f) => join("drafts", f)).sort();

let total = 0;
for (const f of files) {
  const { issues, keitai, joutai } = lintFile(f);
  const mixed = keitai && joutai;
  console.log(`\n=== ${f} ===`);
  console.log(`文体: 敬体 ${keitai}文 / 常体 ${joutai}文` + (mixed ? "  ← 混在" : ""));
  if (!issues.length) { console.log("指摘なし"); continue; }
  for (const [line, kind, msg, sample] of issues) {
    console.log(`  L${line}\t[${kind}] ${msg}\n\t\t> ${sample}`);
  }
  total += issues.length;
}
console.log(`\n合計 ${total} 件`);
