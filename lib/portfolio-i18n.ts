import { profile } from "./portfolio-data";

export type Locale = "ja" | "en";
export type LocalizedText = Record<Locale, string>;
export type DatePeriod = { start: string; end?: string; currentLabel?: LocalizedText };

export const portfolioCopy = {
  ja: {
    name: profile.displayName.ja,
    biography: profile.biography.ja,
    discover: "Discover More",
    menu: "メニュー",
    language: "表示言語",
    portrait: "Profile photo",
    advisor: "Advisor",
    present: "Present",
    dateLocale: "en-US",
    experience: "Work Experiences",
    email: "Email",
    follow: "Follow Me",
    photos: "写真を見る",
    viewWork: "作品を見る",
    publicationLink: "論文・記事を開く",
    blog: "Blog",
    cv: "CV",
    cvLink: "CVを開く（新しいタブ）",
    publicationHeadings: {
      intlJournals: "国際学術雑誌（査読あり）",
      domesticJournals: "国内学術雑誌（査読あり）",
      intlConferences: "国際会議発表（査読あり）",
      intlRefereedDemosPosters: "国際会議デモ・ポスター発表（査読あり）",
      domesticConferences: "国内会議デモ・ポスター発表，研究会・全国大会発表（査読なし）",
      otherWritings: "その他の執筆",
    },
  },
  en: {
    name: profile.displayName.en,
    biography: profile.biography.en,
    discover: "Discover More",
    menu: "Menu",
    language: "Language",
    portrait: "Portrait of Akira Murakami",
    advisor: "Advisor",
    present: "Present",
    dateLocale: "en-US",
    experience: "Experience",
    email: "Email",
    follow: "Follow Me",
    photos: "View photos (Japanese)",
    viewWork: "View project",
    publicationLink: "Open publication",
    blog: "Blog (Japanese)",
    cv: "CV",
    cvLink: "Open CV (new tab)",
    publicationHeadings: {
      intlJournals: "International Journals (Peer Reviewed)",
      domesticJournals: "Domestic Journals (Peer Reviewed)",
      intlConferences: "International Conferences (Peer Reviewed)",
      intlRefereedDemosPosters: "International Conference Demos & Posters (Peer Reviewed)",
      domesticConferences: "Domestic Conference Presentations, Demos & Posters (Non Refereed)",
      otherWritings: "Other Writing",
    },
  },
} as const;

export function formatPortfolioDate(value: string, locale: Locale): string {
  if (value.length === 4) return value;
  const day = value.length > 7;
  const date = new Date(`${value}${day ? "" : "-01"}T00:00:00Z`);
  return new Intl.DateTimeFormat(portfolioCopy[locale].dateLocale, {
    year: "numeric",
    month: "long",
    ...(day ? { day: "numeric" as const } : {}),
    timeZone: "UTC",
  }).format(date);
}

export function formatPortfolioPeriod(period: DatePeriod, locale: Locale): string {
  return `${formatPortfolioDate(period.start, locale)} – ${period.end ? formatPortfolioDate(period.end, locale) : period.currentLabel?.[locale] || portfolioCopy[locale].present}`;
}

export function portfolioAssetPath(path: string): string {
  return `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/${path.replace(/^\/+/, "")}`;
}

export function portfolioPath(locale: Locale): string {
  return locale === "ja" ? "/" : "/en/";
}
