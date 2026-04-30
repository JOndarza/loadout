# Bugs

Bug registry. Individual files in `docs/bugs/` (created when investigation starts).

| ID | Title | Severity | Status |
| --- | --- | --- | --- |
| BUG-001 | CDK dynamic styles rejected by CSP when CSP_NONCE is missing | High | Fixed |
| BUG-002 | Optimistic toggle reverts visually on slow bridge responses | Low | Known |
| BUG-003 | Context menu does not close when panel loses focus | Low | Known |

---

## Fixed

### BUG-001 — CDK dynamic styles rejected by CSP when CSP_NONCE is missing

**Symptom**: CDK overlay, drag-drop, and virtual scroll modules injected `<style>` tags without a nonce, causing the strict nonce-based CSP to block them silently. Affected features appeared to load but had no styles or animations.

**Fix**: Wired the `CSP_NONCE` injection token in `webview/src/main.ts`. CDK now reads the nonce at bootstrap and stamps it on all injected style elements.

**Verification**: Open DevTools in the webview, confirm no CSP violations in the console when drag-drop or overlay features are active.

---

## Known issues

### BUG-002 — Optimistic toggle reverts visually on slow bridge responses

**Symptom**: When the extension host takes longer than ~500ms to respond (e.g. on a slow filesystem or a large workspace), the optimistic toggle flips the item state immediately, then the `dataUpdate` message arrives and briefly re-renders the full list. If the host state matches the optimistic state the flicker is invisible, but if there is a transient mismatch (e.g. a concurrent external file change) the item appears to snap back before settling.

**Impact**: Low — only visible under unusual latency or concurrent external edits.

**Workaround**: None required; the final state is always correct.

**Next step**: Add a short debounce (100ms) before applying `dataUpdate` to the list signal when a toggle is in-flight.

### BUG-003 — Context menu does not close when panel loses focus

**Symptom**: The `ContextMenuService` overlay closes on the next in-panel click or Escape, but does not close when the user clicks outside the VSCode panel (e.g. switches to the editor). The overlay lingers until the next interaction inside the panel.

**Impact**: Low — the overlay is non-blocking and does not prevent any action.

**Workaround**: Press Escape or click elsewhere inside the panel.

**Next step**: Subscribe to `document.visibilitychange` or a VSCode focus event in `ContextMenuService` and call `close()` on blur.
