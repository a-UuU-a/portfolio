// The Latin typefaces match the supplied Keiichi Ihara CV.
#let body-font = ("Cochineal", "Noto Serif JP")
#let heading-font = "Cabin"
#let contact-font = "Inconsolatazi4"
#let ink = rgb("202020")
#let muted = rgb("626262")
#let rule = rgb("c7c7c7")
#let body-size = 10.9pt
#let date-width = 32mm
#let page-margins = (top: 23mm, bottom: 23mm, left: 24mm, right: 24mm)
#let page-body-height = 297mm - page-margins.top - page-margins.bottom
#let data = json(".cache/data.json")

#set document(
  title: data.profile.name + " — Curriculum Vitae",
  author: data.profile.name,
  description: "Academic curriculum vitae — " + data.profile.affiliation,
)
#set text(font: body-font, size: body-size, fill: ink, lang: "en", hyphenate: false)
#set par(leading: 4.5pt, spacing: 8pt)
#set page(
  paper: "a4",
  margin: page-margins,
  header: none,
  footer: context [
    #text(8pt, fill: muted)[
      Updated #data.updated
      #h(1fr)
      #counter(page).display("1 / 1", both: true)
    ]
  ],
)

#show heading.where(level: 1): it => block(above: 22pt, below: 11pt, sticky: true)[
  #stack(
    dir: ttb, spacing: 3pt,
    text(font: heading-font, size: 14.35pt, weight: "bold")[#it.body],
    line(length: 100%, stroke: 0.45pt + rule),
  )
]
#show heading.where(level: 2): it => block(above: 12pt, below: 10pt, sticky: true)[
  #text(font: heading-font, size: 11.9pt, weight: "bold")[#it.body]
]

#let timeline(date, body) = block(below: 13pt, breakable: false)[
  #grid(
    columns: (date-width, 1fr), column-gutter: 6mm,
    text(9.8pt, number-width: "tabular")[#date],
    body,
  )
]

#let linked-title(title, url) = strong(if url != "" { link(url, title) } else { title })

// A short section stays on one page; longer sections can still grow naturally.
#let grouped-section(title, body) = {
  v(22pt, weak: true)
  layout(size => {
    let content = [#heading(level: 1, title)#body]
    let height = measure(content, width: size.width).height
    block(breakable: height > page-body-height, content)
  })
}

#let paper(pub) = block(below: 10pt, breakable: false)[
  #grid(
    columns: (7mm, 1fr), column-gutter: 3mm,
    text(9pt, number-width: "tabular")[\[#pub.number\]],
    [
      #set par(leading: 4.2pt)
      #for part in pub.authors {
        if part.self { strong(part.text) } else { part.text }
      }#text(".")#h(0.25em, weak: true)#if pub.link != "" { link(pub.link, pub.title) } else { pub.title }#text(".")#h(0.25em, weak: true)#if pub.japanese { pub.venue } else { emph(pub.venue) }
      #if pub.upcoming [
        #v(4pt)
        #text(9pt, fill: muted)[#emph[Upcoming presentation]]
      ]
    ],
  )
]

#let entry(item) = timeline(item.date)[
  #linked-title(item.title, item.link)
  #if item.upcoming [ #text(9pt, fill: muted)[#emph[(upcoming)]]]
  #if item.funding != "" [#linebreak()#item.funding]
  #if item.location != "" [#linebreak()#text(10.2pt, fill: muted)[#item.location]]
  #for detail in item.details [#linebreak()#text(10.4pt)[#detail]]
]

#let contact-item(icon, destination, label, description) = link(destination)[
  #box(width: 11pt, baseline: 1pt)[#image(icon, height: 8.2pt, alt: description)]#h(4pt)#label
]

// Contact information is followed by one continuous introduction.
#text(font: heading-font, size: 22pt, weight: "bold")[#data.profile.name]
#v(8pt)
#text(font: contact-font, size: 9.8pt)[
  #contact-item("icons/mail.svg", "mailto:" + data.profile.email, data.profile.email, "Email")
]
#v(4pt)
#text(font: contact-font, size: 9.8pt)[
  #contact-item("icons/website.svg", data.profile.website, data.profile.website.replace("https://", ""), "Website")
  #h(6mm)
  #contact-item("icons/google-scholar.svg", data.profile.googleScholar, "Google Scholar", "Google Scholar")
]
#v(17pt)
#data.profile.cvIntroduction

= Education
#for item in data.education {
  timeline(item.date)[
    #strong(item.institution)
    #linebreak()
    #item.degree
    #if item.advisors != "" [
      #linebreak()
      #text(10.2pt)[Advisors: #item.advisors]
    ]
  ]
}

#let current-section = ""
#for group in data.publicationGroups {
  if group.section != current-section {
    heading(level: 1, group.section)
    current-section = group.section
  }
  if group.title != "" { heading(level: 2, group.title) }
  for pub in group.publications { paper(pub) }
}

= Awards & Honors
#for item in data.awards { entry(item) }

#grouped-section([Scholarships & Research Funding])[
  #for item in data.programs { entry(item) }
]

#grouped-section([Research & Development Experience])[
  #for item in data.experiences {
    timeline(item.date)[
      #strong(item.company)
      #linebreak()
      #item.role
      #linebreak()
      #text(10.6pt)[#item.description]
    ]
  }
]

#grouped-section([Service])[
  #for item in data.service { entry(item) }
]
