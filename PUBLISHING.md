# 記事の書き方と投稿方法

Qiita と Zenn の両方へ、同じ本文を投稿するための手順書。

## 前提：ファイルの役割

**本文を書き換えるのは `drafts/` だけ。** `public/` と `articles/` は自動生成されるので、直接編集しても次回の同期で消える。

| 場所 | 役割 | 手で編集するか |
|---|---|---|
| `drafts/<slug>.md` | **本文の唯一の正。** タイトルは1行目の `# 見出し` | **ここを編集する** |
| `articles.config.json` | タグ・絵文字・公開URLなどのメタ情報 | **ここを編集する** |
| `public/<slug>.md` | Qiita 投稿用（自動生成） | 触らない |
| `articles/<slug>.md` | Zenn 投稿用（自動生成） | 触らない |
| `scripts/sync-articles.mjs` | `drafts/` から上2つを生成する | — |

```
drafts/04-foo.md ──┬──> public/04-foo.md    ──> Qiita
  (本文の正)       └──> articles/04-foo.md  ──> Zenn
```

---

## 初回だけやること

### 1. 依存を入れる

```bash
npm install
```

### 2. Qiita の認証

```bash
npm run qiita:login
```

ブラウザが開くので、Qiita のアクセストークンを作って貼る。トークンには **`read_qiita` と `write_qiita`** の権限が要る。

### 3. Qiita の GitHub Actions 用トークンを登録

push で自動投稿させる場合のみ必要。

1. Qiita で発行したトークンをコピー
2. GitHub リポジトリの **Settings → Secrets and variables → Actions → New repository secret**
3. 名前を **`QIITA_TOKEN`**、値にトークンを貼って保存

> この Secret が無いと `.github/workflows/publish.yml` は失敗する。

### 4. Zenn と GitHub を連携

Zenn は CLI からは投稿しない。**GitHub 連携で、リポジトリの `articles/` を自動で取り込む。**

1. https://zenn.dev/dashboard/deploys を開く
2. 「リポジトリを連携する」からこのリポジトリを選ぶ
3. 連携後、`main` へ push すると `articles/*.md` が Zenn に同期される

---

## 記事を書く

### 1. 下書きを作る

`drafts/<番号>-<slug>.md` を作る。1行目は必ず `# タイトル`。

```markdown
# 記事のタイトル

本文をここから書く。
```

**slug の制約**（Zenn 側の要件）：

- 使えるのは `a-z` `0-9` `-` `_` のみ
- **12〜50文字**
- **一度公開したら変更しない。** 変えると Zenn 上で別記事になり、Qiita 側も二重投稿になる

### 2. メタ情報を登録する

`articles.config.json` の `articles` に追記する。

```json
{
  "slug": "05-my-new-article",
  "ref": "05",
  "qiita": { "tags": ["Java", "個人開発"], "private": false },
  "zenn":  { "emoji": "📝", "type": "tech", "topics": ["java"], "published": false },
  "qiitaUrl": "",
  "zennUrl": ""
}
```

| キー | 意味 |
|---|---|
| `ref` | 記事間リンク用の番号（後述） |
| `qiita.tags` | **1〜5個必須。** 0個だと Qiita 側で弾かれる |
| `qiita.private` | `true` で限定共有記事として投稿 |
| `zenn.emoji` | 記事アイコン。絵文字1文字 |
| `zenn.type` | `tech`（技術記事）または `idea`（アイデア） |
| `zenn.topics` | **最大5個。** 小文字で書く |
| `zenn.published` | `false` の間は Zenn 上で下書き扱い |

### 3. 記事どうしをリンクする

連載で相互リンクする場合、URL を直接書かずに **`(@番号)`** と書く。

```markdown
詳しくは[実装編](@03)を参照。
```

同期時に、その記事の `qiitaUrl` / `zennUrl` へ**プラットフォームごとに解決される。**Qiita の記事からは Qiita の記事へ、Zenn からは Zenn へ飛ぶ。

**まだ公開しておらず URL が空のときは、リンクを外して文字だけ残す。** 踏めないリンクが公開面に出ることはない。

### 4. 同期する

```bash
npm run sync
```

`public/` と `articles/` が生成される。**本文を直したら毎回これを実行する。**

### 5. プレビューで確認する

```bash
npm run qiita:preview   # http://localhost:8888
npm run zenn:preview    # http://localhost:8000
```

---

## 投稿する

### Qiita

**方法A：手元から投稿**

```bash
npm run qiita:publish      # public/ の全記事を投稿・更新
npx qiita publish 04-chrome-ext-wareki-converter   # 1本だけ
```

**方法B：push で自動投稿**

`main` / `master` へ push すると `.github/workflows/publish.yml` が動く。`QIITA_TOKEN` の登録が前提。

### Zenn

**push するだけ。** `main` へ push すると連携済みリポジトリの `articles/` が取り込まれる。

`published: false` の間は Zenn 上で下書きのまま。公開するときは `articles.config.json` の `zenn.published` を `true` にして `npm run sync` してから push する。

---

## 公開した後にやること

**記事間リンクを有効にするために、公開URLを登録する。**

1. 公開された記事のURLをコピー
2. `articles.config.json` の `qiitaUrl` / `zennUrl` に貼る

```json
{
  "slug": "01-ai-council-series-overview",
  "qiitaUrl": "https://qiita.com/<user>/items/xxxxxxxxxxxx",
  "zennUrl": "https://zenn.dev/<user>/articles/01-ai-council-series-overview"
}
```

3. 再同期して投稿し直す

```bash
npm run sync
npm run qiita:publish
git add -A && git commit -m "記事URLを登録" && git push
```

> Zenn の URL は `https://zenn.dev/<ユーザー名>/articles/<slug>` の形なので、公開前でも確定している。先に埋めておいてもよい。

---

## 注意点

### `public/<slug>.md` の `id` を消さない

Qiita へ初回投稿すると、qiita-cli が `public/<slug>.md` の front matter に **`id`** を書き戻す。これが記事の同一性。

```yaml
id: abc123def456789     # ← これが記事ID
updated_at: '2026-08-28T18:00:00+09:00'
```

**この `id` を消して再投稿すると、同じ記事がもう1本作られる。**

`npm run sync` は生成先の `id` / `updated_at` / `organization_url_name` を読み取って引き継ぐので、同期しても消えない。ただし **`public/<slug>.md` を手で削除して作り直すと `id` は失われる。** 消したくなったら、先に `id` の値を控えておくこと。

Zenn 側は `published` を同じ仕組みで引き継ぐ。

### slug を後から変えない

公開後に `drafts/` のファイル名を変えると、

- Zenn：別記事として新規作成され、元記事は残る
- Qiita：`public/` のファイル名が変わって `id` を見失い、二重投稿になる

どうしても変える場合は、両プラットフォームで元記事を手動で削除する。

### 同期忘れを検出する

```bash
npm run sync:check
```

`drafts/` と生成物がずれていれば終了コード1で落ちる。CI に入れると、同期し忘れたまま push するのを防げる。

### タグの個数

- Qiita：**1〜5個**（0個だと投稿できない）
- Zenn：**最大5個**

---

## コマンド一覧

| コマンド | 内容 |
|---|---|
| `npm run sync` | `drafts/` → `public/` `articles/` を生成 |
| `npm run sync:check` | 同期漏れを検査（CI向け） |
| `npm run qiita:login` | Qiita の認証 |
| `npm run qiita:preview` | Qiita のプレビュー（:8888） |
| `npm run qiita:publish` | Qiita へ全記事を投稿・更新 |
| `npm run qiita:pull` | Qiita 側の変更を取り込む |
| `npm run zenn:preview` | Zenn のプレビュー（:8000） |

## 新しい記事を書くときの流れ

```bash
# 1. 下書きを書く
vim drafts/05-new-article.md          # 1行目に # タイトル

# 2. メタ情報を追記
vim articles.config.json

# 3. 同期してプレビュー
npm run sync
npm run zenn:preview

# 4. 投稿
npm run qiita:publish                  # Qiita
git add -A && git commit -m "記事を追加" && git push   # Zenn

# 5. 公開URLを config に登録して再同期
vim articles.config.json
npm run sync && npm run qiita:publish && git push
```
