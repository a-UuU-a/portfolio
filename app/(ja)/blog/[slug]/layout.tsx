import BlogWalker from "@/components/BlogWalker";

export default function BlogArticleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="blog-article-page">
      {children}
      <BlogWalker />
    </div>
  );
}
