---
title: "ブラウザの細かい面倒を潰すChrome拡張を5本公開しました"
tags:
  - "ChromeExtension"
  - "Chrome"
  - "個人開発"
  - "生産性"
  - "ツール"
private: false
updated_at: ''
id: null
organization_url_name: null
slide: false
ignorePublish: false
---
どれも1つのことしかしません。5本とも**外部への通信を一切行わず**、データはブラウザの中だけに保存します。

## 音声タブコントローラー

**どのタブから音が出ているか分からない**とき用です。

急に広告の音声が鳴り出して、タブを1つずつ開いて探した経験があると思います。この拡張は、いま音が出ているタブを一覧で表示します。

- 再生中・ミュート中・無音の3状態を区別して表示
- 個別ミュート、一括ミュート
- **一括解除は、この拡張がミュートしたタブだけ**を解除する。自分でミュートしたタブや他の拡張がミュートしたタブは触らない
- サイト単位の常時ミュート。新しいタブで開いても自動で適用される

権限は `tabs` と `storage` の2つだけです。ページの中身は読みません。

[Chromeウェブストアで見る](https://chromewebstore.google.com/detail/%E9%9F%B3%E5%A3%B0%E3%82%BF%E3%83%96%E3%82%B3%E3%83%B3%E3%83%88%E3%83%AD%E3%83%BC%E3%83%A9%E3%83%BC/ekhaiompgafbnglleejjiibfkhpedcgg)

## ブックマーク受信箱

**フォルダをどれにするか迷って、結局保存しない**とき用です。

ブックマークは分類を求めてきます。あとで読むだけのページに、毎回フォルダを選ぶのは面倒です。この拡張は分類せずに一旦保存します。

- ボタンか右クリックで、フォルダを選ばずに保存
- 未処理の件数をツールバーのバッジに表示する
- 「処理済み」にしても削除されない。あとから見返せる
- 500件・4MiBの上限を設けてあり、超えると保存を断る

権限は `storage`・`activeTab`・`contextMenus` の3つです。

[Chromeウェブストアで見る](https://chromewebstore.google.com/detail/%E3%83%96%E3%83%83%E3%82%AF%E3%83%9E%E3%83%BC%E3%82%AF%E5%8F%97%E4%BF%A1%E7%AE%B1/lhphjoggiilcmnjpopnlojnkaphdhjfg)

## リンク期限リマインダー

**申込期限や締切のあるページを、忘れる**とき用です。

チケットの申込、書類の提出、キャンペーンの締切。ブックマークに入れても、見に行かなければ気づきません。この拡張は、指定した日時に通知します。

- 開いているページをタイトルとURL付きで登録し、日時を指定する
- 期限になるとChromeの通知で知らせる
- 登録した一覧の確認と削除ができる
- ブラウザを再起動しても予定は復元される

権限は `activeTab`・`storage`・`alarms`・`notifications` の4つです。カレンダーやメールとは連携しません。**通知はこの端末の中だけで完結します。**

[Chromeウェブストアで見る](https://chromewebstore.google.com/detail/%E3%83%AA%E3%83%B3%E3%82%AF%E6%9C%9F%E9%99%90%E3%83%AA%E3%83%9E%E3%82%A4%E3%83%B3%E3%83%80%E3%83%BC/dfddgljeaagkljohaldhmaifplaohnhh)

## ページ情報ワンクリック台帳

**調べものの記録を、URLとタイトルごと残したい**とき用です。

複数のページを見比べる作業で、あとから「どこに書いてあったか」が分からなくなります。この拡張は、ページのタイトル・URL・選択したテキストをまとめて記録します。

- ボタン1つで現在のページを記録
- テキストを選択して右クリックすれば、その部分も一緒に記録される
- 一覧ページから **CSV / JSON で書き出せる**
- 直前の記録は取り消せる
- 同じURLと同じ選択テキストを10秒以内に重ねて記録しようとすると無視される

権限は `activeTab`・`scripting`・`storage`・`contextMenus`・`downloads` の5つです。選択テキストを取るために `scripting` を使いますが、**取得するのは選択した範囲だけ**です。

[Chromeウェブストアで見る](https://chromewebstore.google.com/detail/%E3%83%9A%E3%83%BC%E3%82%B8%E6%83%85%E5%A0%B1%E3%83%AF%E3%83%B3%E3%82%AF%E3%83%AA%E3%83%83%E3%82%AF%E5%8F%B0%E5%B8%B3/lbmejbbloglolnlcbpacbboehohngbdd)

## 和暦変換（改元日対応）

**1989年が昭和64年なのか平成元年なのか、日付まで見ないと決まらない**とき用です。

同じ1989年でも、1月7日までは昭和64年、1月8日からは平成元年です。多くの変換ツールは1989年を平成元年と答えて終わります。

```
入力：1989/1/8

  平成元年1月8日
  1989年1月8日
  ※ 1989年は1月7日までが昭和64年、1月8日からが平成元年
```

- 改元のあった年は、境界日を注記で示す
- **存在しない和暦は作らない。** 昭和64年1月8日を入れると、期間外だと示したうえで「平成元年1月8日です」と正解を出す
- 年だけでも変換できる。`1901` は明治34年
- 表記ゆれを受理する。`19890108` `H1.1.8` `H元/1/8` `生年月日：1989年1月8日` `1989年1月8日（日）` 全角数字
- ポップアップへの入力と、ページ上の日付を選択して右クリックの2通りで使える

権限は `contextMenus`・`storage`・`notifications` の3つです。ページの中身を読む権限は要求しません。

[Chromeウェブストアで見る](https://chromewebstore.google.com/detail/pcgbpaagcljfakbhmoiaoekmfbfdfpob)

## 5本に共通していること

**外部への通信を一切行いません。** 5本とも `host_permissions` を持たず、ソースコードに通信の処理がありません。入力したデータも保存したデータも、この端末から出ません。

**権限は必要な最小限だけ**を要求しています。ページの内容を読み取る権限（`host_permissions`）は5本とも要求していません。

**アカウント登録も課金もありません。** 入れればそのまま使えます。

すべてソースを公開しています。

| 拡張 | ソース |
|---|---|
| 音声タブコントローラー | https://github.com/momokuomomo-crypto/chrome-ext-voice-tab-controller |
| ブックマーク受信箱 | https://github.com/momokuomomo-crypto/chrome-ext-bookmark-inbox |
| リンク期限リマインダー | https://github.com/momokuomomo-crypto/chrome-ext-link-deadline-reminder |
| ページ情報ワンクリック台帳 | https://github.com/momokuomomo-crypto/chrome-ext-page-info-ledger |
| 和暦変換（改元日対応） | https://github.com/momokuomomo-crypto/chrome-ext-wareki-converter |

使ってみて困ったところがあれば、各リポジトリのIssueに書いてください。
