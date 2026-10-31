/**
 * Google Slides Textbox Merger
 *
 * Apps Script that merges text boxes in Google Slides that were split
 * per line or per fragment (e.g. after exporting from another tool)
 * into a single text box.
 *
 * - Text mode: joins the selected boxes top-to-bottom with line breaks.
 * - Code mode: additionally restores indentation (spaces) from each
 *   box's horizontal offset, so code blocks keep their structure.
 *
 * Works both as a container-bound script (Extensions > Apps Script)
 * and as an Editor Add-on (test deployment).
 */

/** Approximate monospace character width = font size * this ratio */
const CHAR_WIDTH_RATIO = 0.6;

/** Fallback font size (pt) when it cannot be read from the text */
const FALLBACK_FONT_SIZE = 14;

/** A row gap larger than (median pitch * this) is treated as blank line(s) */
const BLANK_LINE_THRESHOLD = 1.5;

function onOpen(e) {
  SlidesApp.getUi()
    .createAddonMenu()
    .addItem('Merge selected text boxes', 'mergeText')
    .addItem('Merge selected text boxes (code: keep indentation)', 'mergeCode')
    .addToUi();
}

function onInstall(e) {
  onOpen(e);
}

function mergeText() {
  merge_(false);
}

function mergeCode() {
  merge_(true);
}

function merge_(isCode) {
  const ui = SlidesApp.getUi();
  const range = SlidesApp.getActivePresentation()
    .getSelection()
    .getPageElementRange();
  if (!range) {
    ui.alert('Select two or more text boxes to merge.');
    return;
  }

  const shapes = range
    .getPageElements()
    .filter((e) => e.getPageElementType() === SlidesApp.PageElementType.SHAPE)
    .map((e) => e.asShape())
    .filter((s) => s.getText().asString().trim() !== '');
  if (shapes.length < 2) {
    ui.alert('Select at least two text boxes that contain text.');
    return;
  }

  const rows = groupIntoRows_(shapes);

  const minLeft = Math.min(...shapes.map((s) => s.getLeft()));
  const minTop = Math.min(...shapes.map((s) => s.getTop()));
  const maxRight = Math.max(...shapes.map((s) => s.getLeft() + s.getWidth()));
  const maxBottom = Math.max(...shapes.map((s) => s.getTop() + s.getHeight()));

  const page = shapes[0].getParentPage();
  const box = page.insertTextBox(
    ' ',
    minLeft,
    minTop,
    maxRight - minLeft,
    maxBottom - minTop
  );
  const dst = box.getText();
  dst.clear();

  const fontSize =
    shapes[0].getText().getTextStyle().getFontSize() || FALLBACK_FONT_SIZE;
  const charWidth = fontSize * CHAR_WIDTH_RATIO;
  const pitch = medianRowPitch_(rows);

  rows.forEach((row, i) => {
    if (i > 0) {
      dst.appendText('\n');
      // Restore blank lines when the vertical gap is unusually large
      if (pitch > 0) {
        const gap = row[0].getTop() - rows[i - 1][0].getTop();
        if (gap > pitch * BLANK_LINE_THRESHOLD) {
          const blanks = Math.round(gap / pitch) - 1;
          if (blanks > 0) dst.appendText('\n'.repeat(blanks));
        }
      }
    }

    let prevRight = minLeft;
    row.forEach((s, j) => {
      if (isCode) {
        const spaces = Math.max(
          0,
          Math.round((s.getLeft() - prevRight) / charWidth)
        );
        if (spaces > 0) dst.appendText(' '.repeat(spaces));
      } else if (j > 0) {
        dst.appendText(' ');
      }

      const src = s.getText();
      const str = src.asString();
      const end = str.endsWith('\n') ? str.length - 1 : str.length;
      // Copy with source formatting (color, font, etc.) preserved
      dst.appendRange(src.getRange(0, end));
      prevRight = s.getLeft() + s.getWidth();
    });
  });

  shapes.forEach((s) => s.remove());
  box.select();
}

/**
 * Groups boxes whose tops are close into the same row.
 * Rows are ordered top-to-bottom, boxes within a row left-to-right.
 */
function groupIntoRows_(shapes) {
  const sorted = shapes
    .slice()
    .sort((a, b) => a.getTop() - b.getTop() || a.getLeft() - b.getLeft());
  const rows = [];
  for (const s of sorted) {
    const last = rows[rows.length - 1];
    if (
      last &&
      Math.abs(s.getTop() - last[0].getTop()) < last[0].getHeight() / 2
    ) {
      last.push(s);
    } else {
      rows.push([s]);
    }
  }
  rows.forEach((r) => r.sort((a, b) => a.getLeft() - b.getLeft()));
  return rows;
}

/**
 * Median distance between consecutive row tops. Returns 0 for a single row.
 */
function medianRowPitch_(rows) {
  if (rows.length < 2) return 0;
  const diffs = [];
  for (let i = 1; i < rows.length; i++) {
    diffs.push(rows[i][0].getTop() - rows[i - 1][0].getTop());
  }
  diffs.sort((a, b) => a - b);
  return diffs[Math.floor(diffs.length / 2)];
}
