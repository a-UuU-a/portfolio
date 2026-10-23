import type { Metadata } from "next";
import { portfolioCopy, portfolioPath, type Locale } from "./portfolio-i18n";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const metadataBase = new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://a-uuu-a.github.io");

export function layoutMetadata(locale: Locale): Metadata {
  return {
    metadataBase,
    title: "Portfolio | Akira Murakami",
    description: portfolioCopy[locale].biography,
  };
}

export function portfolioMetadata(locale: Locale): Metadata {
  const metadata = layoutMetadata(locale);
  const path = `${basePath}${portfolioPath(locale)}`;
  return {
    ...metadata,
    alternates: {
      canonical: path,
      languages: {
        ja: `${basePath}${portfolioPath("ja")}`,
        en: `${basePath}${portfolioPath("en")}`,
        "x-default": `${basePath}${portfolioPath("ja")}`,
      },
    },
    openGraph: {
      title: "Portfolio | Akira Murakami",
      description: portfolioCopy[locale].biography,
      type: "website",
      url: path,
      locale: locale === "ja" ? "ja_JP" : "en_US",
      alternateLocale: locale === "ja" ? "en_US" : "ja_JP",
    },
  };
}
