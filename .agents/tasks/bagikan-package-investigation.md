# Investigation Report: Bagikan Package Feature — Calon Pengantin Page

## Summary (Answer First)

The "Bagikan Package" (Share Package) feature on the **Calon Pengantin** page (`/#/Calon%20Pengantin` → `/#/prospek`) is **partially implemented but has a critical tracking mismatch**: the shared link currently passes the lead's **name slug** (e.g., `?leadName=siti-rahma`) rather than the lead's **actual UUID** (e.g., `?leadId=uuid-here`). The `PublicGallery.tsx` page reads only `leadId` from the URL, so it correctly forwards it to the booking button URL — but since a name slug, not a UUID, was passed, the downstream `PublicBookingForm.tsx` cannot reliably find the matching lead in Supabase and mark it as converted. The fix requires changing the `buildPublicShareUrl` call in `ShareMessageModal` (inside `LeadsPage.tsx`) to pass `leadId=<lead.id>` instead of `leadName=<slug>`.

---

## Question-by-Question Findings

### 1. File for the "Calon Pengantin" Page

**Route:** `/#/Calon%20Pengantin` is aliased as `/#/prospek` (see `routesConfig.ts`).

**View Enum:** `ViewType["Calon Pengantin"] = 'Calon Pengantin'`

**Routing chain:**
- `src/routes/routesConfig.ts` — `ROUTE_TO_VIEW_MAP["calon pengantin"]` and `"prospek"` both map to `ViewType["Calon Pengantin"]`
- `src/routes/AuthenticatedRoutes.tsx` — renders `DataPengantinHub` for this ViewType
- `src/pages/pengantin/DataPengantinHub.tsx` — a thin wrapper that lazy-loads `ClientsPage` but, looking at the app structure, the actual Leads/CalonPengantin component is:
- **`src/pages/leads/LeadsPage.tsx`** — exports `Leads` (default export), which is the full implementation of the Calon Pengantin view

The `DataPengantinHub` at `src/pages/pengantin/DataPengantinHub.tsx` lazy-loads `ClientsPage` but the "Calon Pengantin" navigation view is handled by `Leads` from `src/pages/leads/LeadsPage.tsx` (confirmed by the `ShareMessageModal`, kanban board with `LeadStatus` columns, and all lead-related state management living there).

---

### 2. File for the "Pricelist Upload" Page

**Route:** `/#/Pricelist%20Upload` (or `/#/gallery` in the router mapping)

**View Enum:** `ViewType.GALLERY = 'Pricelist Upload'`

**File:** `src/features/public/components/GalleryUpload.tsx`

Referenced in:
- `src/routes/AuthenticatedRoutes.tsx` line 61: `const GalleryUpload = lazy(() => import("../features/public/components/GalleryUpload"))`
- `src/routes/AuthenticatedRoutes.tsx` case `ViewType.GALLERY`: renders `<GalleryUpload userProfile={profile} showNotification={showNotification} />`

The public-facing view of a gallery (what a lead sees) is `src/features/public/components/PublicGallery.tsx`.

---

### 3. How "Bagikan Package" Is Currently Implemented

**Location:** `src/pages/leads/LeadsPage.tsx` — `ShareMessageModal` component (starting ~line 2013)

**Trigger:** In the `LeadCard` component, the "Package WA" button calls `onShare('package')`, which sets `shareModalState = { type: 'package', lead }`. The `ShareMessageModal` is then rendered.

**Current flow:**
1. `ShareMessageModal` loads all galleries from `listGalleries()` (Supabase `galleries` table).
2. It attempts to auto-match the lead's location to a gallery's `region` field.
3. It builds the shareable link via:
   ```ts
   buildPublicShareUrl('gallery', routeId, { query: { leadName: slug } })
   // Example result: https://domain.com/#/gallery/paket-jakarta?leadName=siti-rahma
   ```
4. The link is inserted into a WhatsApp message template.
5. Vendor clicks "Bagikan ke WhatsApp" → opens `wa.me/...?text=...`.

**Does it include a leadId?** ❌ **No — it passes `leadName` (a URL slug of the lead's name), NOT the actual `lead.id` (UUID).**

Evidence — `src/pages/leads/LeadsPage.tsx` line ~2054:
```ts
return buildPublicShareUrl('gallery', routeId, { query: { leadName: slug } });
```
where `slug = toPublicNameSlug(lead.name)` — this is a name-derived slug, not the database UUID.

---

### 4. How Pricelist Upload Stores Packages — Data Structure

**Supabase table:** `galleries` (confirmed by `src/services/galleries.ts`)

**TypeScript type:** `Gallery` in `src/types/index.ts`:
```ts
export interface Gallery {
  id: string;             // UUID (primary key)
  user_id: string;
  title: string;
  region: string;         // e.g., 'jabodetabek', 'banten' — used for region matching
  description?: string;
  is_public: boolean;
  public_id: string;      // URL slug (e.g., 'paket-jakarta-a1b2c')
  booking_link?: string;  // OPTIONAL custom booking link per gallery
  cover_image_url?: string;
  pdf_url?: string;       // Optional PDF pricelist
  pdf_name?: string;
  images: GalleryImage[]; // Array of uploaded images
  created_at: string;
  updated_at?: string;
}
```

**Shareable link** is not a fixed field; it is computed by `buildPublicShareUrl('gallery', routeId)` where `routeId = getGalleryPublicRouteId(gallery, galleries)` — this returns either the `public_id` slug or the `id` UUID, preferring the slug when there are no title collisions.

**The `booking_link` field** is the per-gallery override for where the booking button on the public gallery page redirects. If absent, it defaults to `#/public-booking?region=...`.

---

### 5. Booking Flow

**When a lead clicks the shared gallery link:**

1. Lead opens URL: `https://domain.com/#/gallery/paket-jakarta?leadName=siti-rahma`
2. `src/routes/PublicRoutes.tsx` line ~312 matches `/gallery/` → renders `<PublicGallery galleryId="paket-jakarta" />`
3. `PublicGallery.tsx` reads `urlLeadId` from query params — **but it reads `params.get('leadId')` only** (line 44), NOT `leadName`. So with the current `leadName` param, `urlLeadId` is `null`.
4. The "Booking Sekarang" button's `href` is built as:
   ```ts
   // If urlLeadId is null:
   bookingHref = "#/public-booking?region=jakarta"
   // If urlLeadId was properly set:
   bookingHref = "#/public-booking?region=jakarta&leadId=<uuid>"
   ```
5. Lead clicks "Booking Sekarang" → `PublicBookingForm.tsx` opens.
6. `PublicBookingForm.tsx` reads `urlParams.get('leadId') || urlParams.get('leadName')` (line 212) — it accepts both.
7. On form submission, if `leadId` is found, it calls `updateLeadRow(lead.id, { status: LeadStatus.CONVERTED })` and creates client + project records.

**The gap:** Because `LeadsPage.tsx` sends `leadName=siti-rahma` but `PublicGallery.tsx` only reads `leadId`, the `leadId` is lost at the gallery page. The booking form never receives the identifier, so the lead is **not auto-converted**.

---

### 6. Where Leads Are Stored

**Supabase table:** `leads` (confirmed by `src/services/leads.ts`, `const TABLE = 'leads'`)

**Lead ID field:** `id` in TypeScript → `id` column in Supabase (UUID, primary key)

**DB column mapping** (from `normalizeLead` in `src/services/leads.ts`):
| TypeScript field | DB column |
|---|---|
| `id` | `id` |
| `name` | `name` |
| `contactChannel` | `contact_channel` |
| `location` | `location` |
| `status` | `status` |
| `date` | `date` |
| `notes` | `notes` |
| `whatsapp` | `whatsapp` |
| `address` | `address` |
| `eventDate` | `event_date` |

No `lead_id` separate field — the identifier is simply `lead.id` (UUID).

---

### 7. What Changes Are Needed

#### Problem Root Cause
There is a **parameter name mismatch** in the URL chain:

| Step | Component | Parameter name | Value |
|---|---|---|---|
| Share link built | `LeadsPage.tsx` `ShareMessageModal` | `leadName` | `"siti-rahma"` (name slug) |
| Gallery page reads | `PublicGallery.tsx` | reads `leadId` only | → `null` (missed!) |
| Gallery passes to booking | `PublicGallery.tsx` | `leadId` | `null` (nothing to pass) |
| Booking form reads | `PublicBookingForm.tsx` | `leadId` OR `leadName` | `null` (never received) |
| Lead conversion | `PublicBookingForm.tsx` | looks up `lead.id === leadId` | fails silently |

#### Required Fixes

**Fix A — Pass `leadId` (the UUID) instead of `leadName` in the gallery share URL**

File: `src/pages/leads/LeadsPage.tsx`

In `ShareMessageModal`, the `selectedGalleryLink` memo (line ~2049-2055) and `handleGalleryChange` (line ~2083) currently pass `{ query: { leadName: slug } }`. Change to pass the actual lead UUID:

```ts
// CURRENT (broken):
return buildPublicShareUrl('gallery', routeId, { query: { leadName: slug } });

// FIXED:
return buildPublicShareUrl('gallery', routeId, { query: { leadId: lead.id } });
```

Similarly in `handleGalleryChange` (line ~2083):
```ts
// CURRENT:
const newLink = buildPublicShareUrl('gallery', routeId, { query: { leadName: toPublicNameSlug(lead.name) } });

// FIXED:
const newLink = buildPublicShareUrl('gallery', routeId, { query: { leadId: lead.id } });
```

**Fix B — (Optional but improves UX) Keep `leadName` as a display hint alongside `leadId`**

The `PublicBookingForm.tsx` already falls back to `leadName` for autofill (line 212: `urlParams.get('leadId') || urlParams.get('leadName')`). If desired, pass both:
```ts
return buildPublicShareUrl('gallery', routeId, { query: { leadId: lead.id, leadName: toPublicNameSlug(lead.name) } });
```
This ensures the booking form pre-fills the lead's name AND correctly resolves the lead by UUID for conversion.

**Fix C — Verify `PublicBookingForm.tsx` conversion path**

Already correct: `PublicBookingForm.tsx` lines 496-504 look up `leads.find(l => l.id === leadId || toPublicNameSlug(l.name) === leadId)` and call `updateLeadRow(lead.id, { status: LeadStatus.CONVERTED })`. No change needed here once the UUID is passed correctly.

**Fix D — No schema change needed**

The `leads` table already has `id` (UUID). No new Supabase migration or column is required.

---

## Summary of Evidence (File Citations)

| File | Key Finding |
|---|---|
| `src/pages/leads/LeadsPage.tsx` | `ShareMessageModal` builds gallery URL with `leadName` (slug) instead of `leadId` (UUID) — lines ~2049–2054, ~2083 |
| `src/features/public/components/PublicGallery.tsx` | Reads `params.get('leadId')` only — line 44; forwards it to booking button — lines 57–61 |
| `src/features/public/components/PublicBookingForm.tsx` | Reads `leadId` OR `leadName` from URL (line 212); on submit converts lead to `CONVERTED` status (lines 496–504) |
| `src/utils/publicRouting.ts` | `buildPublicShareUrl('gallery', id, { query: {...} })` — generates URL |
| `src/services/leads.ts` | `TABLE = 'leads'`; leadId field is `id` (UUID); `updateLead` patches by `id` |
| `src/services/galleries.ts` | `galleries` Supabase table; `Gallery.booking_link` is the per-gallery booking override |
| `src/routes/routesConfig.ts` | `"calon pengantin"` and `"prospek"` both resolve to `ViewType["Calon Pengantin"]` |
| `src/routes/AuthenticatedRoutes.tsx` | `ViewType.GALLERY` renders `GalleryUpload` (Pricelist Upload page) |
| `src/types/index.ts` | `Lead.id: string` (UUID); `Gallery.booking_link?: string`; `ViewType.GALLERY = 'Pricelist Upload'` |

---

## Conclusion & Recommendation

The feature is **structurally sound** — the gallery-to-booking flow already supports passing `leadId` through the URL chain, and the booking form already handles converting the matching lead on submission. The **single blocking bug** is that `LeadsPage.tsx` builds the share URL with `leadName=<slug>` while `PublicGallery.tsx` reads `leadId`. 

**Minimum viable fix: one line change in `src/pages/leads/LeadsPage.tsx`** — replace `{ query: { leadName: slug } }` with `{ query: { leadId: lead.id } }` (two occurrences: `selectedGalleryLink` memo and `handleGalleryChange`). Optionally add `leadName` alongside for autofill UX: `{ query: { leadId: lead.id, leadName: slug } }`.

No Supabase schema changes, no new tables, no new routes are required.
