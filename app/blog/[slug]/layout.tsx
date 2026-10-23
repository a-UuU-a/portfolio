import BlogWalker from "@/components/BlogWalker";
import { walkerVariantForArticle } from "@/lib/blog-walker";

export default function BlogArticleLayout({ children, params }: { children: React.ReactNode; params: { slug: string } }) {
  return (
    <div className="blog-article-page">
      {children}
      <BlogWalker variant={walkerVariantForArticle(params.slug)} />
    </div>
  );
}
