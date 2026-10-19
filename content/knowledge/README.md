# TVD knowledge articles

Place Markdown files under `content/knowledge/articles/`. The Vite content module reads these files during development and production builds. Article text is compiled to safe HTML, and only valid articles with `status: published` and a publication date no later than today enter the browser bundle.

## Add an article

1. Copy `ARTICLE_TEMPLATE.md` to `articles/<category>/<slug>.md`.
2. Fill in every required frontmatter field. Use one category from `heat-pumps`, `gas-boilers`, `alternative-heating`, or `wastewater-treatment`.
3. Put the cover image in `public/knowledge/` and use its site path, such as `/knowledge/cover.webp`.
4. Start with an H2 heading in the Markdown body. The page title is the article's only H1.
5. Keep the article as a draft until its content and metadata are ready. Change `status` to `published` to publish it. A future `publishedAt` date schedules it without exposing it early.

Builds fail when required metadata is missing, a category/status/date/cover is invalid, Markdown cannot be parsed, an H1 appears in the body, or a slug is duplicated. Slugs must be unique across drafts and published articles.

Supported Markdown includes headings H2–H6, paragraphs, links, local `/knowledge/` images, ordered and unordered lists, blockquotes, fenced code, horizontal rules, and GitHub-style tables. Raw HTML is displayed as text. Images embedded in Markdown must be stored under `public/knowledge/`.

Optional relationship fields are string arrays: `relatedCategories`, `relatedBrands`, and `relatedProductIds`. Product IDs should refer to real catalog product IDs. They are rendered as links only when the corresponding catalog item is present.
