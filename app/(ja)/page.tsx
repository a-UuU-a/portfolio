import Portfolio from "@/components/Portfolio";
import { portfolioMetadata } from "@/lib/site-metadata";

export const metadata = portfolioMetadata("ja");

export default function JapanesePortfolio() {
  return <Portfolio locale="ja" />;
}
