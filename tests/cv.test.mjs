import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { authorParts, dateLabel, dateRangeLabel, loadPortfolio, makeCvData, periodLabel } from "../scripts/cv-data.mjs";

const portfolio = await loadPortfolio(fileURLToPath(new URL("../lib/portfolio-data.ts", import.meta.url)));
const website = "https://a-uuu-a.github.io/portfolio/en/";

test("the shared source retains every research publication, author, and Japanese title", () => {
  const cv = makeCvData(portfolio, "2026-10-24", website);
  for (const source of portfolio.publicationGroups.filter((group) => group.id !== "otherWritings")) {
    const group = cv.publicationGroups.find((item) => item.id === source.id);
    assert.equal(group.publications.length, source.publications.length);
    for (const pub of source.publications) {
      const rendered = group.publications.find((item) => item.title === pub.title);
      assert.equal(rendered.authors.map((part) => part.text).join(""), pub.authors.replace(/<[^>]*>/g, ""));
      assert.equal(rendered.japanese, source.language === "ja");
      assert.equal(rendered.link, pub.link || "");
    }
  }
  assert.deepEqual(authorParts('<strong><u>村上 聡</u></strong>，Smith & Jones'), [
    { text: "村上 聡", self: true }, { text: "，Smith & Jones", self: false },
  ]);
});

test("scheduled presentations and service stop being upcoming on their event date", () => {
  const before = makeCvData(portfolio, "2026-10-24", website);
  const onDate = makeCvData(portfolio, "2026-11-16", website);
  const demo = (cv) => cv.publicationGroups.find((group) => group.id === "intlRefereedDemosPosters").publications[0];
  assert.equal(demo(before).upcoming, true);
  assert.equal(demo(onDate).upcoming, false);
  assert.equal(before.service[0].upcoming, true);
  assert.equal(onDate.service[0].upcoming, false);
});

test("research publications are separated by language and other writing is omitted from the CV", () => {
  const cv = makeCvData(portfolio, "2026-10-24", website);
  assert.equal(cv.publicationGroups.some((group) => group.id === "otherWritings"), false);
  for (const group of cv.publicationGroups) {
    assert.equal(group.section, group.publications[0].japanese ? "Research Publications (Japanese)" : "Research Publications");
    assert.equal(group.publications[0].number, 1);
  }
  assert.equal(cv.education.filter((entry) => entry.advisors).length, 1);
});

test("concise CV wording retains funding and leaves the website copy intact", () => {
  const source = {
    ...portfolio.selectedPrograms[0],
    cv: { title: "Concise program title", details: ["Concise program detail"] },
  };
  const cv = makeCvData({ ...portfolio, selectedPrograms: [source] }, "2026-10-24", website);
  assert.equal(cv.programs[0].title, "Concise program title");
  assert.deepEqual(cv.programs[0].details, ["Concise program detail"]);
  assert.equal(cv.programs[0].funding, source.funding);
  assert.notEqual(source.title.en, cv.programs[0].title);
});

test("new entries flow through without template edits, newest first, with undated entries retained", () => {
  const addition = {
    title: { ja: "新しい実績", en: "A new program" }, date: "2026-10",
  };
  const cv = makeCvData({ ...portfolio, selectedPrograms: [...portfolio.selectedPrograms, addition] }, "2026-10-24", website);
  assert.equal(cv.programs[0].title, "A new program");
  assert.equal(cv.programs.length, portfolio.selectedPrograms.length + 1);
  assert.equal(cv.programs[1].date, "Apr 2025 – Present");
  assert.deepEqual(cv.programs.slice(2).map((entry) => entry.date), ["", ""]);
  const extra = { title: "New paper", authors: "<strong><u>Akira Murakami</u></strong>", venue: "A new venue", year: 2027 };
  const updated = makeCvData({
    ...portfolio,
    publicationGroups: portfolio.publicationGroups.map((group) => group.id === "intlConferences" ? { ...group, publications: [...group.publications, extra] } : group),
  }, "2027-01-01", website);
  assert.equal(updated.publicationGroups[0].publications[0].title, "New paper");
});

test("partial dates and open periods preserve the source's precision", () => {
  assert.equal(dateLabel("2025"), "2025");
  assert.equal(dateLabel("2025-04"), "Apr 2025");
  assert.equal(dateLabel("2026-10-24"), "24 Oct 2026");
  assert.equal(dateLabel(undefined), "");
  assert.equal(periodLabel({ start: "2024-10", end: "2026-09" }), "Oct 2024 – Sep 2026");
  assert.equal(periodLabel({ start: "2026-10" }), "Oct 2026 – Present");
  assert.equal(dateRangeLabel("2018-08-27", "2018-08-28"), "27–28 Aug 2018");
  assert.equal(dateRangeLabel("2025"), "2025");
});
