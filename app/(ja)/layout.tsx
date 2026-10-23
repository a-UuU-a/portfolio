import '@/app/globals.css';
import { siteFont } from '@/lib/site-font';
import { layoutMetadata } from '@/lib/site-metadata';

export const metadata = layoutMetadata('ja');

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={siteFont.className}>{children}</body>
    </html>
  );
}
