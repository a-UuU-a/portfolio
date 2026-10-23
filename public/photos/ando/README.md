# 安藤忠雄建築の写真を追加する

建築ごとのフォルダに、写真と `building.json` を入れます。写真はファイル名の自然順（`01`, `02`, …）で自動的に登録されるので、一枚ずつ設定する必要はありません。

```text
public/photos/ando/
  church-of-the-light/
    building.json
    01.jpg
    02.JPG
  another-building/
    building.json
    01.webp
```

1. このフォルダの `_template` をコピーし、建築名のフォルダに変更します（例: `church-of-the-light`）。`_` や `.` で始まるフォルダは読み込みません。
2. `building.json` に建築の情報を入力します。テンプレートの座標は淡路夢舞台の例なので、実際の建築の座標に書き換えてください。
3. 写真を同じフォルダに入れます。
4. `npm run dev` または `npm run build` を実行すると取り込みます。開発サーバーを起動済みなら、`npm run photos:ando` で更新できます。

```json
{
  "name": "建築の名前",
  "nameEn": "Optional English name",
  "location": "大阪・茨木",
  "country": "日本",
  "coordinates": [34.0, 135.0],
  "note": "空間や光についてのメモ"
}
```

上の名前・座標は記入例です。`name`、`location`、`country`、`coordinates` は必須です。座標は **[緯度, 経度]** の順で、Google Maps などから取得できます。`nameEn`、`note` は省略できます。撮影日時は建築データとして保存・表示しません。

対応形式は JPEG / JPG、PNG、WebP、AVIF（大文字の拡張子も可）です。HEIC は対応していないので JPEG などに変換してください。長辺 1600〜2400px 程度を推奨します。画像は加工せず、そのまま静的サイトにコピーされます。

写真のないフォルダは登録されません。追加したご自身の写真だけが地球儀とギャラリーに表示されます。

生成される `public/data/ando-collection.json` は直接編集せず、各建築の `building.json` を更新してください。GitHub Pages のビルド時も同じ処理が自動実行されます。

## 登録済み写真のメタデータと調査元

2026-10-23 確認。名称・所在地は施設公式サイトや自治体の資料、座標は下記の施設の地図・公開データで照合しています。座標は地球儀用の **[緯度, 経度]（WGS 84）** です。Google Maps の URL から読む場合は、画面中心の `@...` ではなく、施設のピンを示す `!3d緯度!4d経度` を使います。

| フォルダ | 名称・所在地の確認元 | 座標 | 座標の確認元 | 写真数 |
| --- | --- | --- | --- | --- |
| `21_21_design_sight` | [21_21 DESIGN SIGHT 公式案内](https://www.2121designsight.jp/information/)（東京都港区赤坂9-7-6） | `[35.6675248, 139.7305214]` | [公式案内からリンクされた Google Maps](https://maps.app.goo.gl/6qk3J6efTpoTFp6s8) の施設ピン | 3 |
| `chapel_of_the_wind` | [風の教会公式サイト](https://www.kazenokyoukai.com/)（兵庫県神戸市灘区六甲山町西谷山1878-78）。[英語名称](https://www.kazenokyoukai.com/home-1)は Chapel of the Wind | `[34.7563922, 135.2454739]` | [公式ウェディング案内](https://kazenokyoukai-wedding.com/look_at_the_kazenokyoukai/)の [Google Maps](https://goo.gl/maps/tq9TAHNHigz3sEwg6) の施設ピン | 3 |
| `hyogo_prefectural_museum_of_art` | [兵庫県立美術館公式サイト](https://www.artm.pref.hyogo.jp/)（兵庫県神戸市中央区脇浜海岸通1-1-1） | `[34.6992839, 135.2182245]` | [ひょうご観光本部の施設案内](https://www.hyogo-tourism.jp/fcnet/location/detail_1151.html)からリンクされた地図の目的地 | 3 |
| `nakanoshima_children's_book_forest` | [こども本の森 中之島 公式アクセス](https://kodomohonnomori.osaka/access/)（大阪府大阪市北区中之島1-1-28）。[英語名称](https://kodomohonnomori.osaka/en/)は Nakanoshima Children's Book Forest | `[34.693046, 135.5064044]` | [公式アクセスからリンクされた Google Maps](https://goo.gl/maps/VXjpoH2B9LJMdF7E7) の施設ピン | 5 |
| `shanghai_poly_grand_theatre` | [運営会社の施設一覧](https://www.polytheatre.com/newsCer/511)（上海市嘉定区白银路159号）。[嘉定区政府の英語案内](https://english.jiading.gov.cn/2025-04/30/c_1089835.htm)で英語名称・設計者も確認 | `[31.35533, 121.26055]` | [OpenStreetMap の建物](https://www.openstreetmap.org/way/1378677426)と[その座標表示](https://mapcarta.com/W1378677426)。中国国内地図の GCJ-02 / BD-09 座標は転記せず WGS 84 の建物代表点を使用 | 4 |
| `towada_public_library` | [十和田奥入瀬観光機構の施設案内](https://www.towada.travel/local/towada-city-library)（青森県十和田市西十三番町2-18）。[十和田市現代美術館の案内](https://towadaartcenter.com/wordpress/wp-content/uploads/2024/09/2ae8dce60e6c77ea9b4b0a48b95d24e7.pdf)の英語表記 Towada City Library を使用。複合施設全体は[十和田市教育プラザ](https://www.city.towada.lg.jp/shisei/koho/kohotowada/files/202303all.pdf) | `[40.61115861, 141.2046217]` | [青森県オープンデータ・十和田市公衆無線LANアクセスポイント一覧](https://opendata.pref.aomori.lg.jp/dataset/1475/resource/26343/content.html)の市民図書館 | 5 |

感想は推測せず `note` を空欄のままにしています。

登録時の23枚のうち、13枚の `.JPG` は補助画像を含む MPO 形式だったため、先頭の主画像を通常の単一画像 JPEG に変換しました。EXIF の回転を画素に反映し、長辺を最大2400px、品質92のプログレッシブ JPEG としています。カラープロファイルは保持しています。対象は `21_21_design_sight` の3枚、`hyogo_prefectural_museum_of_art` の `IMG_0201.JPG` / `IMG_0203.JPG`、`nakanoshima_children's_book_forest` の5枚、`shanghai_poly_grand_theatre` の `IMG_3834.JPG` / `IMG_3836.JPG` / `IMG_3852.JPG` です。

通常の JPEG だった残り10枚も再圧縮していません。HEIC 等のほかの未対応形式はありません。変換後もファイル名を維持しているため、写真の自然順や参照 URL は変わりません。

登録済み写真の EXIF の日時・タイムゾーン・秒未満の日時タグは削除しています。JPEG の画素データ、向き、カラープロファイルは維持しています。
