# tech-articles

Qiita と Zenn に投稿する技術記事と、その投稿環境。

## なぜこの構成なのか

同じ記事を2つのプラットフォームへ出したい。しかし Qiita と Zenn は
フロントマターの形式が違う。

```yaml
# Qiita                      # Zenn
title: "..."                 title: "..."
tags: [...]                  emoji: "📅"
private: false               type: "tech"
id: null                     topics: [...]
updated_at: ''               published: false
```

本文が同じでも、ファイルは別に持つ必要がある。両方を手で書くと、片方だけ
直したときにずれる。

そこで**本文の置き場所をひとつに決め、残りを生成する**ことにした。

```
drafts/04-foo.md ──┬──> public/04-foo.md    ──> Qiita
  (本文の正)       └──> articles/04-foo.md  ──> Zenn
```

`drafts/` だけを編集し、`npm run sync` で2つを生成する。

## ファイルの役割

| 場所 | 役割 | 手で編集するか |
|---|---|---|
| `drafts/<slug>.md` | 本文の唯一の正。タイトルは1行目の `# 見出し` | **編集する** |
| `articles.config.json` | タグ・絵文字・公開URLなどのメタ情報 | **編集する** |
| `public/<slug>.md` | Qiita 投稿用（自動生成） | 触らない |
| `articles/<slug>.md` | Zenn 投稿用（自動生成） | 触らない |
| `scripts/sync-articles.mjs` | `drafts/` から上2つを生成する | — |

詳しい手順は [PUBLISHING.md](PUBLISHING.md) にある。

## 生成でつまずいた点

### 記事IDを消すと二重投稿になる

Qiita へ初回投稿すると、qiita-cli が `public/<slug>.md` に記事の `id` を
書き戻す。これが記事の同一性を保つ値で、消して再投稿すると同じ記事がもう1本
作られる。

そのため同期スクリプトは、生成先に既にある `id` と `updated_at` を読み取って
引き継ぐ。Zenn 側も同様に `published` を引き継ぎ、公開フラグを下書きへ
戻さない。

### 記事間リンクは投稿先ごとに違う

連載で相互リンクすると、Qiita の記事からは Qiita へ、Zenn からは Zenn へ
飛ばしたい。同じ本文から2つのリンク先を作る必要がある。

本文には `(@NN)` とだけ書き、同期時に `articles.config.json` の
`qiitaUrl` / `zennUrl` から解決する。

```markdown
詳しくは[実装編](@03)を参照。
```

URL が未登録のあいだはリンクを外し、表示テキストだけを残す。踏めないリンクが
公開面に出ることはない。

## 収録している記事

役割を分けたAIに議論・実装させ、Chrome拡張を1本公開するまでの連載。

| | 記事 |
|---|---|
| 01 | 役割を分けたAIに議論させ、Chrome拡張を公開するまで |
| 02 | AI3席会合で55案出したら、在庫が積み上がった話 |
| 03 | AIに実装させるゲート設計と、自動テスト99件をすり抜けた6件のバグ |
| 04 | 和暦変換のChrome拡張を作って公開した |

各記事は単独で読んで意味が通るように書いている。Qiita も Zenn も検索から
1本だけ読まれるためで、連載順に読む読者はほとんどいない。

## 関連リポジトリ

| | 役割 |
|---|---|
| [ai-council_v2](https://github.com/momokuomomo-crypto/ai-council_v2) | 議論を分担するClaude Codeスキル |
| [ai-build-council](https://github.com/momokuomomo-crypto/ai-build-council) | 実装を分担するClaude Codeスキル |
| [ai-writing-council](https://github.com/momokuomomo-crypto/ai-writing-council) | 執筆を分担するClaude Codeスキル。文章規範のチェッカーもこちら |
| [chrome-ext-wareki-converter](https://github.com/momokuomomo-crypto/chrome-ext-wareki-converter) | 連載で扱っている成果物 |

記事の推敲と添削は `ai-writing-council` が担当する。このリポジトリは記事本体と
投稿環境だけを持つ。

## コマンド

```bash
npm install

npm run sync            # drafts/ から public/ と articles/ を生成
npm run sync:check      # 同期漏れを検査（差分があれば終了コード1）

npm run qiita:preview   # Qiita のプレビュー（:8888）
npm run zenn:preview    # Zenn のプレビュー（:8000）

npm run qiita:publish   # Qiita へ投稿・更新
```

Zenn は CLI から投稿しない。GitHub 連携により、`main` へ push すると
`articles/` が取り込まれる。

投稿には Qiita のトークンと Zenn のリポジトリ連携が要る。
手順は [PUBLISHING.md](PUBLISHING.md) を参照。
