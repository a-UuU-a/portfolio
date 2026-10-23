# Blog walker

The character is drawn in `components/BlogWalkerSprite.tsx` on a 16 × 16 SVG
pixel grid, displayed at 48 × 48 CSS pixels. A large, faceless, noseless head
covers roughly half the character height. Every pixel is solid black.

The 12-pose stride has separate support and swing phases. A planted foot stays
on its baseline and moves back one source pixel per pose; the other foot lifts,
bends at the knee and returns forward. The controller advances one pose per
three CSS pixels of actual movement, completing a stride every 36 pixels.
The walking speed is 24 CSS pixels per second, so a stride takes 1.5 seconds.
The head and torso keep their shape, with a one-pixel rise during passing.
Vertical movement uses a shared front/back silhouette with alternating lifted feet.
There are four animation views: side, vertical, diagonally down and diagonally up.
Diagonal heads have narrower three-pixel caps with a slight diagonal offset.
The tapered top and bottom corners keep the outline round; the middle rows
stay unchanged.
The diagonal views have sloped torsos. Their feet move along a 45-degree
ground plane, with separate near and far hip positions;
the far arm and lifted foot are foreshortened. These differences keep the
diagonal silhouette readable at the original size. Each diagonal view has its
own limb poses rather than reusing the side-view knee calculation;
left-facing directions mirror the corresponding right-facing drawings.
Heading selection has hysteresis to avoid flickering between views.

`lib/blog-walker-content.ts` measures text line boxes and media rectangles in
document coordinates. `lib/blog-walker.ts` creates a soft potential field, with
stronger density over photos and a gradual falloff around content. Overlapping
text boxes use the maximum density rather than accumulating penalties.
The field uses an 8-pixel grid and a narrow 4-pixel falloff. Padding accounts for
the character's visible size, so it can walk close to the content's edge.
Text regions are line-fragment rectangles measured at their rendered width,
not individual letter outlines or an entire paragraph's container width.

At intervals of 0.4–0.75 seconds, the character probabilistically chooses a new
heading from the local field, preferring forward movement and lower density.
The lookahead samples 8 and 18 pixels ahead. Heading and speed change
gradually. Every content direction has a nonzero probability; six percent of
walking bouts use a weaker content preference to encourage occasional visits.
Only the article page boundary constrains the character. Manual dragging ignores
content preferences.

The character is absolutely positioned in the article layout and stores document
coordinates. Scrolling leaves it at its place on the page; automatic walking
pauses while it is outside the visible area. The house stays fixed at the bottom
right of the viewport. Dragging converts pointer coordinates to document
coordinates, including scrolls while held; house drops and exits use the current
document position of the fixed house.

The field covers a document-space section around the character and is rebuilt
as it approaches the section edge. Scrolling alone does not move or rebuild it.
Resize, image load, font load and content mutations refresh the measurements.
The character and house are mounted only in the article route layout.

## Bicycle variation

Each article's slug is hashed to choose walking or cycling with an approximately
even split. The article layout passes this choice to `BlogWalker`, so the same
article keeps its character across reloads, client navigation and static builds.
New articles need no frontmatter setting.

`components/BlogCyclistSprite.tsx` draws the cyclist on a 24 × 24 pixel grid,
still displayed at 48 × 48 CSS pixels. It keeps the large, faceless black head
and adds two wheels, a diamond frame, handlebars and bent legs. Side, vertical
and both diagonal views project the bicycle and rider from the same geometry.
The 12 poses rotate the pedals and wheel spokes with the controller's distance
counter; resting, dragging and falling pause them. Both sprites share the pixel
line rasterizer in `lib/blog-sprite.ts`.

Both variations use the same page bounds, content avoidance, reduced-motion
preference, click-to-fall, dragging and house controls.
