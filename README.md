# UuU's Portfolio

トップページは `/` がJA版、`/en/` がEN版です。ヘッダーの「JA / EN」で切り替えられます。

本文やUIの文言は `lib/portfolio-i18n.ts`、経歴・実績・作品は `lib/portfolio-data.ts` で管理します。JA版は元の英語・日本語が混在した文章を保持し、EN版に英訳を用意します。年月・リンク・実績の並び順は日英共通とし、翻訳する文章は `{ ja: "…", en: "…" }` で記述します。日本語の論文・記事は原題を保持し、英語版では `in Japanese` と表示します。

実績は `Awards`（受賞・入選）、`Selected Programs`（プログラム採択）、`Service`（学生委員・ボランティア・スタッフ）に分けています。

`components/Portfolio.tsx` は日英共通です。`app/(ja)` と `app/(en)` は言語ごとのHTML設定を持つルートグループで、既存の `/blog/` と `/ando/` は日本語ページとして残しています。両言語ともビルド時に静的出力されます。

GitHub Pagesの公開パスは `NEXT_PUBLIC_BASE_PATH=/portfolio` で設定します。正規URLの既定ホストは `https://a-uuu-a.github.io` です。独自ドメインへ移す場合は `NEXT_PUBLIC_SITE_URL` で変更できます。

安藤忠雄建築の写真ビューアは `/ando` にあります。Works の Ando Atlas カードから開けます。

写真の追加方法: [public/photos/ando/README.md](public/photos/ando/README.md)

`npm run dev` / `npm run build` で写真フォルダを自動スキャンします。

ローカルで確認するには `npm run dev` を実行し、`http://localhost:3000/ando` を開きます。
