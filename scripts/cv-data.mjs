import { readFileSync } from "node:fs";
import ts from "typescript";

// portfolio-data.ts has type-only imports; importing its transpiled data keeps
// the site and CV on the same source without a second editable JSON file.
export async function loadPortfolio(file) {
  const { outputText } = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
  });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
}

export function dateLabel(value) {
  if (!value) return "";
  if (/^\d{4}$/.test(value)) return value;
  return new Intl.DateTimeFormat("en-GB", {
    month: "short", year: "numeric", ...(value.length > 7 ? { day: "numeric" } : {}), timeZone: "UTC",
  }).format(new Date(`${value}${value.length === 7 ? "-01" : ""}T00:00:00Z`)).replace(/\bSept\b/, "Sep");
}

export function periodLabel(period) {
  if (!period) return "";
  return `${dateLabel(period.start)} – ${period.end ? dateLabel(period.end) : "Present"}`;
}

export function dateRangeLabel(start, end) {
  if (!end) return dateLabel(start);
  if (start?.length === 10 && end.length === 10) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
    }).formatRange(new Date(`${start}T00:00:00Z`), new Date(`${end}T00:00:00Z`))
      .replace(/\bSept\b/g, "Sep").replace(/\s*–\s*/g, "–");
  }
  return [dateLabel(start), dateLabel(end)].filter(Boolean).join(" – ");
}

export function authorParts(html) {
  return html.replace(/<[^>]*>/g, "").split(/(Akira Murakami|村上\s*聡)/g)
    .filter(Boolean).map((text) => ({ text, self: /^(Akira Murakami|村上\s*聡)$/.test(text) }));
}

const groupHeadings = {
  intlConferences: { section: "Research Publications", title: "Conference Papers & Abstracts · peer reviewed" },
  intlRefereedDemosPosters: { section: "Research Publications", title: "Posters & Demonstrations · peer reviewed" },
  intlJournals: { section: "Research Publications", title: "Journal Articles · peer reviewed" },
  domesticJournals: { section: "Research Publications (Japanese)", title: "Journal Articles · peer reviewed" },
  domesticConferences: { section: "Research Publications (Japanese)", title: "Conference Presentations & Demonstrations · non refereed" },
};

export function makeCvData(portfolio, asOf, website) {
  const mapEntry = (entry) => ({
    title: entry.cv?.title ?? entry.title.en,
    date: entry.period ? periodLabel(entry.period) : dateRangeLabel(entry.date, entry.endDate),
    funding: entry.funding || "",
    details: entry.cv?.details ?? (entry.details || []).map((detail) => detail.en),
    location: entry.location || "",
    link: entry.links?.[0]?.href || "",
    upcoming: Boolean(entry.eventDate && entry.eventDate > asOf),
  });
  // Keep the original order for entries without dates rather than invent years.
  const sorted = (entries) => entries.map((entry, index) => ({ entry, index }))
    .sort((a, b) => {
      const left = a.entry.period?.start || a.entry.date;
      const right = b.entry.period?.start || b.entry.date;
      if (!left) return right ? 1 : a.index - b.index;
      if (!right) return -1;
      return right.localeCompare(left);
    }).map(({ entry }) => entry);
  return {
    updated: dateLabel(asOf),
    profile: { ...portfolio.profile, website, affiliation: portfolio.education[0].institution.en },
    education: portfolio.education.map((entry) => ({
      degree: entry.degree.en, institution: entry.university?.en ?? entry.institution.en, date: periodLabel(entry.period),
      advisors: !entry.period.end ? portfolio.advisors.en : "",
    })),
    experiences: sorted(portfolio.experiences).map((entry) => ({
      role: entry.role.en, company: entry.company, date: periodLabel(entry.period),
      description: entry.description.en.replace(/^I /, "").replace(/^worked /, "Worked ").replace(/^developed /, "Developed "),
      skills: entry.skills,
    })),
    publicationGroups: Object.entries(groupHeadings).map(([id, headings]) => {
      const group = portfolio.publicationGroups.find((item) => item.id === id);
      return {
        ...headings, id,
        publications: [...group.publications].sort((a, b) => b.year - a.year).map((pub, index) => ({
          title: pub.title, authors: authorParts(pub.authors), venue: pub.venue, link: pub.link || "",
          number: index + 1,
          japanese: group.language === "ja",
          upcoming: Boolean(pub.eventDate && pub.eventDate > asOf),
        })),
      };
    }).filter((group) => group.publications.length),
    awards: sorted(portfolio.awards).map(mapEntry),
    programs: sorted(portfolio.selectedPrograms).map(mapEntry),
    service: sorted(portfolio.service).map(mapEntry),
  };
}
