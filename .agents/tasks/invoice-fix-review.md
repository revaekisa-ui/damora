# Invoice Bug Fix: Timestamp, Package Description, Mobile Layout, Print Button

Four bugs in the manual invoice feature are addressed across three files: timestamp type errors on submit, shallow package descriptions, a broken mobile table layout in the preview, and a print function that printed the whole browser page instead of the invoice.

**Watch for:** The `@media (max-width: 640px)` table scroll rule depends on the `py-6` wrapper div having `overflow-x: auto` — confirmed present. The `physicalItems` mapping assumes each element has a `.name` property; if any package stores physical items as strings rather than objects, the description will render as `[object Object]` (possible — depends on data shape at rest).

**Verdict**: APPROVED

---

## High-level view

The timestamp fix appends `T00:00:00+07:00` to `YYYY-MM-DD` date strings before they reach the Postgres `timestamptz` column, resolving the `invalid input syntax for type timestamp with time zone: "2026"` error. The `createTransaction` call deliberately keeps its `date` field as plain `YYYY-MM-DD`, matching whatever that service expects.

Package selection now builds a composite description from the package name, its digital item list, and its physical item names. The physical items are mapped with `.name`, so the correct field name on `physicalItems` elements matters.

The preview modal's `<style>` block gains a `@media (max-width: 640px)` rule that sets `table { min-width: 480px }` (forcing horizontal scroll via the parent `overflow-x: auto` wrapper) and resets all grid sections to a single column. All three `grid` sections in the document use `grid-cols-1 sm:grid-cols-2`, which aligns with the media-query override.

`handlePrint` now opens a new blank window, writes a self-contained HTML document containing only the `#invoice-printable-doc` subtree with its own `<style>` block, focuses the window, and calls `printWindow.print()` after a 500 ms delay. The old `window.print()` path is retained only as a fallback when the element or the popup window can't be obtained.

---

<details>
<summary>Issues (1)</summary>

1. **physicalItems element shape** — `handlePackageSelect` calls `p.name` on each physical item. If any package stores `physicalItems` as an array of plain strings (not objects), the description will render `[object Object]` instead of the item name. Verify the `Package` type definition and any DB seed data to confirm all physical items are objects with a `name` field.

</details>

<details>
<summary>Details</summary>

### Timestamp conversion in handleSubmit

`projectDataPayload.date` is set to `formData.invoiceDate + 'T00:00:00+07:00'` inside a ternary that produces `null` when `formData.invoiceDate` is falsy. `projectDataPayload.deadlineDate` uses `(formData.eventDate || formData.invoiceDate)` as the base, so a missing event date falls back to the invoice date rather than producing a null deadline — this is intentional and matches the behavior the form displays to the user.

The `createTransaction` call that records the initial DP payment passes `formData.invoiceDate || getTodayIsoDate()`, which remains a plain `YYYY-MM-DD` string. This is correct if the transactions service accepts that format; the fix is careful not to apply the ISO-with-timezone conversion there.

`<input type="date">` values in `formData` are stored as `YYYY-MM-DD` throughout and are not mutated before the conversion step.

### Package description enrichment

`handlePackageSelect` in `InvoiceLineItemsEditor.tsx` builds `richDescription` as:

```
"Package Name (Digital: item1, item2) | Fisik: PhysItem1, PhysItem2"
```

Each segment is only appended when the respective array is non-empty, so packages with only digital or only physical items produce a clean description without orphaned delimiters. The `physicalPart` mapping uses `p.name` — confirmed to work if `physicalItems` is `Array<{ name: string; ... }>`. The `Package` type in the project should be checked to confirm this shape; if `physicalItems` is typed as `string[]` anywhere in the codebase, the mapping will silently break.

### Mobile table scroll and single-column grid

The `@media (max-width: 640px)` block sets:
- `#invoice-printable-doc .py-6 { overflow-x: auto; display: block; }` — the line-items table sits in a `div` with `py-6`, so this triggers the horizontal scroll container.
- `#invoice-printable-doc table { min-width: 480px; }` — forces the table wider than a mobile viewport so the scroll is actually needed.
- `#invoice-printable-doc .grid { grid-template-columns: 1fr; }` — collapses all grid sections (client/project details, financial breakdown, signature footer) to a single column.

The three grid divs in the document use `grid-cols-1 sm:grid-cols-2`, which Tailwind compiles to matching breakpoint classes. Both the CSS override and the Tailwind classes agree on the 640 px breakpoint.

A pre-existing `@media (max-width: 768px)` block was already present and contained a `.grid-cols-2` rule that forced two-column layout — the new 640 px rule takes priority for narrower viewports due to specificity and cascade order, correctly overriding the 768 px behavior at mobile sizes.

### Print window isolation

`handlePrint` reads the `innerHTML` of `#invoice-printable-doc` and writes it into a new window with a standalone `<style>` block covering `box-sizing`, typography, `table`, `th`/`td` borders, and `@page` margins. The `<style>` injected into the print window is separate from the one inside the component's JSX `<style>` tag, meaning Tailwind utility classes present in the invoice HTML will not be available in the print window. The inline `<style>` block in `handlePrint` uses explicit CSS rather than Tailwind classes, which is the right approach since the print window has no Tailwind stylesheet.

The 500 ms `setTimeout` before `printWindow.print()` gives the window time to render before the print dialog opens. This is a common pattern with a known fragility on slow machines or large documents — confirmed acceptable for this use case.

</details>

---

<details>
<summary>Files changed</summary>

| File | What changed |
|------|-------------|
| `src/features/finance/hooks/useInvoiceFormModal.ts` | `handleSubmit`: `date` and `deadlineDate` in project payload now append `T00:00:00+07:00`; `createTransaction.date` left as `YYYY-MM-DD` |
| `src/features/finance/components/InvoiceLineItemsEditor.tsx` | `handlePackageSelect`: description now includes digital items and physical item names from the package |
| `src/features/finance/components/InvoicePreviewModal.tsx` | `<style>` gains `@media (max-width: 640px)` scroll + single-column rules; grid divs use `grid-cols-1 sm:grid-cols-2`; `handlePrint` rewrites to open new window with invoice HTML only |

Full diff: `git diff main -- src/features/finance/hooks/useInvoiceFormModal.ts src/features/finance/components/InvoiceLineItemsEditor.tsx src/features/finance/components/InvoicePreviewModal.tsx`

</details>
