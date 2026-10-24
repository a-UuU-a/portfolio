"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Award, BookOpen, Briefcase, ChevronDown, ExternalLink, FileText, FolderOpen, GraduationCap, Menu, MessageSquare, NotebookPen, Star, Users, User, X } from "lucide-react";
import { FaFacebook, FaGithub, FaGoogleScholar, FaLinkedin, FaXTwitter } from "react-icons/fa6";
import P5Sketch from "./P5Sketch";
import GlitchImage from "./GlitchImage";
import { portfolioSketch } from "./portfolio-sketch";
import { advisors, awards, education, experiences, profile, publicationGroups, selectedPrograms, service, works, type PortfolioEntry, type Publication, type Work } from "@/lib/portfolio-data";
import { formatPortfolioDate, formatPortfolioPeriod, portfolioAssetPath, portfolioCopy, portfolioPath, type Locale } from "@/lib/portfolio-i18n";

const sections = [
  { id: "about", label: "About", icon: User },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "work", label: "Experience", icon: Briefcase },
  { id: "publications", label: "Publications", icon: BookOpen },
  { id: "works", label: "Works", icon: FolderOpen },
  { id: "awards", label: "Awards", icon: Award },
  { id: "selected-programs", label: "Selected Programs", icon: Star },
  { id: "service", label: "Service", icon: Users },
  { id: "contact", label: "Contact", icon: MessageSquare },
];

const socialLinks = [
  { name: "Google Scholar", href: profile.googleScholar, icon: FaGoogleScholar },
  { name: "X", href: "https://x.com/_akira_murakami", icon: FaXTwitter },
  { name: "LinkedIn", href: "https://www.linkedin.com/in/akira-murakami-861ba0298/", icon: FaLinkedin },
  { name: "Facebook", href: "https://www.facebook.com/set02akira/", icon: FaFacebook },
  { name: "GitHub", href: "https://github.com/Set022525", icon: FaGithub },
];

function Section({ id, title, shaded, children, wide }: { id: string; title: string; shaded?: boolean; children: ReactNode; wide?: boolean }) {
  return (
    <section id={id} className={`scroll-mt-20 py-20 px-6 ${shaded ? "bg-gray-50" : ""}`}>
      <div className={`${wide ? "max-w-6xl" : "max-w-4xl"} mx-auto`}>
        <h2 className="text-3xl font-thin tracking-wider mb-16 text-center">{title}</h2>
        {children}
      </div>
    </section>
  );
}

function LanguageSwitcher({ locale }: { locale: Locale }) {
  return (
    <div role="group" aria-label={portfolioCopy[locale].language} className="flex shrink-0 items-center gap-2 text-xs font-light whitespace-nowrap">
      <Link href={portfolioPath("ja")} hrefLang="ja" lang="ja" aria-label="Japanese" aria-current={locale === "ja" ? "page" : undefined} className={locale === "ja" ? "text-black underline underline-offset-4" : "text-gray-500 hover:text-black"}>JA</Link>
      <span className="text-gray-300" aria-hidden="true">/</span>
      <Link href={portfolioPath("en")} hrefLang="en" lang="en" aria-label="English" aria-current={locale === "en" ? "page" : undefined} className={locale === "en" ? "text-black underline underline-offset-4" : "text-gray-500 hover:text-black"}>EN</Link>
    </div>
  );
}

function WorkCard({ work, locale }: { work: Work; locale: Locale }) {
  const copy = portfolioCopy[locale];
  const internal = work.link.startsWith("/");
  const linkedCover = internal || work.openInNewTab;
  const linkTarget = work.openInNewTab ? "_blank" : undefined;
  const linkRel = work.openInNewTab ? "noopener noreferrer" : undefined;
  const cover = (
    <div className="aspect-video bg-gray-200 group-hover:bg-gray-300 transition-colors relative">
      <Image src={portfolioAssetPath(work.image)} alt={work.title} fill sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" className={work.imageFit === "contain" ? "object-contain bg-white" : "object-cover"} />
    </div>
  );
  return (
    <div className="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
      {linkedCover ? <Link href={work.link} target={linkTarget} rel={linkRel} aria-label={`${copy.viewWork}: ${work.title}`}>{cover}</Link> : cover}
      <div className="p-6">
        <h3 className="text-lg font-light mb-2">{linkedCover ? <Link href={work.link} target={linkTarget} rel={linkRel}>{work.title}</Link> : work.title}</h3>
        <p className="text-gray-600 font-light text-sm mb-4">{work.description[locale]}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {work.tags.map((tag) => <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-light">{tag}</span>)}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 font-light">{work.year}</span>
          {internal ? (
            <Link href={work.link} target={linkTarget} rel={linkRel} className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-gray-900">{copy.photos}<ExternalLink size={14} aria-hidden="true" /></Link>
          ) : (
            <a href={work.link} target="_blank" rel="noopener noreferrer" aria-label={`${copy.viewWork}: ${work.title}`} className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-gray-900">{work.linkLabel?.[locale]}<ExternalLink size={16} className="text-gray-400 group-hover:text-gray-600 transition-colors" /></a>
          )}
        </div>
      </div>
    </div>
  );
}

function PublicationList({ pubs, language, locale }: { pubs: Publication[]; language: Locale; locale: Locale }) {
  const sorted = [...pubs].sort((a, b) => b.year - a.year);
  return (
    <div className="space-y-8 mb-12">
      {sorted.map((pub, index) => (
        <div key={`${pub.title}-${index}`} className="group hover:bg-gray-100 p-6 rounded-lg transition-all duration-300">
          <h4 className="text-lg font-light mb-2">
            <span lang={language}>[{sorted.length - index}] {pub.title}</span>
            {locale === "en" && language === "ja" && <span className="ml-2 text-sm text-gray-500">(in Japanese)</span>}
          </h4>
          <p lang={language} className="text-gray-600 font-light mb-4" dangerouslySetInnerHTML={{ __html: pub.authors }} />
          <div className="flex items-start justify-between gap-4">
            <span lang={language} className="text-sm text-gray-500 font-light">{pub.venue}</span>
            {pub.link && <a href={pub.link} target="_blank" rel="noopener noreferrer" aria-label={`${portfolioCopy[locale].publicationLink}: ${pub.title}`} className="shrink-0"><ExternalLink size={16} className="text-gray-400 group-hover:text-gray-600 transition-colors" /></a>}
          </div>
        </div>
      ))}
    </div>
  );
}

function EntryList({ entries, locale }: { entries: PortfolioEntry[]; locale: Locale }) {
  return (
    <ul className="space-y-8 text-gray-600 font-light leading-relaxed">
      {entries.map((entry) => (
        <li key={entry.id} data-entry-id={entry.id} className="border-l-2 border-gray-200 pl-6">
          {(entry.date || entry.period) && (
            <p className="text-sm text-gray-500 mb-2">
              {entry.period ? formatPortfolioPeriod(entry.period, locale) : formatPortfolioDate(entry.date!, locale)}
              {entry.endDate && ` – ${formatPortfolioDate(entry.endDate, locale)}`}
              {entry.location && ` · ${entry.location}`}
            </p>
          )}
          <h3 className="text-lg text-gray-800 font-light">{entry.title[locale]}</h3>
          {entry.funding && <p lang="en" className="mt-2 text-sm text-gray-500">{entry.funding}</p>}
          {entry.details && <ul className="mt-3 space-y-2 list-disc list-outside pl-5">{entry.details.map((detail, index) => <li key={index}>{detail[locale]}</li>)}</ul>}
          {entry.contributors && <p lang={entry.contributorLanguage} className="mt-3 text-sm text-gray-500">{entry.contributors.map((name, index) => <span key={name}>{index > 0 && ", "}{name === "Akira Murakami" || name === "村上 聡" ? <strong className="font-normal">{name}</strong> : name}</span>)}</p>}
          {entry.links && <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">{entry.links.map((link) => <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline">{link.label[locale]}<ExternalLink size={12} aria-hidden="true" /></a>)}</div>}
        </li>
      ))}
    </ul>
  );
}

export default function Portfolio({ locale }: { locale: Locale }) {
  const copy = portfolioCopy[locale];
  const [activeSection, setActiveSection] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 120;
      const current = sections.find(({ id }) => {
        const element = document.getElementById(id);
        return element && scrollPosition >= element.offsetTop && scrollPosition < element.offsetTop + element.offsetHeight;
      });
      setActiveSection(current?.id || "");
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-thin overflow-x-hidden">
      <nav aria-label={copy.menu} className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center gap-6">
          <Link href={portfolioPath(locale)} className="font-light text-xl tracking-wide shrink-0">UuU</Link>
          <div className="hidden xl:flex items-center gap-4">
            {sections.map(({ id, label }) => <button key={id} type="button" onClick={() => scrollToSection(id)} aria-current={activeSection === id ? "location" : undefined} className={`text-sm font-light tracking-wide whitespace-nowrap transition-colors hover:text-gray-900 ${activeSection === id ? "text-black border-b border-black" : "text-gray-500"}`}>{id === "work" ? copy.experience : label}</button>)}
            <Link href="/blog/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-light whitespace-nowrap text-gray-500 hover:text-gray-900">{copy.blog}<ExternalLink size={12} aria-hidden="true" /></Link>
          </div>
          <div className="flex items-center gap-5">
            <a href={portfolioAssetPath("cv/akira-murakami-cv.pdf")} target="_blank" rel="noopener noreferrer" aria-label={copy.cvLink} className="inline-flex items-center gap-1.5 text-sm font-light text-gray-600 transition-colors hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"><FileText size={15} aria-hidden="true" />{copy.cv}</a>
            <LanguageSwitcher locale={locale} />
            <button type="button" className="xl:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label={copy.menu} aria-expanded={isMenuOpen} aria-controls="mobile-navigation">{isMenuOpen ? <X size={24} /> : <Menu size={24} />}</button>
          </div>
        </div>
        {isMenuOpen && <div id="mobile-navigation" className="xl:hidden bg-white border-t border-gray-100 max-h-[calc(100dvh-80px)] overflow-y-auto">
          {sections.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => scrollToSection(id)} aria-current={activeSection === id ? "location" : undefined} className="w-full px-6 py-3 text-left flex items-center gap-3 hover:bg-gray-50"><Icon size={18} className="text-gray-400" aria-hidden="true" /><span className="font-light">{id === "work" ? copy.experience : label}</span></button>)}
          <Link href="/blog/" target="_blank" rel="noopener noreferrer" onClick={() => setIsMenuOpen(false)} className="px-6 py-3 flex items-center gap-3 hover:bg-gray-50"><NotebookPen size={18} className="text-gray-400" aria-hidden="true" /><span className="font-light">{copy.blog}</span><ExternalLink size={12} aria-hidden="true" /></Link>
        </div>}
      </nav>

      <main>
        <section className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-white to-gray-50" aria-label={locale === "ja" ? "インタラクティブな部屋のスケッチ" : "Interactive room sketch"}>
          <div className="max-w-4xl mx-auto text-center animate-fadeInUp space-y-12">
            <div className="flex justify-center touch-none"><P5Sketch width={800} height={600} className="rounded-lg border border-gray-200 shadow-sm max-w-full h-auto" sketch={portfolioSketch} /></div>
            <button type="button" onClick={() => scrollToSection("about")} className="inline-flex items-center gap-2 text-gray-600 hover:text-black transition-colors"><span className="font-light tracking-wide">{copy.discover}</span><ChevronDown size={20} className="animate-bounce" aria-hidden="true" /></button>
          </div>
        </section>

        <Section id="about" title="About">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h1 className="text-2xl font-light tracking-wide">{copy.name}</h1>
              <p lang="en" className="text-gray-600 font-light leading-relaxed text-lg">{copy.biography}</p>
              <a href={portfolioAssetPath("cv/akira-murakami-cv.pdf")} target="_blank" rel="noopener noreferrer" aria-label={copy.cvLink} className="inline-flex items-center gap-2.5 rounded-sm border-b border-gray-400 pb-2 text-sm font-light text-gray-800 transition-colors hover:border-black hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"><FileText size={17} aria-hidden="true" /><span>{copy.cv}</span><ExternalLink size={13} aria-hidden="true" /></a>
            </div>
            <div className="aspect-square rounded-lg overflow-hidden relative"><GlitchImage src={portfolioAssetPath("akira.jpeg")} alt={copy.portrait} className="object-cover" /></div>
          </div>
        </Section>

        <Section id="education" title="Education" shaded>
          <div className="space-y-12">
            {education.map((entry, index) => <div key={entry.id} className="border-l-2 border-gray-200 pl-8 pb-4">
              <div className="flex items-center gap-2 mb-2"><div className={`w-3 h-3 ${index === 0 ? "bg-black" : "bg-gray-400"} rounded-full -ml-10 border-4 border-white`} /><span className="text-sm text-gray-500 font-light">{formatPortfolioPeriod(entry.period, locale)}</span></div>
              <h3 className="text-xl font-light mb-2">{entry.degree[locale]}</h3>
              <p className="text-gray-600 font-light">{entry.institution[locale]}</p>
              <p className="text-gray-500 text-sm mt-2 font-light">{copy.advisor}: {advisors[locale]}</p>
            </div>)}
          </div>
        </Section>

        <Section id="work" title={copy.experience}>
          <div className="space-y-12">
            {experiences.map((entry) => <div key={entry.id} data-experience-id={entry.id} className="group hover:bg-gray-50 p-6 rounded-lg transition-colors">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-4"><div><h3 className="text-xl font-light mb-2">{entry.role[locale]}</h3><p className="text-gray-600 font-light">{entry.company}</p></div><span className="text-sm text-gray-500 font-light">{formatPortfolioPeriod(entry.period, locale)}</span></div>
              <p className="text-gray-600 font-light leading-relaxed">{entry.description[locale]}</p>
              <ul className="list-disc list-inside ml-6 mt-2 text-gray-600 font-light">{entry.skills.map((skill) => <li key={skill}>{skill}</li>)}</ul>
            </div>)}
          </div>
        </Section>

        <Section id="publications" title="Publications" shaded>
          {publicationGroups.map((group) => <div key={group.id}><h3 className="text-xl font-light mb-6">{copy.publicationHeadings[group.id]}</h3><PublicationList pubs={group.publications} language={group.language} locale={locale} /></div>)}
        </Section>

        <Section id="works" title="Works" wide><div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">{works.map((work) => <WorkCard key={work.id} work={work} locale={locale} />)}</div></Section>
        <Section id="awards" title="Awards" shaded><EntryList entries={awards} locale={locale} /></Section>
        <Section id="selected-programs" title="Selected Programs"><EntryList entries={selectedPrograms} locale={locale} /></Section>
        <Section id="service" title="Service" shaded><EntryList entries={service} locale={locale} /></Section>

        <Section id="contact" title="Contact">
          <div className="text-center">
            <div className="mb-12"><h3 className="text-xl font-light mb-6">{copy.email}</h3><p className="text-base sm:text-2xl font-light text-black break-words">{profile.email.replace("@", " [at] ")}</p></div>
            <h3 className="text-xl font-light mb-8">{copy.follow}</h3>
            <div className="mx-auto grid max-w-2xl grid-cols-5 gap-2 sm:gap-6">{socialLinks.map(({ name, href, icon: Icon }) => <a key={name} href={href} target="_blank" rel="noopener noreferrer" className="group flex min-w-0 flex-col items-center gap-3 rounded-lg py-3 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 transition-colors group-hover:border-gray-400 sm:h-14 sm:w-14"><Icon size={24} aria-hidden="true" className="h-5 w-5 text-gray-600 transition-colors group-hover:text-black sm:h-6 sm:w-6" /></div><span className="min-h-[2.5em] text-center text-[11px] font-light leading-tight text-gray-600 group-hover:text-black sm:text-sm">{name}</span></a>)}</div>
          </div>
        </Section>
      </main>

      <footer className="py-12 px-6 bg-white border-t border-gray-100"><div className="max-w-4xl mx-auto text-center"><p className="text-gray-500 font-thin tracking-wide">© 2026 Akira Murakami. All rights reserved.</p></div></footer>
      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInUp { animation: fadeInUp 1s ease-out; }
        html { scroll-behavior: smooth; }
        @media (prefers-reduced-motion: reduce) {
          html { scroll-behavior: auto; }
          .animate-fadeInUp { animation: none; }
        }
      `}</style>
    </div>
  );
}
