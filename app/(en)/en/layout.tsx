import "@/app/globals.css";
import { siteFont } from "@/lib/site-font";
import { layoutMetadata } from "@/lib/site-metadata";

export const metadata = layoutMetadata("en");

export default function EnglishLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={siteFont.className}>{children}</body>
    </html>
  );
}
