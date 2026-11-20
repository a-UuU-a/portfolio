import type { CSSProperties, MouseEvent, RefObject } from "react";
import { Award, BookOpen, FolderOpen, Star, Tag, Users, X } from "lucide-react";
import { awards, publicationGroups, selectedPrograms, service, works, type Publication, type TaggedContent } from "@/lib/portfolio-data";
import type { Locale, LocalizedText } from "@/lib/portfolio-i18n";
import styles from "./PortfolioRelated.module.css";

export const relatedSections = {
  publications: { label: "Publications", icon: BookOpen },
  works: { label: "Works", icon: FolderOpen },
  awards: { label: "Awards", icon: Award },
  "selected-programs": { label: "Selected Programs", icon: Star },
  service: { label: "Service", icon: Users },
} as const;

type PageItem = {
  id: string;
  section: keyof typeof relatedSections;
  content: TaggedContent & { title: string | LocalizedText };
};

export type TagControls = {
  activeTag: string | null;
  toggleTag: (tag: string, event: MouseEvent<HTMLButtonElement>) => void;
};

export function publicationsInPageOrder(publications: Publication[]) {
  return [...publications].sort((a, b) => b.year - a.year);
}

const itemsInPageOrder: PageItem[] = [
  ...publicationGroups.flatMap(group => publicationsInPageOrder(group.publications).map((publication): PageItem =>
    ({ id: `publication-${publication.id}`, section: "publications", content: publication }),
  )),
  ...works.map((work): PageItem => ({ id: `work-${work.id}`, section: "works", content: work })),
  ...([["awards", awards], ["selected-programs", selectedPrograms], ["service", service]] as const).flatMap(([section, entries]) =>
    entries.map((entry): PageItem => ({ id: `entry-${entry.id}`, section, content: entry })),
  ),
];

function relatedResults(tag: string, locale: Locale) {
  const localize = (text: string | LocalizedText) => typeof text === "string" ? text : text[locale];
  return itemsInPageOrder.filter(({ content }) => content.tags?.includes(tag)).map(({ id, section, content }) => ({
    id,
    section,
    title: localize(content.title),
    label: localize(content.relatedLabel ?? content.title),
  }));
}

export function RelatedTags({ tags, className, activeTag, toggleTag }: TagControls & {
  tags?: readonly string[];
  className: string;
}) {
  if (!tags?.length) return null;
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {Array.from(new Set(tags)).map(tag => (
        <button
          key={tag}
          type="button"
          aria-pressed={activeTag === tag}
          aria-controls="portfolio-related-content"
          className={`${styles.tag} min-h-8 rounded-full bg-gray-100 px-3 py-1 text-sm font-normal text-gray-700 transition-colors hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 aria-pressed:bg-gray-900 aria-pressed:text-white aria-pressed:hover:bg-gray-800`}
          onClick={event => toggleTag(tag, event)}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}

export function RelatedContentFan({ activeTag, locale, hubRef, clearTag }: {
  activeTag: string | null;
  locale: Locale;
  hubRef: RefObject<HTMLButtonElement>;
  clearTag: () => void;
}) {
  const results = activeTag ? relatedResults(activeTag, locale) : [];
  const label = locale === "ja" ? "関連コンテンツ" : "Related content";
  const hubLabel = activeTag
    ? locale === "ja" ? `${activeTag} の選択を解除` : `Clear ${activeTag}`
    : locale === "ja" ? "タグを選ぶと関連コンテンツを表示" : "Select a tag to see related content";

  return (
    <div className={styles.fan}>
      <button
        ref={hubRef}
        type="button"
        className={styles.hub}
        aria-label={hubLabel}
        aria-expanded={Boolean(activeTag)}
        aria-controls="portfolio-related-content"
        disabled={!activeTag}
        onClick={clearTag}
      >
        {activeTag ? <><X size={14} aria-hidden="true" /><span>{activeTag}</span></> : <Tag size={21} aria-hidden="true" />}
      </button>
      <div id="portfolio-related-content">
        {activeTag && (
          <nav key={activeTag} className={styles.results} aria-label={label} data-single={results.length === 1}>
            <ul>
              {results.map((result, index) => {
                const { label: sectionLabel, icon: Icon } = relatedSections[result.section];
                const offset = results.length === 1 ? 0.35 : Math.sin(index / (results.length - 1) * Math.PI / 2);
                return (
                  <li key={result.id} style={{ "--fan-offset": offset, "--fan-delay": `${index * 28}ms` } as CSSProperties}>
                    <a href={`#${result.id}`} title={result.title}>
                      <Icon size={17} aria-hidden="true" />
                      <span><small>{sectionLabel}</small>{result.label}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
}
