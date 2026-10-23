import type { Metadata } from "next";
import AndoArchive from "@/components/AndoArchive";
import collection from "@/public/data/ando-collection.json";
import type { AndoCollection } from "@/lib/ando";

export const metadata: Metadata = {
  title: "Ando Atlas | Akira Murakami",
  description: "安藤忠雄建築をめぐる写真の記録。球体の世界地図から、場所と写真をたどる。",
};

export default function AndoPage() {
  return <AndoArchive collection={collection as AndoCollection} />;
}
