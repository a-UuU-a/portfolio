import type { ContentRegion } from "./blog-walker";

// Store document coordinates so scrolling does not require measuring the DOM again.
export function readContentRegions(roots: Element[]): ContentRegion[] {
  const regions: ContentRegion[] = [];
  const add = (rect: DOMRect, strength: number) => {
    if (rect.width < 1 || rect.height < 1) return;
    regions.push({
      left: rect.left + window.scrollX, right: rect.right + window.scrollX,
      top: rect.top + window.scrollY, bottom: rect.bottom + window.scrollY, strength,
    });
  };
  for (const root of roots) {
    const texts = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: node => node.textContent?.trim()
        && !node.parentElement?.closest("script, style, svg, [aria-hidden='true']")
        ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
    });
    const range = document.createRange();
    let node: Node | null;
    while ((node = texts.nextNode())) {
      range.selectNodeContents(node);
      for (const rect of Array.from(range.getClientRects())) add(rect, 2.6);
    }
    for (const element of Array.from(root.querySelectorAll("img, video, iframe, canvas, svg, pre, table"))) {
      add(element.getBoundingClientRect(), 4);
    }
  }
  return regions;
}
