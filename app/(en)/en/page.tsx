import Portfolio from "@/components/Portfolio";
import { portfolioMetadata } from "@/lib/site-metadata";

export const metadata = portfolioMetadata("en");

export default function EnglishPortfolio() {
  return <Portfolio locale="en" />;
}
