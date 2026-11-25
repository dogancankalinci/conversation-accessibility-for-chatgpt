/* Only change the actual rendered window. Retain the original virtualizer,
 * scrolling API, measurements, restoration, focus anchors and callbacks.
 * No remote code or saved copy of the site's source. Unknown shapes pass through.
 */
(function(root) {
  'use strict';
  const id = '[A-Za-z_$][\\w$]*';
  const windowPattern = new RegExp(
    `\\b(${id})\\s*=\\s*(${id})\\.slice\\(\\s*(${id})\\.startIndex\\s*,\\s*\\3\\.endIndex\\s*\\)\\.map\\(\\(\\s*(${id})\\s*,\\s*(${id})\\s*\\)\\s*=>\\s*\\(\\{\\s*entry\\s*:\\s*\\4\\s*,\\s*turnIndex\\s*:\\s*\\3\\.startIndex\\s*\\+\\s*\\5\\s*\\}\\)\\)`, 'g');
  const markers = ['data-virtualized-turn', 'gapsBeforePx', 'topOffsetsPx', 'retainedTopPx', 'onApiChange', 'onViewportRowsChange', 'getRowGeometry', 'renderedRange'];
  function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function patchSource(source) {
    if (typeof source !== 'string' || !markers.every(m => source.includes(m))) return { changed: false, reason: 'unrelated' };
    const matches = [...source.matchAll(windowPattern)];
    if (matches.length !== 1) return { changed: false, reason: 'unknown-shape' };
    const m = matches[0], [original, dest, rows, range] = m;
    const r = escapeRegExp(range), d = escapeRegExp(dest);
    const before = source.slice(Math.max(0, m.index - 5000), m.index);
    const after = source.slice(m.index + original.length, m.index + original.length + 50000);
    // Confirm mutable local window derived from virtualizer state and reassigned
    // by its original scroll-restoration branch. Also confirm same local window
    // controls the spacer and retained rows. Never guess for a different layout.
    const declaration = new RegExp(`\\blet\\s+[^;]{0,600}\\b${r}\\s*=\\s*${id}\\.renderedRange\\b`);
    const reassignment = new RegExp(`\\b${r}\\s*=\\s*${id}\\(`);
    const spacer = new RegExp(`\\.topOffsetsPx\\[\\s*${r}\\.startIndex\\s*\\]`);
    const render = new RegExp(`\\b${d}\\.map\\(`);
    const retain = new RegExp(`retainedTopPx\\s*:\\s*${id}\\s*<\\s*${r}\\.startIndex\\s*\\|\\|\\s*${id}\\s*>=\\s*${r}\\.endIndex`);
    if (!declaration.test(before) || !reassignment.test(before) || !spacer.test(after) || !render.test(after) || !retain.test(after)) return { changed: false, reason: 'unknown-shape' };
    const rhs = original.slice(original.indexOf('=') + 1);
    // Assign a fresh range, not the stored React state object. The unchanged
    // downstream calculations now see [0, rows.length), including the spacer.
    const replacement = `${dest}=(${range}={startIndex:0,endIndex:${rows}.length},${rhs})`;
    return { changed: true, source: source.slice(0, m.index) + replacement + source.slice(m.index + original.length), reason: 'full-render-window' };
  }
  root.NvdaPatch = { patchSource };
  if (typeof module !== 'undefined' && module.exports) module.exports = { patchSource };
})(globalThis);
