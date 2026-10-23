import type { DatePeriod, LocalizedText } from "./portfolio-i18n";

export type Publication = {
  title: string;
  authors: string;
  venue: string;
  year: number;
  link?: string;
};

// 各カテゴリごとの論文データ
export const intlJournals: Publication[] = [
  {
    title:
      "Mathematical Games of Dice - A Research Based Calculations Using Computer Algebra Systems",
    authors:
      "Ryohei Miyadera, <strong><u>Akira Murakami</u></strong>, Nazuki Terakawa, Keito Tanemura, Mao Fujino and Hisayoshi Sakahira",
    venue:
      "Solid State Technology, Vol. 63, No. 1s, pp. 619 - 629, 2020",
    year: 2020,
    link: "https://solidstatetechnology.us/index.php/JSST/article/view/749",
  },
  {
    title: "A Variant of Bogus Nim – Experimental Mathematics Approach",
    authors:
      "Ryohei Miyadera, Nazuki Terakawa, Keito Tanemura, <strong><u>Akira Murakami</u></strong>, Mariko Kashiwagi, Ryuhei Utsuhara",
    venue:
      "Solid State Technology, Vol. 63, No. 1s, pp. 662 – 669, 2020",
    year: 2020,
    link: "https://solidstatetechnology.us/index.php/JSST/article/view/753",
  },
];
export const domesticJournals: Publication[] = [
  {
    title: "面数が異なるサイコロを用いたサイコロゲームに関する研究",
    authors:
      "鈴木利菜，<strong><u>村上 聡</u></strong>，寺川渚月，坂本悠輔，宮寺良平，川上さくら",
    venue: "ゲーム学会論文誌，14-1，pp.14-17，2020",
    year: 2020,
  },
];
export const intlConferences: Publication[] = [
  {
    title: "OrigamiWalls: A Shape-Changing Robotic Partitioning System for Diverse Spatial Reconfigurations",
    authors:
      "<strong><u>Akira Murakami</u></strong>, Kazuyuki Fujita, Yuki Onishi, and Yoshifumi Kitamura",
    venue: "Proceedings of the 2026 Designing Interactive Systems Conference (DIS ’26), Singapore, pp. 4559–4576, 2026",
    year: 2026,
    link: "https://doi.org/10.1145/3800645.3812904",
  },
  {
    title: "Mathematical Games of Dice - A Research Based Calculations Using Computer Algebra Systems",
    authors:
      "Ryohei Miyadera, <strong><u>Akira Murakami</u></strong>, Nazuki Terakawa, Keito Tanemura, Mao Fujino, Hisayoshi Sakahira, Masanori Fukui",
    venue: "The Proceedings of the 5th International Conference on Management, Engineering, Science, Social Science and Humanities, Penang, pp.54, 2020",
    year: 2020,
    link: "https://www.researchgate.net/profile/Khar-Ng-3/publication/347785430_Proceedings_iCon_MESSSH20/links/5fe3e22b92851c13feb48b4b/Proceedings-iCon-MESSSH20.pdf#page=71",
  },
  {
    title: "A Variant of Bogus Nim - Experimental Mathematics Approach",
    authors:
      "Ryohei Miyadera, Masanori Fukui, Nazuki Terakawa, Keito Tanemura, <strong><u>Akira Murakami</u></strong>, Mariko Kashiwagi, Ryuhei Utsuhara",
    venue:
      "The Proceedings of the 5th International Conference on Management, Engineering, Science, Social Science and Humanities, Penang, pp.55, 2020",
    year: 2020,
    link: "https://www.researchgate.net/profile/Khar-Ng-3/publication/347785430_Proceedings_iCon_MESSSH20/links/5fe3e22b92851c13feb48b4b/Proceedings-iCon-MESSSH20.pdf#page=72",
  },
  {
    title: "Wythoff’s Game with a Pass",
    authors:
      "Ryohei Miyadera, Mariko Kashiwagi, Masanori Fukui, <strong><u>Akira Murakami</u></strong>, Keito Tanemura, Itsuki Kitagawa, Kazuya Hiramatsu and Shintaro Kaiomto",
    venue: "JCDCG^3 2019, Tokyo, pp.100-101, 2019",
    year: 2019,
    link: "http://www.jcdcgg.u-tokai.ac.jp/JCDCG3_2019_abstracts_v1.pdf",
  },
  {
    title: "“Rugby Nim” that is a Variant of “Sliding”",
    authors:
      "Ryohei Miyadera, Mariko Kashiwagi, Michitada Hayashi, Sintarou Kaimoto, Keito Tanemura, <strong><u>Akira Murakami</u></strong>, Ryuhei Utsuhara",
    venue: "JCDCG^3 2018, Manila, pp. 41-43, 2018",
    year: 2018,
    link: "https://drive.google.com/file/d/1RFaXEdKk5TUHc1QePWsdplOR7etRZOV1/view",
  },
  {
    title: "“Sliding With a Push” that is a Variant Of “Sliding”",
    authors:
      "Ryohei Miyadera, Mariko Kashiwagi, Nazuki Terakawa, Syouta Masuda, Keito Tanemura, Sintarou Kaimoto, Ryuhei Utsuhara, <strong><u>Akira Murakami</u></strong>",
    venue: "JCDCG^3 2018, Manila, pp. 39-41, 2018",
    year: 2018,
    link: "https://drive.google.com/file/d/1RFaXEdKk5TUHc1QePWsdplOR7etRZOV1/view",
  },
];
export const intlRefereedDemosPosters: Publication[] = [
  {
    title: "AmbiXR: Adaptive Visual Syntax for Resolving Ambiguous Instructions in LLM-Assisted XR Authoring",
    authors:
      "<strong><u>Akira Murakami</u></strong>, Kodai Hatakeyama, Ryo Ooka, Kazuyuki Fujita, Guanghan Zhao, and Yoshifumi Kitamura",
    venue: "32nd ACM Symposium on Virtual Reality Software and Technology (VRST ’26), Sendai, Japan, November 16–18, 2026, ACM, 2 pages",
    year: 2026,
    link: "https://doi.org/10.1145/3822517.3849962",
  },
];
export const domesticConferences: Publication[] = [
  {
    title:
      "複数の音源対象を持つコンテンツの視聴における視線に応じた振動触覚提示手法",
    authors:
      "金井 美桜，藤田 和之，<strong><u>村上 聡</u></strong>，齋藤 五大，北村 喜文",
    venue: "第30回日本バーチャルリアリティ学会大会 (VRSJ’25)，2025年9月，大阪",
    year: 2025,
    link: "https://conference.vrsj.org/ac2025/program/doc/3E2-06.pdf",
  },
  {
    title:
      "豆|頁：なんかきられてももどるやつ",
    authors:
      "菊池 勇吾, 金井 美桜, 佐々木 涼, <strong><u>村上 聡</u></strong>, 伊藤 勝徳, 尾形 優斗, 柴藤 りん, 佐藤 生琉, 西山 喜尋",
    venue: "第30回日本バーチャルリアリティ学会大会 (VRSJ’25)，2025年9月，大阪",
    year: 2025,
    link: "https://conference.vrsj.org/ac2025/program/doc/IVRC-05.pdf",
  },
  {
    title: "折紙構造を用いた自走式・形態変化パーティションデバイス",
    authors: "<strong><u>村上 聡</u></strong>，藤田 和之，北村 喜文",
    venue:
      "第32回インタラクティブシステムとソフトウェアに関するワークショップ (WISS’24)，2024，新潟",
    year: 2024,
    link: "https://www.wiss.org/WISS2024Proceedings/data/demo//2-B08.pdf",
  },
  {
    title: "ゲーム・パズルの変形・改良に着目した創造性発揮プロセスの実態把握",
    authors:
      "福井 昌則，柏木 麻理子，寺本 雅治，<strong><u>村上 聡</u></strong>，種村 圭依人，宮寺 良平，平嶋 宗",
    venue: "「ゲームと教育」研究部会第12回研究会，2019，香川",
    year: 2019,
    link: "https://www.gameamusementsociety.org/article.php?story=GameEdu_12",
  },
  {
    title: "サイコロゲームの数学",
    authors:
      "寺川 渚月，<strong><u>村上 聡</u></strong>，柏木 麻里子，寺本 雅治，坂本 悠輔，宮寺 良平，北川 一希，平松 和也",
    venue: "ゲーム学会第18回全国大会，2019，大阪",
    year: 2019,
    link: "https://www.gameamusementsociety.org/staticpages/index.php?page=GAS_18th_program",
  },
  {
    title: "Wythoff のゲームの変種-制限付きの 2 つの Rook",
    authors:
      "寺川 渚月，<strong><u>村上 聡</u></strong>，宮寺 良平，北川 一希，平松 和也，青山 あいほ，末續 鴻輝",
    venue: "ゲーム学会第18回全国大会，2019，大阪",
    year: 2019,
    link: "https://www.gameamusementsociety.org/staticpages/index.php?page=GAS_18th_program",
  },
];
export const otherWritings: Publication[] = [
  {
    title: "学会参加報告 DIS 2026",
    authors: "<strong><u>村上 聡</u></strong>",
    venue: "日本バーチャルリアリティ学会 学会参加報告，2026年7月27日",
    year: 2026,
    link: "https://vrsj.org/report/13581/",
  },
];

export const publicationGroups = [
  { id: "intlJournals", publications: intlJournals, language: "en" },
  { id: "domesticJournals", publications: domesticJournals, language: "ja" },
  { id: "intlConferences", publications: intlConferences, language: "en" },
  { id: "intlRefereedDemosPosters", publications: intlRefereedDemosPosters, language: "en" },
  { id: "domesticConferences", publications: domesticConferences, language: "ja" },
  { id: "otherWritings", publications: otherWritings, language: "ja" },
] as const;

export const advisors: LocalizedText = {
  ja: "Yoshifumi Kitamura, Kazuyuki Fujita",
  en: "Yoshifumi Kitamura, Kazuyuki Fujita",
};

type Education = {
  id: string;
  degree: LocalizedText;
  institution: LocalizedText;
  period: DatePeriod;
};

// Official English name: https://www.is.tohoku.ac.jp/en/
const informationSciences: LocalizedText = {
  ja: "東北大学大学院 情報科学研究科",
  en: "Graduate School of Information Sciences, Tohoku University",
};

export const education: Education[] = [
  {
    id: "doctoral",
    degree: { ja: "Doctoral Program in Information Science", en: "Doctoral Program in Information Science" },
    institution: informationSciences,
    period: { start: "2026-10", currentLabel: { ja: "Current", en: "Present" } },
  },
  {
    id: "masters",
    degree: { ja: "Master of Information Science", en: "Master of Information Sciences" },
    institution: informationSciences,
    period: { start: "2024-10", end: "2026-09" },
  },
  {
    id: "bachelors",
    degree: { ja: "Bachelor of Engineering", en: "Bachelor of Engineering" },
    institution: {
      // Official names: https://www.ecei.tohoku.ac.jp/eipe/
      // https://www.eng.tohoku.ac.jp/english/academics/studies/bachelor/eipe.html
      ja: "東北大学 工学部 電気情報物理工学科",
      en: "Department of Electrical, Information and Physics Engineering, School of Engineering, Tohoku University",
    },
    period: { start: "2021-04", end: "2024-09" },
  },
];

type Experience = {
  id: string;
  company: string;
  role: LocalizedText;
  description: LocalizedText;
  period: DatePeriod;
  skills: string[];
};

export const experiences: Experience[] = [
  {
    id: "adansons",
    company: "Adansons, Inc.",
    role: { ja: "Engineer Intern", en: "Engineer Intern" },
    description: {
      ja: "触覚技術を活用した技能伝達に関する研究プロジェクトに参加し，企画から展示会向けのソフトウェアの開発までを担当しました．",
      en: "I worked on a research project exploring skill transfer through haptic technology, from planning to developing software for exhibitions.",
    },
    period: { start: "2021-10", end: "2025-11" },
    skills: ["iOS App Dev (Swift UI / AWS)", "VR App Dev (Unity)", "Web App Dev (Next.js / MUI / AWS)"],
  },
  {
    id: "bridge-ui",
    company: "Bridge UI, Inc.",
    role: { ja: "Research Intern", en: "Research Intern" },
    description: {
      ja: "研究用のモバイルアプリケーションおよび数学教育向けのWebアプリケーションの開発を経験しました．",
      en: "I developed mobile applications for research and web applications for mathematics education.",
    },
    period: { start: "2021-04", end: "2023-04" },
    skills: ["iOS App Dev (Swift UI)", "Web App Dev (Vue.js / Vuetify / Firebase)"],
  },
];

export type Work = {
  id: number;
  title: string;
  description: LocalizedText;
  year: number;
  image: string;
  imageFit?: "cover" | "contain";
  link: string;
  linkLabel?: LocalizedText;
  openInNewTab?: boolean;
  tags: string[];
};

export const works: Work[] = [
  {
    id: 5,
    title: "OrigamiWalls",
    image: "/works/origamiwalls.png",
    imageFit: "contain",
    description: {
      ja: "折紙構造を用いた，自走式・形態変化パーティションシステム．折りたたみ・曲面・平面を切り替えることで，多様な空間構成を実現します．",
      en: "A shape-changing robotic partition system based on origami structures. It transitions between folded, curved, and flat forms to support diverse spatial layouts.",
    },
    year: 2026,
    tags: ["HCI", "Robotics", "Shape-Changing Interfaces"],
    link: "https://www.youtube.com/watch?v=AJCRrbY47VU",
    linkLabel: { ja: "動画を見る", en: "Watch video" },
    openInNewTab: true,
  },
  {
    id: 4,
    title: "Ando Atlas",
    image: "/works/ando-atlas.svg",
    description: {
      ja: "安藤忠雄建築をめぐる写真の記録．球体の世界地図から，場所と写真をたどるビューアです．",
      en: "A photographic record of Tadao Ando’s architecture. Explore places and photographs through an interactive globe.",
    },
    year: 2026,
    tags: ["Photography", "Architecture", "Interactive Globe"],
    link: "/ando/",
    openInNewTab: true,
  },
  {
    id: 1,
    title: "Rhizome",
    image: "/works/rhizome.png",
    description: {
      ja: "Rhizomeは会話内容をグラフネットワーク形式で自動で要約してくれる会議サポートツールです．",
      en: "A meeting support tool that automatically summarizes conversations as graph networks.",
    },
    year: 2024,
    tags: ["Web App", "minutes", "Graph Network"],
    link: "https://github.com/Set022525/Rhizome",
    openInNewTab: true,
  },
  {
    id: 2,
    title: "DigLike",
    image: "/works/JPHACKS2022.png",
    description: {
      ja: "DigLikeはTwitterのいいねを自動で整理し，空き時間に聞けるPodcastに変換するアプリです．",
      en: "An app that organizes Twitter likes and turns them into podcasts to listen to in your spare time.",
    },
    year: 2022,
    tags: ["Web App", "Podcast", "NLP"],
    link: "https://github.com/jphacks/A_2205",
    openInNewTab: true,
  },
  {
    id: 3,
    title: "Morbido",
    image: "/works/morbido.png",
    description: {
      ja: "Mobidoは導電性繊維を用いたふわふわなセンサーです．",
      en: "A soft, fluffy sensor made with conductive fibers.",
    },
    year: 2021,
    tags: ["Electronics", "Fabrication", "Sensor"],
    link: "https://www.tohoku.ac.jp/japanese/2021/12/press20211222-01-idea.html",
    openInNewTab: true,
  },
];

export type PortfolioEntry = {
  id: string;
  title: LocalizedText;
  funding?: string;
  details?: LocalizedText[];
  date?: string;
  endDate?: string;
  period?: DatePeriod;
  location?: string;
  contributors?: string[];
  contributorLanguage?: "ja" | "en";
  links?: { href: string; label: LocalizedText }[];
};

export const awards: PortfolioEntry[] = [
  {
    id: "ivrc-2025",
    title: {
      ja: "Interverse Virtual Reality Challenge (IVRC) 2025「豆|頁：なんかきられてももどるやつ」",
      en: "Interverse Virtual Reality Challenge (IVRC) 2025 — 「豆|頁：なんかきられてももどるやつ」",
    },
    date: "2025",
    details: [
      {
        ja: "SEED Stageにおいて Unity賞，CRI・ミドルウェア賞，観客賞　受賞．",
        en: "SEED Stage: Unity Award, CRI Middleware Award, and Audience Award.",
      },
      {
        ja: "LEAP Stage進出（書類応募96作品のうち，書類審査を通過した20作品から審査員により選出された10作品の一つ）．",
        en: "Selected for the LEAP Stage as one of 10 projects chosen by the judges from 20 shortlisted projects, out of 96 submissions.",
      },
      {
        ja: "LEAP Stageにおいて 市原えつこ賞，観客賞　受賞．",
        en: "LEAP Stage: Etsuko Ichihara Award and Audience Award.",
      },
    ],
    links: [
      { href: "https://ivrc.net/2025/release2/", label: { ja: "SEED Stage 結果", en: "SEED Stage results" } },
      { href: "https://ivrc.net/2025/release3/", label: { ja: "LEAP Stage 結果", en: "LEAP Stage results" } },
      { href: "https://criware.info/ivrc-2025-seed/", label: { ja: "メディア掲載：CRIWARE", en: "Media coverage: CRIWARE" } },
    ],
  },
  {
    id: "hack-u-2022",
    title: { ja: "Open Hack U 2022 Spring ONLINE 最優秀賞", en: "Open Hack U 2022 Spring ONLINE — Grand Prize" },
    date: "2022",
    links: [{ href: "https://hacku.yahoo.co.jp/hacku2022spring_online/", label: { ja: "コンテスト公式ページ", en: "Contest website" } }],
  },
  {
    id: "business-2021",
    title: { ja: "東北大学ビジネスアイデアコンテスト 2021 最優秀賞", en: "Tohoku University Business Idea Contest 2021 — Grand Prize" },
    date: "2021",
    links: [{ href: "https://www.tohoku.ac.jp/japanese/2021/12/press20211222-01-idea.html", label: { ja: "受賞のお知らせ", en: "Award announcement" } }],
  },
  {
    id: "web-contest-2020",
    title: { ja: "第21回全国中学高校 Webコンテスト 高校生の部 セミファイナリスト", en: "21st National Junior and Senior High School Web Contest — Semifinalist, High School Division" },
    date: "2020-02",
  },
  {
    id: "musashino-2019",
    title: { ja: "武蔵野大学数理工学コンテスト 奨励賞", en: "Musashino University Mathematical Engineering Contest — Encouragement Award" },
    date: "2019-11",
    links: [{ href: "https://prod-files-secure.s3.us-west-2.amazonaws.com/b7c9c44c-90c8-4194-bff1-3b351c1a5aeb/a6c945c5-5372-4dda-a71a-ede85a72b9ec/musashino_2019.pdf", label: { ja: "受賞資料（PDF）", en: "Award document (PDF)" } }],
  },
  {
    id: "sgh-2019",
    title: { ja: "SGH甲子園 日本語優秀賞", en: "SGH Koshien — Japanese Presentation Award" },
    date: "2019-03",
    details: [{
      ja: "「数学的活動によって創造的な人を育てる方法の研究とその方法のアジア圏での普及」",
      en: "Research on fostering creativity through mathematical activities and sharing these methods across Asia.",
    }],
    contributors: ["柏木 麻里子", "種村 圭依人", "村上 聡", "海本 晋太朗", "今西 敏都"],
    contributorLanguage: "ja",
  },
  {
    id: "jsec-2018",
    title: { ja: "高校生科学技術チャレンジ Jsec2018 入選", en: "Japan Science & Engineering Challenge (JSEC) 2018 — Selected Entry" },
    date: "2018-12",
  },
  {
    id: "science-castle-2018",
    title: { ja: "サイエンスキャッスル 優秀賞", en: "Science Castle — Excellence Award" },
    date: "2018-02",
  },
];

export const selectedPrograms: PortfolioEntry[] = [
  {
    id: "mitohoku-4",
    title: {
      ja: "経済産業省 未踏的な地方の若手人材発掘育成支援事業補助金AKATSUKIプロジェクト - MiTOHOKU Program 4期採択",
      en: "Selected for the 4th cohort of the MiTOHOKU Program, METI AKATSUKI Project",
    },
    funding: "Project funding: 1,200,000 JPY",
    links: [{ href: "https://mitohoku.jp/", label: { ja: "MiTOHOKU Program", en: "MiTOHOKU Program" } }],
  },
  {
    id: "gp-ds",
    title: {
      ja: "東北大学データ科学国際共同大学院（GP-DS）プログラム採択",
      en: "Selected for the Graduate Program in Data Science (GP-DS), Tohoku University",
    },
    funding: "200,000 JPY/month + financial support for study abroad",
    period: { start: "2025-04" },
    links: [{ href: "https://gp-ds.tohoku.ac.jp/", label: { ja: "GP-DS", en: "GP-DS" } }],
  },
  {
    id: "mitohoku-2",
    title: {
      ja: "経済産業省 未踏的な地方の若手人材発掘育成支援事業補助金AKATSUKIプロジェクト - MiTOHOKU Program 2期採択",
      en: "Selected for the 2nd cohort of the MiTOHOKU Program, METI AKATSUKI Project",
    },
    funding: "Project funding: 1,000,000 JPY",
    links: [{ href: "https://mitohoku.jp/", label: { ja: "MiTOHOKU Program", en: "MiTOHOKU Program" } }],
  },
];

const seameoContributors = [
  "Ryohei Miyadera", "Daisuke Minematsu", "Masanori Fukui", "Yushi Nakaya",
  "Yuji Sasaki", "Jo Hagikura", "Shintaro Kaimoto", "Nazuki Terakawa",
  "Keito Tanemura", "Akira Murakami",
];

export const service: PortfolioEntry[] = [
  {
    id: "vrst-2026",
    title: { ja: "ACM VRST 2026 Student Volunteer", en: "ACM VRST 2026 — Student Volunteer" },
    date: "2026",
  },
  {
    id: "chi-symposium-2025",
    title: {
      ja: "市民公開講座 / 横浜市MICE次世代育成事業「CHI 2025 シンポジウム」学生委員",
      en: "CHI 2025 Symposium — Student Committee Member (Public Lecture / Yokohama MICE Next Generation Development Project)",
    },
    date: "2025",
    links: [{ href: "https://sigchi.jp/symposium/chi2025_symposium", label: { ja: "シンポジウム公式ページ", en: "Symposium website" } }],
  },
  {
    id: "wiss-2024",
    title: { ja: "WISS2024 学生ボランティア", en: "WISS 2024 — Student Volunteer" },
    date: "2024",
  },
  {
    id: "seameo-2019",
    title: { ja: "SEAMEO Education Agenda and Blended Mode Training Programme", en: "SEAMEO Workshop — Staff" },
    date: "2019",
    location: "Seameo Recsam, Penang, Malaysia",
    details: [
      { ja: "’LearnT-SMArET with Promotion of Scientific/Mathematical’", en: "SEAMEO Education Agenda and Blended Mode Training Programme — LearnT-SMArET with Promotion of Scientific/Mathematical" },
      { ja: '"Problem-Solving and Computational Thinking Skills" スタッフ', en: "“Problem-Solving and Computational Thinking Skills”" },
    ],
    contributors: [...seameoContributors, "Itsuki Kitagawa", "Kazuya Hiramatsu"],
    contributorLanguage: "en",
  },
  {
    id: "seameo-2018",
    title: { ja: "SEAMEO Education Agenda and Blended Mode Training Programme", en: "SEAMEO Workshop — Staff" },
    date: "2018-08-27",
    endDate: "2018-08-28",
    location: "Seameo Recsam, Penang, Malaysia",
    details: [
      { ja: "’LearnT-SMArET with Promotion of Scientific/Mathematical’", en: "SEAMEO Education Agenda and Blended Mode Training Programme — LearnT-SMArET with Promotion of Scientific/Mathematical" },
      { ja: "“Workshop on Enhancing Creativity through Transdisciplinary Mathematics Education” スタッフ", en: "“Workshop on Enhancing Creativity through Transdisciplinary Mathematics Education”" },
    ],
    contributors: seameoContributors,
    contributorLanguage: "en",
  },
];
