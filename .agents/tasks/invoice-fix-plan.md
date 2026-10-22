# Implementation Plan — Invoice Manual Fixes

Four independent bugs. Each item can be applied without depending on another unless noted.

---

## Confirmed variable names / key findings from reading the source files

| File | Symbol | Confirmed value |
|---|---|---|
| `InvoicePreviewModal.tsx` | Invoice number variable | `effectiveNumber` (line ~90: `const effectiveNumber = formData.invoiceNumber \|\| \`DRAFT-...\``) |
| `useInvoiceFormModal.ts` | Invoice date field | `formData.invoiceDate` — already a `YYYY-MM-DD` string |
| `useInvoiceFormModal.ts` | Event/deadline date field | `formData.eventDate` — already a `YYYY-MM-DD` string |
| `useInvoiceFormModal.ts` | DP transaction date | `formData.invoiceDate` passed to `createTransaction({ date: ... })` — plain `date` column, keep as-is |
| `InvoiceLineItemsEditor.tsx` | Package description set | `description: pkg.name` inside `handlePackageSelect` |
| `InvoicePreviewModal.tsx` | Client+Project grid | `<div className="grid grid-cols-2 gap-6 py-6 ...">` |
| `InvoicePreviewModal.tsx` | Financial+Bank grid | `<div className="grid grid-cols-2 gap-8 pt-4 ...">` |
| `InvoicePreviewModal.tsx` | Signatures footer grid | `<div className="grid grid-cols-2 gap-8 pt-8 mt-6 ...">` |
| `InvoicePreviewModal.tsx` | Existing `@media` rule | `@media (max-width: 768px)` block inside `<style>` — a separate `@media (max-width: 640px)` block must be **added** |
| `InvoicePreviewModal.tsx` | Print handler | `const handlePrint = () => { window.print(); };` — replace entirely |

---

- [ ] 1. **Fix timestamp error when saving a new or edited invoice**

  **File:** `src/features/finance/hooks/useInvoiceFormModal.ts`

  **What to do:** In the `handleSubmit` function, just before `projectDataPayload` is constructed (around the `const projectDataPayload: CreateProjectInput & UpdateProjectInput = {` block), add a helper that converts a `YYYY-MM-DD` string to a `timestamptz`-compatible ISO string, and apply it to the `date` and `deadlineDate` fields in the payload. Empty strings must become `null`.

  **Exact change:**

  1. After the `const generateId = () => ...` helper at the top of the file (or just before `handleSubmit`), the conversion logic should be inlined at the call site. Inside `handleSubmit`, replace:
     ```ts
     date: formData.invoiceDate,
     deadlineDate: formData.eventDate || formData.invoiceDate,
     ```
     with:
     ```ts
     date: formData.invoiceDate
       ? new Date(formData.invoiceDate + 'T00:00:00').toISOString()
       : null,
     deadlineDate: (formData.eventDate || formData.invoiceDate)
       ? new Date((formData.eventDate || formData.invoiceDate) + 'T00:00:00').toISOString()
       : null,
     ```

  2. The `createTransaction({ date: formData.invoiceDate || getTodayIsoDate(), ... })` call further down must **not** be changed — `createTransaction.date` maps to a plain `date` column, keep it as the raw `YYYY-MM-DD` string.

  3. Do **not** touch any `<input type="date">` in `InvoiceFormModal.tsx` — those values stay as `YYYY-MM-DD` in `formData`.

  **Files:** `src/features/finance/hooks/useInvoiceFormModal.ts`

  **Verify:** Open the app, create a new invoice with a date, click Finalisasi & Buat Invoice. The save should succeed without a Supabase error mentioning `invalid input syntax for type timestamp with time zone`. Also test editing an existing invoice — same result.

---

- [ ] 2. **Show package description (digital + physical items) when selecting a package**

  **File:** `src/features/finance/components/InvoiceLineItemsEditor.tsx`

  **What to do:** In `handlePackageSelect`, replace `description: pkg.name` with a richer string that lists the package's digital and physical items. The `Package` type already has `digitalItems: string[]` and `physicalItems: PhysicalItem[]` (where `PhysicalItem` has a `name` field).

  **Exact change** — replace:
  ```ts
  onAddItem({
    description: pkg.name,
    quantity: 1,
    unitPrice: pkg.price || 0,
    totalPrice: pkg.price || 0,
  });
  ```
  with:
  ```ts
  const digitalPart =
    pkg.digitalItems && pkg.digitalItems.length > 0
      ? ` (Digital: ${pkg.digitalItems.join(', ')})`
      : '';
  const physicalPart =
    pkg.physicalItems && pkg.physicalItems.length > 0
      ? ` | Fisik: ${pkg.physicalItems.map((p) => p.name).join(', ')}`
      : '';
  const richDescription = `${pkg.name}${digitalPart}${physicalPart}`;

  onAddItem({
    description: richDescription,
    quantity: 1,
    unitPrice: pkg.price || 0,
    totalPrice: pkg.price || 0,
  });
  ```

  **Files:** `src/features/finance/components/InvoiceLineItemsEditor.tsx`

  **Verify:** In the app, open the Invoice form, go to the Rincian Item section, pick a package from the "Tambah dari Paket" dropdown. The newly added line item's description field should contain the package name followed by its digital and/or physical item names. If the package has no items in either list, only the package name appears.

---

- [ ] 3. **Fix mobile view of the invoice preview table and section grids**

  **File:** `src/features/finance/components/InvoicePreviewModal.tsx`

  **Two sub-tasks — both in the same file:**

  ### 3a. Add `@media (max-width: 640px)` rules to the `<style>` block

  Inside the `<style>` block that already exists in the `#invoice-printable-doc` element, there is a `@media (max-width: 768px)` block. **After** that block (still inside the same `<style>` JSX string), append:

  ```css
  @media (max-width: 640px) {
    #invoice-printable-doc .py-6 { overflow-x: auto !important; display: block !important; }
    #invoice-printable-doc table { min-width: 480px !important; }
    #invoice-printable-doc .grid { grid-template-columns: 1fr !important; gap: 8px !important; }
  }
  ```

  ### 3b. Replace hardcoded `grid-cols-2` in the three section divs

  There are exactly three `grid grid-cols-2` divs in the printable document:

  1. **Client + Project details section** (`py-6 border-b border-slate-100`):
     - Current: `className="grid grid-cols-2 gap-6 py-6 border-b border-slate-100"`
     - Change to: `className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-100"`

  2. **Financial + Bank section** (`pt-4 border-t border-slate-200`):
     - Current: `className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-200"`
     - Change to: `className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4 border-t border-slate-200"`

  3. **Signatures footer** (`pt-8 mt-6 border-t border-slate-100`):
     - Current: `className="grid grid-cols-2 gap-8 pt-8 mt-6 border-t border-slate-100 text-xs"`
     - Change to: `className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8 mt-6 border-t border-slate-100 text-xs"`

  **Files:** `src/features/finance/components/InvoicePreviewModal.tsx`

  **Verify:** Open the Invoice Preview modal on a mobile viewport (Chrome DevTools ≤ 640 px). The Client/Project section, Financial/Bank section, and Signatures section should each stack to a single column. The line items table should be scrollable horizontally rather than overflowing off-screen.

---

- [ ] 4. **Fix the print button to print only the invoice document**

  **File:** `src/features/finance/components/InvoicePreviewModal.tsx`

  **What to do:** The current `handlePrint` calls `window.print()`, which prints the entire page/modal. Replace the entire function with one that clones the `#invoice-printable-doc` element into a new popup window and prints only that.

  The variable `effectiveNumber` is already in scope in this component (confirmed above).

  **Exact replacement** — find:
  ```ts
  const handlePrint = () => {
    window.print();
  };
  ```
  Replace with:
  ```ts
  const handlePrint = () => {
    const el = document.getElementById('invoice-printable-doc');
    if (!el) { window.print(); return; }
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) { window.print(); return; }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Invoice ${effectiveNumber}</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 0; font-family: Inter, Arial, sans-serif; background: #fff; color: #000; }
            @media print {
              body { margin: 0; }
              @page { margin: 12mm; size: A4; }
            }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #000; padding: 6px 10px; text-align: left; vertical-align: top; word-break: break-word; }
            th { background: #f8fafc; font-weight: 700; }
            .text-right { text-align: right !important; }
            .text-center { text-align: center !important; }
            img { max-width: 100%; height: auto; }
          </style>
        </head>
        <body>
          ${el.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };
  ```

  **Files:** `src/features/finance/components/InvoicePreviewModal.tsx`

  **Verify:** Open the Invoice Preview modal, click "Cetak / Print". A new popup window should open containing only the invoice document (no modal chrome, no navigation bar). The browser's print dialog should appear and the print preview should show the invoice on an A4-like layout. After printing or cancelling, the popup should close.

---

## Order of application

Items 1–4 are independent of each other. Apply in any order. All four touch different functions/locations; there is no shared edit conflict except items 3 and 4 which are both in `InvoicePreviewModal.tsx` — apply 3 first so the `<style>` block is updated before the print function is touched, to avoid confusion about which edit is which.

Recommended order: **1 → 2 → 3 → 4**.
