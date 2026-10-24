# Academic CV

英語の研究用CVです。経歴・業績はWebサイトと同じ `lib/portfolio-data.ts` から読み込み、`main.typ` で組版します。日本語の論文は原題・著者名を保持し、`Research Publications (Japanese)` にまとめます。

構成と記載粒度は [Keiichi Ihara氏のCV](https://keiichiihara.github.io/Keiichi_Ihara_CV.pdf) を参考にしています。研究関心、学歴、英語の研究業績、日本語の研究業績、受賞、奨学金・研究費、研究開発経験、学会活動を分けています。内容は本人のポートフォリオの情報に基づきます。`otherWritings` はWebサイトに残し、CVには含めません。

## 初回の準備

```sh
npm ci
npm run cv:setup
```

公式Typst 0.15.1をダウンロードし、公式リリースのSHA-256と照合して `cv/.cache/bin/` に配置します。システム全体にはインストールしません。macOS / Linuxのarm64・x64に対応しています。すでにTypstがある場合はセットアップを省略でき、`TYPST_BIN` で別のコンパイラを指定することもできます。

## 実績を追加してPDFを更新する

1. `lib/portfolio-data.ts` の該当する配列に経歴・業績を追加します。
2. 次を実行します。

```sh
npm run cv
```

出力先は `public/cv/akira-murakami-cv.pdf` です。生成される `public/cv/build.json` とともに変更に含めます。サイトとCVに二重入力する必要はありません。生成後、PDFの改ページを確認してください。

編集しながら自動で再生成するには、次を実行します。

```sh
npm run cv:watch
```

PDFと入力データ・テンプレートが一致しているかは、Typstなしでも確認できます。

```sh
npm run cv:check
```

初回のセットアップ以降、PDF生成はローカルで完結します。GitHub Actionsによる生成は行いません。PDFを同梱するため、通常のWebサイトのビルドにTypstは不要です。ホームページのヘッダーとAboutのリンクから、日英どちらでも同じ英語PDFを開けます。`NEXT_PUBLIC_BASE_PATH=/portfolio` にも対応しています。

## デザインを調整する

`cv/main.typ` の先頭に書体・色・文字サイズ・日付列の幅をまとめています。`set page` で余白、`show heading` で見出し、`timeline` と `paper` で経歴・論文の体裁を変更できます。各項目の途中でページを分けず、実績数に応じて自動でページを増やします。

連絡先のアイコンは `cv/icons/` のSVGです。メール・Webサイト・Google Scholarのアイコンと文字をまとめてクリックできます。

添付の参考PDFに合わせ、欧文本文・日付・論文にはCochineal、名前・見出しにはCabin Bold、連絡先にはInconsolataを使います。日本語はNoto Serif JPで補います。左右24 mm、上下23 mmの余白を取り、見出し・項目・段落の間隔を広げています。冒頭は所属と研究関心をまとめた文章にし、Research Interestsの見出しや右上のタイトルは置きません。

書体は `cv/fonts/` にライセンス付きで同梱しています。OSの書体を使わないため、別の環境でも同じ組版になります。新しい書体を追加するときはライセンスも同梱し、ビルドスクリプトの `inputs` に追加してください。

## 内容について

- 氏名・メール・冒頭の紹介文 `cvIntroduction` は `profile`、学歴や実績は既存の配列を更新します。学歴では `university` があれば大学名を使い、指定がなければ `institution` を使います。
- `profile.googleScholar` はホームページのContactとCVの両方で使います。
- 受賞・採択・活動にCV向けの簡潔な表現が必要な場合は、同じ項目の `cv.title` / `cv.details` に記載します。指定しない項目はWebサイトの英語表現を使います。
- 査読区分、著者順、書誌情報は既存のポートフォリオの記載を引き継いでいます。
- `eventDate` が生成日より先の場合、発表・学会活動に予定であることを表示します。
- MiTOHOKUの採択年は元データにないため、推測せず省略しています。`date` または `period` を追加すればCVにも反映されます。
- 生成日は日本時間を使います。過去の応募時点の版を残す場合などは `CV_DATE=2026-10-24 npm run cv` のように指定できます。
- CV内のサイトURLの既定値は `https://a-uuu-a.github.io/portfolio/en/` です。独自ドメインの場合は `NEXT_PUBLIC_SITE_URL` と `NEXT_PUBLIC_BASE_PATH` を指定して生成してください。
