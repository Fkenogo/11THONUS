# 11THONUS-MEDIA-001 — MV-206 Media Storage & Delivery Alignment Assessment

> **Version:** 1.0  
> **Date:** 2026-10-08  
> **Status:** **CLOSED — assessment complete; implementation not authorised**  
> **Type:** Architecture / capability assessment only  
> **Portfolio reference:** MV-206 v0.1 — Media Storage & Delivery Guidance (APPROVED — ACTIVE, MV-FD-001, 2026-10-08)  
> **11thONUS authority preserved:** 11thONUS Infrastructure Disposition v1.0; MTAIP-001; existing Product Truth and engineering governance  
> **Entry `origin/main`:** `4bc9c49261c1db8bfdacb3d91b68d51ad59e47f9`  
> **Boundary:** No infrastructure provisioned. No provider selected or changed. No storage bucket created. No application code, schema, Security Rules, dependencies, environment configuration, deployment configuration or runtime behaviour changed.

## 1. Executive disposition

11thONUS is aligned with MV-206 without changing its Firebase-native classification.

The first governed image requirement already present in 11thONUS Product Truth is the **Business Logo**. The current product definition includes Business Logo in business registration, and the current domain schema carries `Business.logoUrl?`. The live repository has Firebase Storage initialisation and an emulator connection, but Storage remains deliberately deny-by-default and there is no upload/download path.

No current Product Truth reviewed by this assessment defines owner, manager, staff or customer profile photographs as an MVP capability. Those image types therefore remain **not authorised product scope** and must not be introduced by a media-infrastructure package merely because MV-206 mentions profile imagery as a general portfolio use case.

### Recommendation

**Do not select R2 or Cloudflare Images for 11thONUS yet.**

For the bounded MVP Business Logo requirement, **Firebase Storage is the recommended implementation candidate for the first 11thONUS media work package**, because:

1. 11thONUS is already classified Firebase-native.
2. the Firebase Storage SDK and emulator boundary are already present;
3. Storage Rules already fail closed;
4. there is no current media workload large enough to justify an additional storage provider, credential surface and upload adapter solely for one business logo;
5. the cost difference at pilot volume is immaterial in absolute dollars.

**Cloudflare R2 remains the preferred alternative to reassess** if 11thONUS later demonstrates broader media volume, materially higher public-read traffic, provider-portability requirements, or additional governed image types. If selected later, use the S3-compatible API behind a 11thONUS-owned adapter rather than Worker-specific R2 bindings.

Cloudflare Images is **not required for the first logo slice**. The first implementation can create a small bounded set of normalised variants during upload. Images becomes attractive only if measured transformation/delivery requirements justify the extra service.

## 2. Evidence reviewed

### Portfolio authority

MV-206 v0.1 states that:

- product repositories remain authoritative for feature scope, permissions, architecture and provider selection;
- Cloudflare R2 is a preferred candidate for bounded evaluation, not a vendor mandate;
- existing Firebase Cloud Storage is an explicit alternative for Firebase-native applications;
- applications should own stable asset identity and not persist expiring signed/transformation URLs as identity;
- personal imagery is private by default;
- no shared media service is required now;
- no implementation follows automatically from MV-206 approval.

This assessment follows those boundaries exactly.

### 11thONUS repository evidence

Reviewed at entry main `4bc9c49261c1db8bfdacb3d91b68d51ad59e47f9`:

- `docs/00-governance/11thonus-infrastructure-disposition-v1.md`
- `docs/05-implementation/reports/11thonus-cf-001-cloudflare-capability-and-architecture-alignment-assessment-2026-09-19.md`
- `docs/02-technical/trd/08-firebase-platform-architecture.md`
- `docs/02-technical/trd/10-firestore-data-architecture.md`
- `storage.rules`
- `apps/web/src/infrastructure/firebase/storage.ts`
- `functions/src/domains/business/models/business.ts`
- `functions/src/domains/business/models/businessDocument.ts`
- `functions/src/domains/business/services/businessReadService.ts`
- `apps/web/src/business/api/businessProfile.ts`
- `apps/web/src/business/dashboard/BusinessProfilePage.tsx`
- repository-wide searches for `logoUrl`, upload/download APIs, image/avatar/profile-photo fields, and Cloudflare/R2 references.

### Current external provider facts checked 2026-10-08

Official vendor documentation was checked for current pricing and capability assumptions:

- Cloudflare R2 pricing: Standard storage USD 0.015/GB-month, Class A USD 4.50/million, Class B USD 0.36/million, Internet egress free; included monthly usage includes 10 GB storage, 1 million Class A and 10 million Class B operations.
- Cloudflare Images: Free plan includes up to 5,000 unique transformations/month for images stored outside Images (for example R2); hosted Images storage/delivery is a paid-plan capability.
- R2 supports S3-compatible APIs and server-generated presigned URLs for bounded PUT/GET access.
- R2 location hints are best-effort; jurisdictional restrictions are the control when a guaranteed jurisdiction is required.
- Cloud Storage for Firebase now requires the Blaze pay-as-you-go plan. Firebase documentation states only selected US locations receive Cloud Storage Always Free location treatment; other locations follow Google Cloud Storage pricing.
- Google Cloud Storage general Internet transfer is currently priced from USD 0.12/GiB in the first tier for worldwide destinations excluding the separately listed categories.

Rates and product terms can change; any implementation package must re-check them immediately before provider selection/provisioning.

## 3. Current-state findings

### 3.1 Product Truth image requirements

| Image capability | Current authority | MVP classification | Finding |
|---|---|---:|---|
| Business logo | Explicit Product Truth + Business schema | **Required / governed** | This is the first real file-storage requirement. |
| Customer profile photo | No reviewed MVP field/requirement found | **Not authorised** | Do not invent in MEDIA-001. |
| Business owner profile photo | No reviewed MVP field/requirement found | **Not authorised** | Do not invent in MEDIA-001. |
| Manager profile photo | No reviewed MVP field/requirement found | **Not authorised** | Do not invent in MEDIA-001. |
| Staff profile photo | Staff record defines identity/accountability fields but no image field | **Not authorised** | Do not invent in MEDIA-001. |
| Loyalty programme/product imagery | Reward Program/Product Truth reviewed by this task does not establish image assets | **Not authorised** | Reassess only if Product Truth later adds imagery. |
| Receipts/exports/PDF/media | Previously named only as possible storage examples | **Deferred / not a current requirement** | Not part of the first media package. |

### 3.2 Existing storage implementation state

The 11thONUS Infrastructure Disposition remains accurate:

- Firebase Storage client initialisation exists.
- Storage emulator wiring exists.
- `storage.rules` denies all reads and writes.
- no `uploadBytes`, `uploadBytesResumable`, `getDownloadURL` or equivalent product path exists;
- no R2/S3 SDK or Cloudflare media dependency exists;
- no stored-image lifecycle exists.

This is a safe starting point, not a partially implemented feature.

### 3.3 Existing business-logo data contract

The Business aggregate currently contains:

`logoUrl?: string`

and the business update command can accept `logoUrl`. However:

- the field is currently a generic string;
- the backend does not validate it as a 11thONUS-owned asset;
- the BusinessContext read DTO deliberately does not project it;
- the Business Profile UI deliberately does not expose a logo control because the read contract cannot round-trip the value;
- therefore the existing `logoUrl` is **not a complete media architecture**.

The correct implementation should not make an arbitrary client-supplied external URL the durable authority for a business logo.

## 4. Provider comparison

| Consideration | Firebase Storage | Cloudflare R2 |
|---|---|---|
| Fit with current 11thONUS architecture | **Very high** — already Firebase-native | Good, but introduces second storage provider |
| Existing app wiring | **Already scaffolded** | None |
| Emulator/local development | **Already wired** | Requires new adapter/test strategy |
| Authentication integration | Firebase identity/rules are native options; backend-mediated upload also straightforward | Requires backend signing/credential management or temporary credentials |
| Access control | Security Rules and/or callable-authorised backend | Application-authorised presigned URLs / private bucket policy |
| Public-logo delivery | Straightforward | Strong fit; zero R2 Internet egress charge |
| Portability | Firebase-specific | **Higher** if accessed through S3-compatible adapter |
| Additional credentials/secrets | Minimal incremental surface | New R2 credentials, CORS, bucket policy and secret lifecycle |
| Cost at pilot scale | Very low; egress may dominate | Very low; likely within R2 included usage |
| Cost at high public-read scale | Internet transfer can become material | **Potentially advantageous** due to zero R2 Internet egress |
| Operational complexity now | **Lowest** | Higher |
| Portfolio alignment | Allowed by MV-206 | Preferred portfolio candidate |
| Recommendation for first 11thONUS logo slice | **Preferred** | Reassessment trigger, not current selection |

### Decision

**Firebase Storage is the recommended first implementation candidate for 11thONUS Business Logo.**

This is not a reversal of MV-206. MV-206 explicitly permits existing Firebase Storage where architecture makes it proportionate, and forbids migration merely for visual portfolio consistency.

## 5. Recommended 11thONUS media model

The implementation package should replace URL-as-identity with an application-owned asset reference.

Recommended bounded model:

```ts
type MediaAsset = {
  id: string;                 // opaque application-owned asset id
  ownerType: "business";
  ownerId: string;            // businessId
  purpose: "business_logo";
  storageProvider: "firebase_storage"; // implementation metadata, not UI contract
  storageKey: string;         // opaque provider object key
  visibility: "public";
  status: "pending" | "active" | "replaced" | "deleted";
  contentType: "image/jpeg" | "image/png" | "image/webp";
  width: number;
  height: number;
  byteSize: number;
  createdAt: Timestamp;
  createdBy: string;
  activatedAt?: Timestamp;
  replacedByAssetId?: string;
  deletedAt?: Timestamp;
  schemaVersion: number;
};
```

Recommended Business association:

```ts
logoAssetId?: string;
```

### Treatment of existing `logoUrl`

Do **not** silently repurpose `logoUrl` as a provider object key or signed URL.

The implementation design should choose one explicit migration-safe path:

1. replace `logoUrl` with `logoAssetId` before any live logo data exists; or
2. temporarily support both during a controlled schema transition, with `logoAssetId` authoritative and `logoUrl` treated as legacy only.

Repository evidence indicates no live media path exists, so a clean pre-use contract correction is likely preferable, but this must be authorised in the implementation package rather than assumed by this assessment.

## 6. Upload and processing controls

The first implementation package should remain narrow to Business Logo and implement:

### Upload authority

- authenticated caller only;
- caller must have the same server-side authority already required to update the relevant Business profile;
- never trust `businessId` alone;
- server derives/re-validates membership/authority before granting upload or activation;
- no new role or permission is invented by the media package.

### Upload mechanism

Preferred Firebase-native shape:

1. client requests a short-lived upload session/grant from a callable backend;
2. backend checks caller/business authority and issues a bounded asset/upload identity;
3. upload targets an unguessable server-generated object key;
4. object remains `pending`;
5. backend verifies object existence, byte size, MIME/decode result and ownership before activation;
6. only after verification is `logoAssetId` associated with the Business.

A backend-proxied upload is acceptable for the first slice if the implementation team determines it is simpler at the small logo file sizes involved. The implementation design should compare the two without changing the architecture unnecessarily.

### Validation

Server-side, not browser-only:

- allow only a narrow raster set (recommended JPEG, PNG and WebP);
- reject SVG for the first slice unless separately security-reviewed;
- enforce a low logo file-size ceiling;
- enforce maximum pixel dimensions/pixel count;
- decode the image rather than trusting Content-Type or file extension;
- normalise/re-encode output;
- strip EXIF/GPS/unused metadata;
- generate bounded variants;
- reject malformed/polyglot/spoofed content;
- rate-limit repeated upload attempts at the application boundary.

### Crop / resize

Do not make destructive client crop the authority.

Recommended first-slice outputs:

- original normalised master retained privately or access-restricted for replacement/reprocessing;
- square logo variant for compact/mobile card use;
- medium logo variant for business/profile surfaces.

Exact pixel sizes should be set by the experience assembly that consumes the logo, not invented in this infrastructure assessment.

### Delivery

Business logos are publication imagery, but should become publicly readable only after the associated asset is active and the Business state permits customer-facing publication.

Use:

- immutable versioned asset paths;
- long-lived caching for immutable active variants;
- replacement by new asset ID/key rather than overwriting the same object;
- database lookup/reference for the active asset;
- no expiring signed URL persisted as the Business record.

## 7. Replacement and deletion

Replacement must be atomic at the product-association level:

1. upload + validate new asset;
2. mark new asset active;
3. switch `Business.logoAssetId`;
4. mark prior asset replaced;
5. remove prior public availability/cached path where feasible;
6. delete old binary later according to a bounded cleanup/retention rule.

Never delete the active logo before the replacement is validated.

Deletion without replacement should remove the Business association first and return the UI to the default/fallback logo state.

The implementation package must define orphan cleanup for abandoned `pending` uploads.

## 8. Security and privacy disposition

### Business logo

Classification: **public publication asset after approval/activation**.

Controls:

- only authorised Business actors can create/replace/delete;
- object keys are not authorisation;
- public delivery is read-only;
- original/unvalidated uploads are never public;
- cross-business write/read-management attempts must fail;
- active public variants contain no EXIF/GPS metadata;
- audit the association lifecycle, not raw image content.

### Personal profile imagery

Not in current implementation scope.

If Product Truth later authorises customer/staff/owner/manager profile imagery, it must default to **private** under MV-206 and receive an explicit visibility/role matrix. Public logo rules must not be copied to personal photographs.

## 9. Cost and operational impact

These figures are directional planning estimates, not a vendor commitment.

### Pilot assumption

Illustrative 100 businesses:

- one active logo each;
- normalised master + 2 variants;
- approximately 0.15 MB retained per business across variants on average;
- about 15 MB active media total, plus replacement/orphan allowance;
- 100,000 logo reads/month;
- approximately 5 GB delivered/month depending on variant size/cache hit behaviour.

### R2 direction

At the currently published R2 Standard rates, this workload is far below the included monthly 10 GB storage / 1M Class A / 10M Class B usage, and Internet egress is free. A bounded pilot would therefore normally be near USD 0 for R2 storage/operations, excluding any other paid Cloudflare service.

Cloudflare Images Free currently includes up to 5,000 unique transformations/month for external images. That is sufficient for a small fixed-variant logo pilot, but relying on a free tier is not an architecture guarantee.

### Firebase Storage direction

Cloud Storage for Firebase requires Blaze. For a `europe-west1` bucket, the US Always Free location treatment does not apply; Cloud Storage location/operation/network pricing governs.

At this media volume, retained-storage cost is negligible. Direct Internet delivery can be the larger component: at the currently published first-tier general Cloud Storage Internet transfer rate of about USD 0.12/GiB, 5 GiB/month is roughly USD 0.60 before operation charges and any caching effects.

### Interpretation

The absolute pilot difference is too small to justify adding a second storage provider solely on price.

At growth scale, public-logo/media delivery bandwidth is the point at which R2 becomes materially more attractive. Example: 500 GiB/month of direct public media transfer is roughly USD 60 at USD 0.12/GiB before caching under the referenced Cloud Storage general Internet-transfer rate, while R2 advertises zero Internet egress. That is a valid reassessment trigger, not a reason to complicate the first 100-business pilot.

### Operations required whichever provider is selected

- product/environment-specific storage isolation;
- budget alerts;
- asset-count and byte monitoring;
- failed-upload/orphan cleanup;
- replacement/delete observability;
- restore/deletion policy alignment with the future backup/recovery decision;
- no image bytes, signed URLs, access tokens or credentials in application logs.

## 10. Bounded implementation sequence

Recommended next package:

**`11THONUS-MEDIA-002 — Business Logo Media Capability`**

It should not begin until separately approved.

Proposed sequence:

1. **Contract/design correction**
   - lock Business Logo as the only image purpose;
   - define `MediaAsset` / `logoAssetId`;
   - resolve the existing `logoUrl` contract before live logo data;
   - define existing Business-profile authority reuse;
   - define fallback/default logo behaviour.

2. **Firebase Storage adapter + server lifecycle**
   - preserve the existing Firebase-native architecture;
   - add a narrow media-storage port/adapter so domain code does not depend on download URLs;
   - activate domain-specific Storage Rules only for the authorised path if direct browser upload is selected;
   - otherwise keep client rules closed and mediate through backend/admin access.

3. **Validation/processing**
   - safe decode/re-encode;
   - metadata stripping;
   - bounded file/dimension limits;
   - fixed variants;
   - pending → active lifecycle;
   - orphan cleanup.

4. **Business read/write integration**
   - project active logo asset through the bounded Business read model;
   - add upload/replace/remove to the Business Profile surface;
   - do not add any customer/staff profile-photo UI.

5. **Tests**
   - wrong business / wrong role denied;
   - malformed/spoofed/oversized image denied;
   - valid logo accepted;
   - replacement atomic;
   - delete returns fallback;
   - abandoned pending upload cleanup;
   - inactive/unvalidated object never publicly served;
   - emulator/local path proven;
   - EN/FR user-facing error/copy coverage where user-visible copy is introduced.

6. **Founder Preview + cost evidence**
   - mobile-first business profile;
   - customer-facing logo rendering only where an existing experience surface needs it;
   - record actual retained bytes, request counts and delivery volume.

7. **Reassessment trigger**
   - reconsider R2 only after measured evidence or a new governed media requirement.

## 11. Decisions required before MEDIA-002 implementation

No provider decision is required today because this assessment itself selects no infrastructure.

When MEDIA-002 is authorised, the Tech Lead should confirm:

- **D1 — Storage provider for Business Logo:** recommended Firebase Storage for the first slice.
- **D2 — Asset contract:** approve application-owned `MediaAsset` + `logoAssetId` and retire/correct `logoUrl` before live use.
- **D3 — Upload transport:** direct bounded upload grant vs small backend-proxied upload.
- **D4 — Image formats/limits:** engineering-owned bounded values, with SVG excluded initially unless separately reviewed.
- **D5 — publication rule:** active validated logo becomes public only when associated with an eligible Business state.

None of these decisions authorises customer/staff/owner/manager profile photographs.

## 12. Relationship to 11THONUS-CF-001

This assessment closes the exact future trigger identified by 11THONUS-CF-001:

> R2 was architecture-dependent and should be revisited with the first real file-storage requirement.

That requirement now exists clearly as Business Logo.

The result of revisiting it is **not** "adopt R2 automatically." The project-level evidence supports Firebase Storage for the first bounded logo capability, while retaining an application-owned asset model that makes a later R2 move tractable if it becomes justified.

No Cloudflare runtime, Worker, R2 binding, Images subscription, DNS, WAF, Access or deployment change follows from MEDIA-001.

## 13. Closure

**11THONUS-MEDIA-001 is CLOSED.**

Disposition:

- MV-206: **ALIGNED**
- 11thONUS Firebase-native classification: **UNCHANGED**
- Product Truth: **UNCHANGED**
- infrastructure provisioned: **NONE**
- provider selected/provisioned: **NONE**
- implementation authorised: **NO**
- current governed image requirement: **Business Logo only**
- recommended next package: **11THONUS-MEDIA-002 — Business Logo Media Capability**, separately reviewed and authorised
- R2: **retained as reassessment candidate**
- Cloudflare Images: **deferred pending measured need**
- customer/owner/manager/staff profile photos: **not authorised by this assessment**

This parallel task is complete and requires no further action unless the Founder/Tech Lead later authorises MEDIA-002.
