# Google Slides Textbox Merger

A Google Apps Script add-on that merges fragmented text boxes in Google Slides into a single text box.

Some tools export slides to Google Slides with every line (or even every fragment) of text as a separate text box. This makes the deck painful to edit: a 12-line code block becomes 12 text boxes, and a two-line caption becomes two. This script lets you select those boxes and merge them back into one, keeping the original formatting (colors, fonts, syntax highlighting).

## Features

- **Merge selected text boxes** — joins the selected boxes top-to-bottom with line breaks. Boxes on the same row are joined with a single space. Use this for titles, captions, and body text.
- **Merge selected text boxes (code: keep indentation)** — same as above, but restores indentation as spaces based on each box's horizontal offset. Use this for code blocks, where exported indentation is usually expressed by the box position rather than by actual spaces.
- Formatting is copied per character, so syntax highlighting survives the merge.
- Large vertical gaps between rows are restored as blank lines.

## Installation

### Option 1: Single presentation (quickest)

1. Open the presentation in Google Slides.
2. Go to **Extensions > Apps Script**.
3. Replace the default code with the contents of [`src/Code.js`](src/Code.js) and save.
4. Reload the presentation. The menu appears under **Extensions > (project name)**.
5. The first run asks for authorization. Since this is your own script, choose **Advanced > Go to (project name) (unsafe)** and allow.

### Option 2: Use across all your presentations (test deployment)

1. Create a standalone project at [script.google.com](https://script.google.com) (or push this repo with clasp, see below).
2. In the editor, select **Deploy > Test deployments**.
3. Choose **Editor Add-on**, select a presentation, and install.

No Marketplace publication or review is required for personal use. To distribute within a Google Workspace domain, an admin can publish it as a private (domain-only) add-on.

### Development with clasp

```bash
npm install
npx clasp login
cp .clasp.json.example .clasp.json   # set your scriptId
npm run push
```

## Usage

1. Drag-select the text boxes you want to merge (Shift+click also works).
2. Run **Extensions > Slides Textbox Merger > Merge selected text boxes**, or the code variant for code blocks.
3. Adjust line spacing if needed (**Format > Line & paragraph spacing**). The merged box uses Slides' default line spacing.

Only selected shapes that contain text are merged. Background shapes (e.g. the dark rectangle behind a code block) are left untouched.

## Tuning

Constants at the top of `src/Code.js`:

| Constant | Default | Description |
| --- | --- | --- |
| `CHAR_WIDTH_RATIO` | `0.6` | Monospace character width relative to font size. Tweak if restored indentation is off by one. |
| `FALLBACK_FONT_SIZE` | `14` | Used when the font size cannot be read (mixed sizes). |
| `BLANK_LINE_THRESHOLD` | `1.5` | Row gap (relative to median row pitch) above which blank lines are inserted. |

## Limitations

- Indentation recovery is position-based and approximate. Boxes with large internal padding may shift indentation by one space.
- Rows are detected by vertical position. Heavily overlapping or rotated boxes may be ordered unexpectedly.

## Permissions

The script requests only:

- `presentations.currentonly` — read and edit the presentation it runs on
- `script.container.ui` — show the menu and alerts

## License

[MIT](LICENSE)
