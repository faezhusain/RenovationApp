# Business Requirements Document
## All-in-One Renovation Planner and Budget Tracker

**Version:** 1.0 — For business review  
**Date:** 28 October 2026  
**Business owner:** Homeowner / product owner  
**Platform:** Responsive web application for desktop, tablet and mobile

## 1. Executive summary

Create one place for a homeowner to plan a house renovation, control the budget, compare quotations, record expenses and payments, store receipts, and track work from key collection to move-in. The application must answer five everyday questions:

1. What is my renovation spending limit?
2. How much work have I agreed to, and how much have I paid?
3. What remains payable, and how does that compare with my available funds?
4. What should I do next?
5. How far has the renovation progressed?

The experience should follow the supplied references: a calm cream-and-green interface, readable cards, simple language, prominent financial summaries, guided onboarding and a practical renovation checklist. This BRD defines proposed business scope and acceptance conditions; it does not prescribe a technology stack.

## 2. Business problem and objectives

Renovation information is commonly spread across spreadsheets, messages, quotations and receipts. This makes it difficult to distinguish an estimate from an agreed commitment, remember partial payments, and identify unfinished work.

| ID | Objective | Proposed success measure |
|---|---|---|
| OBJ-01 | Give the owner a reliable view of renovation finances | Dashboard, detailed records and exports reconcile to the smallest currency unit for all acceptance scenarios. |
| OBJ-02 | Simplify routine record keeping | At least 4 of 5 representative first-time users can record a payment and attach a receipt within two minutes without assistance. |
| OBJ-03 | Make the next action clear | Every active task can be found by stage, room, status or search; overdue tasks and payment milestones are visible from Home. |
| OBJ-04 | Preserve evidence and history | Every financial adjustment retains its actor, timestamp and reason; supporting documents remain linked to the relevant record. |
| OBJ-05 | Support work across devices | The same saved project data is available after signing in on a second supported device. |

These measures are proposed release targets for owner approval, not existing performance claims.

## 3. Scope and delivery priorities

**M = Must have for initial release. S = Should have after the core release is stable. C = Could have later.**

| Release | Included capabilities |
|---|---|
| Initial release — M | Sign-in; project/home profile; guided setup; dashboard; category and room budgets; reserve; cost estimates; quotation comparison and acceptance; agreed costs and variations; deposits and partial payments; refunds; payment milestones; receipts; checklist and due dates; search; in-app alerts; export; audit history; secure cloud storage. |
| Next release — S | Household collaboration with roles; email reminders; timeline/calendar view; task dependencies; defects and warranty register; CSV import with preview and duplicate checks; printable project summary. |
| Later — C | Bank transaction import; receipt OCR with user verification; contractor portal; shopping/material selection boards; advanced cash-flow forecasting; multiple-project portfolio; optional multilingual interface. |

**Outside initial scope:** processing payments, accounting or tax returns, automatic bank reconciliation, contractor marketplace, building design/CAD, construction certification, native mobile apps, subscription billing and general household income/expense management unrelated to renovation.

**Scope assumption:** “budget and expenses” refers to renovation finances, including associated furnishings and move-in costs. A general personal-finance module requires a separate scope decision.

## 4. Stakeholders and access

| Stakeholder | Business responsibilities | Access |
|---|---|---|
| Homeowner / owner | Set scope, budget and reserve; accept quotations; record payments; manage tasks; approve release | Full access to their project and exports; control sharing and deletion. |
| Household collaborator — S | Help maintain renovation records | Editor or viewer access assigned by owner. Editors cannot manage access or delete the project. |
| Contractor / supplier | Provide quotes, invoices and work updates | Stored as a contact in initial release; no login or automatic communication. |
| Product/design/development team | Translate approved requirements into screens and working software | Test data by default; production access only through authorised support procedures. |

All access must be enforced on the server, including downloads and direct record URLs. Signing in as another homeowner must never reveal the first homeowner’s records.

## 5. Reference-based design requirements

The following traceability register identifies the supplied visual references by filename prefix; all files are JPEGs in the project folder. Mockup amounts and property details are demonstration content, not the owner's actual data.

| Reference | Observed feature | Requirements |
|---|---|---|
| 861496138 | Welcome panel; renovation target; funds available now; agreed costs; already paid | FR-01, FR-02, FR-03 |
| 860844054 | Three onboarding steps; “What comes next?” | FR-02, FR-10 |
| 858799215 | Six-month payments chart; month selection; still to pay | FR-03, FR-07 |
| 861650049 | Overall and per-stage checklist progress | FR-09, BR-08 |
| 861762708 | Planned-budget donut: agreed costs, emergency reserve and unallocated budget | FR-04, BR-05 |
| 861444851 | Category bars with Agreed / Estimated / Paid tabs; savings snapshot explanation | FR-03, FR-04, BR-06 |
| 861421738 | Mobile checklist; status selection; importance badges; search | FR-09, UX-02 |
| 862314480 | Desktop sidebar; task cards; add/edit/delete; receipts and home navigation | FR-08, FR-09, UX-01 |

**UX-01 — Desktop:** Persistent left navigation for Home, Checklist, Budget, Quotations, Receipts, My Home and Guide. Use a project/account bar at the top and a spacious card grid. “Seller codes” appears in one reference but is excluded until its business purpose is clarified.

**UX-02 — Mobile:** Bottom navigation for Home, Checklist, Budget, Quotations and More. More contains Receipts, My Home, Guide and account controls. Use a single-column content flow where needed; fixed navigation must not obscure content or actions.

**UX-03 — Visual direction:** Warm off-white background, dark forest-green primary actions, sage secondary surfaces, restrained sand/gold accents, rounded cards, generous spacing, serif display headings and readable sans-serif interface text. Final branding, fonts and exact colours require design approval. Reference branding and promotional imagery are not app assets by default.

**UX-04 — Interaction:** Each chart has a numeric/text equivalent. Status is communicated with words and icons as well as colour. Show empty, loading, saved, failed and retry states. Never display “Cloud sync on” as proof of a successful save when a request has failed.

## 6. Functional requirements

### FR-01 — Account and home/project setup [M]

The owner shall sign in securely and create a renovation project containing project name, property type, optional location, currency, timezone, target budget, emergency reserve, start date and target move-in date. Currency is selected during setup; MYR/RM is the proposed default from the references, subject to confirmation. Currency cannot be changed after financial records exist without an explicit migration process. A current savings snapshot includes its amount and “as of” date.

**Acceptance:** A saved project reloads with the same details on another device. Invalid dates, negative budgets and a reserve above the target budget are rejected with clear messages.

### FR-02 — Guided onboarding [M]

Home shall show three resumable setup steps: tell us about your home, review your renovation checklist, and add your first cost or quotation. Completion derives from saved records. A quotation is clearly labelled as a quotation, not a payment. Completed onboarding can be collapsed and reopened.

**Acceptance:** The indicator advances only after the associated information is saved; leaving and returning preserves progress.

### FR-03 — Home dashboard [M]

Home shall show the project welcome panel, four primary financial cards, still-to-pay balance, next actions, six-month payments chart, category cost comparison, planned-budget allocation and checklist progress. Each card or chart shall link to its underlying records.

| Component | Business meaning and interaction |
|---|---|
| Renovation target | Approved overall spending limit; opens budget settings. |
| Funds available now | Manually entered savings snapshot and its date; opens edit control. |
| Agreed costs | Current accepted commitments, including approved variations. |
| Already paid | All-time net payments, including dated refunds. |
| Still to pay | Sum of positive unpaid balances on agreed items; overpayments shown separately. |
| Monthly payments | Six calendar months ending in the selected month; payment-date basis; month selection opens transactions. Refunds are separately visible. |
| Where your money goes | Category bars with Agreed, Estimated and Paid views; opens filtered Budget. |
| Planned budget | Agreed commitments, remaining reserve and unallocated target; over-budget state shown explicitly. |
| Renovation progress | Completed/eligible tasks and stage breakdown; opens Checklist. |
| What comes next? | Overdue and upcoming tasks/payment milestones, with direct actions. |

**Acceptance:** Saving a payment updates all related views without duplicate counting. An empty project shows helpful setup actions rather than fabricated numbers. Period-filtered values are labelled; the four summary cards remain project-to-date unless explicitly changed and relabelled.

### FR-04 — Budget and estimates [M]

The owner shall allocate spending by category and optionally room, record estimated cost items and set a separate emergency reserve. Initial categories may include construction, carpentry, electrical and plumbing, kitchen, fixtures and fittings, furnishings, appliances, professional fees, moving and other. Categories and rooms are editable.

Show target, estimated forecast, agreed cost, paid, outstanding and variance as distinct fields. An item's category and room are separate dimensions; one cost must not be added twice because it appears in both views. Category allocations are planning limits, not additional costs. Show unassigned allocation and warn when category allocations exceed the target less reserve. Warn on forecast or agreed-cost overruns without silently changing the target.

**Acceptance:** A new estimate affects the estimated forecast only. Accepting a quotation replaces that item's planning estimate in the forecast and adds its agreed commitment once.

### FR-05 — Suppliers and quotations [M]

Store supplier name, contact details and notes. Support multiple quotation options for a defined work package, including scope, version, date, validity, amount, tax/delivery inclusions, exclusions, duration, payment terms and attachment. Compare at least three options side by side on desktop, with a usable mobile equivalent. The owner manually selects a quotation; price alone must not automatically determine selection.

**Acceptance:** Accepting one option creates or updates a linked agreed cost once. Repeated clicks do not duplicate it. Competing and superseded quotations remain available for reference but do not inflate commitments. Replacing an accepted quotation requires an explicit revision with history.

### FR-06 — Agreed costs and changes [M]

Support agreed work and direct purchases without a quotation. Each agreed cost records description, supplier, category, optional room, amount, agreement date and supporting evidence. Variations record a signed amount, explanation and owner approval. Draft or rejected changes have no financial effect. Cancellation or correction retains history and cannot erase previous payments.

**Acceptance:** An approved increase updates commitment, forecast and outstanding amounts; the original amount and variation remain visible. Financial records with activity are voided or adjusted rather than permanently removed from history.

### FR-07 — Payments, refunds and due dates [M]

Record deposits, instalments and final payments against agreed costs, including amount, actual date, payment method, reference, notes and optional receipt. A quick expense action may create an agreed purchase and its payment together. Store scheduled payment milestones separately from completed payments; show due soon and overdue unpaid milestones. Default due-soon window is seven days, configurable by the owner.

Support refunds linked to the original cost and payment. A refund reduces net paid; it does not automatically reduce the agreed price. Any corresponding credit or cancellation is a separate approved cost adjustment. Warn on overpayment and probable duplicates; require explicit confirmation and a reason for an overpayment. Future-dated planned payments belong in milestones, not Already paid.

**Acceptance:** Multiple deposits reduce the same cost's balance correctly. A draft or scheduled payment does not affect paid totals. Correcting a payment preserves its history. A refund appears in its actual refund month.

### FR-08 — Receipts and project documents [M]

Upload JPEG, PNG and PDF files, proposed maximum 20 MB per file. Link documents to quotations, costs, payments or tasks; support preview, download, description, date and search. Allow multiple receipts per payment and a receipt to be referenced without duplicating the financial transaction. Uploading a document alone must not create a payment.

**Acceptance:** Unsupported or oversized files receive clear errors. Unauthorised users cannot retrieve a file using its URL. A failed upload can be retried without losing the saved payment.

### FR-09 — Renovation checklist and planning [M]

Provide an editable starter checklist covering Before you start, Planning, Contractors, Materials, Before work, During works, Furnishing, Handover and Optional décor. Each task has title, stage, optional room, description/“why it matters”, importance, status, optional start/due dates and notes/documents.

Importance options: Must do, Helpful, Optional. Status options: Not started, Doing, Done, Skip. Support add, edit, archive, reopen, keyword search and filters by status, stage, room and importance. “Next step” may advance Not started → Doing → Done; direct status selection supports corrections and Skip. Archive requires confirmation and supports recovery.

**Acceptance:** Updating a task immediately recalculates stage and project progress using BR-08. Reopening a completed task reduces progress. No template label represents certification that legal or building requirements have been met.

### FR-10 — Next actions and notifications [M; email S]

Show overdue incomplete tasks and unpaid milestones first, then upcoming dated actions, then undated Must do tasks in stage order. Break ties by earliest due date and then creation date. Exclude Done, Skip and archived tasks. In-app alerts cover overdue items, agreed/forecast budget overruns and a savings snapshot older than a proposed 30 days. Alerts link to the relevant records and clear when resolved; dismissing an alert does not complete its task.

**Acceptance:** Paying a milestone removes its unpaid reminder; completing a task removes its next-action entry. Email delivery and external messages are outside the initial release.

### FR-11 — Search, reporting and export [M]

Provide searchable financial and task lists with relevant category, room, supplier, status and date filters. Export costs, payments, quotations and checklist data to CSV, with stable identifiers linking records. Financial exports include currency, date basis and totals; amounts retain full stored precision. Provide a downloadable document bundle or an owner-accessible document export process.

**Acceptance:** Exported filtered totals match the screen, including refunds and void exclusions. CSV cells are safely encoded to prevent uploaded text being treated as executable spreadsheet formulas.

### FR-12 — Data lifecycle and activity history [M]

Persist records in the cloud and display save status. Retrying a save must not duplicate transactions. Detect conflicting edits and ask the user to reconcile rather than silently overwriting a financial change. Maintain an activity log of financial creation, adjustment, voiding, reserve/target changes and savings updates. The owner can archive a project, export data and request permanent deletion after confirmation; the deletion and backup-retention policy must be agreed before launch.

**Acceptance:** A refresh after a successful save retains the change. A failed save remains clearly unsaved. Archived projects retain their records and can be restored.

## 7. Financial and progress business rules

These definitions are the single calculation basis for dashboards, detail pages and exports. Monetary examples use RM to match the references.

| ID | Rule |
|---|---|
| BR-01 | Store money as fixed-precision decimal values in the project's currency. Round display values only; never use rounded display totals as calculation inputs. Initial release supports one currency per project and no currency conversion. |
| BR-02 | Agreed costs A = sum of active agreed item amounts, including approved variations and credits. Unaccepted quotes and draft changes are excluded. Payments do not add to agreed costs. |
| BR-03 | Net paid P = completed payments less completed refunds, excluding voided records. For each item i, outstanding = max(Ai − Pi, 0). Still to pay O = sum of item outstanding balances. Overpayment = sum of max(Pi − Ai, 0), shown separately; do not offset one supplier's debt with another supplier's overpayment. |
| BR-04 | Estimated forecast F = agreed costs for accepted/purchased items plus the current chosen estimate for every unagreed item. Alternative quotes for the same item are not added together. Estimated category bars use this forecast definition and explain it in a tooltip. |
| BR-05 | Target T includes remaining emergency reserve R. Unallocated target U = T − A − R. Budget committed percentage = A ÷ T × 100. If T = 0, show “Not set”. If U < 0 or A > T, show the overrun amount and an accessible alternative to an invalid donut. Forecast headroom = T − F − R is shown separately from U. |
| BR-06 | Funds available now S is a manually maintained current savings snapshot. Recording a payment must NOT subtract it again. Snapshot coverage gap = max(O − S, 0), clearly labelled as a comparison against all unpaid agreed work, not a dated cash-flow forecast. |
| BR-07 | An owner may release reserve through an explicit logged transfer. Reducing R does not itself add a cost or change T; related work is recorded as a separate agreed cost/variation. A target increase requires a separate logged edit. |
| BR-08 | Eligible tasks = non-archived tasks excluding Skip. Progress = Done ÷ eligible tasks × 100, rounded to the nearest whole percent. All other eligible tasks count as remaining. Zero eligible tasks show “No active tasks”, not 100%. This is checklist completion, not a measure of physical construction completion. |
| BR-09 | Monthly chart totals use actual payment/refund dates in the project timezone. Months without transactions show zero. Due/overdue status uses the same timezone; an item due today becomes overdue the next day if unpaid/incomplete. |
| BR-10 | Cost totals use final payable amounts including stated tax and charges. Quotes must explicitly identify exclusions or unknown charges; the app must not invent a tax rate. A quote with unknown final charges is flagged before acceptance. |

**Reference reconciliation:** T = RM150,000; A = RM110,800; P = RM107,900; R = RM4,500; S = RM3,000. Assuming no item overpayments, O = RM2,900; U = RM34,700; committed percentage = 73.866…%, displayed as 74%. Savings exceed unpaid agreed work by RM100, but this does not establish coverage for future unagreed work. Recording another RM1,000 payment makes P = RM108,900 and O = RM1,900; S stays RM3,000 until the owner updates the snapshot. Checklist completion of 37 out of 52 eligible tasks displays 71%.

## 8. Main user journeys

1. **Start a renovation:** Sign in → enter home and project details → set target, reserve and savings snapshot → review starter checklist → add first estimate or quotation → see dashboard.
2. **Choose a contractor:** Create work package → add comparable quotations and documents → review inclusions/exclusions → accept one option → create agreed cost → add payment milestones.
3. **Record spending:** Open agreed cost or create a direct purchase → enter payment details → attach receipt → save → review updated paid and outstanding totals.
4. **Manage change:** Add proposed variation → review budget impact → approve or reject → update commitment and retain decision history.
5. **Plan the week:** Open next actions → review overdue/upcoming tasks and payments → update task status or record payment → confirm dashboard progress.
6. **Finish the project:** Resolve remaining tasks and balances → export records and documents → archive project for later reference.

## 9. Core business data

| Entity | Essential information / relationships |
|---|---|
| User / membership | Identity; project role; membership status. Initial release has owner membership only. |
| Project | Owner; home details; currency/timezone; target; reserve; dates; archive status. |
| Savings snapshot | Project; amount; as-of date; update history. |
| Category / room | Project-specific name; allocation where relevant; active/archive state. |
| Cost item / work package | Project; category; optional room/supplier; scope; estimate; accepted amount; status. |
| Quotation / version | Cost item; supplier; commercial terms; amount; date; status; attachment references. |
| Variation / credit | Cost item; signed amount; reason; approval status; actor/date. |
| Payment / refund | Cost item; amount; actual date; method/reference; original payment link for refund; void state. |
| Payment milestone | Cost item; scheduled amount; due date; linked payment allocations. A payment may be allocated across milestones of the same item; allocations cannot exceed its amount. |
| Task | Project; stage; room; importance; status; dates; notes; linked records. |
| Attachment | Project; record links; filename; type; size; private storage reference; uploader/date. |
| Audit event | Record identifier; actor; action; timestamp; prior/new values; reason. |

Every financial and task record belongs to exactly one project. Referenced categories, suppliers and rooms are archived or reassigned instead of deleted in a way that breaks historical records.

## 10. Non-functional requirements

The following are proposed, testable targets to confirm during solution design.

| ID | Requirement | Acceptance target |
|---|---|---|
| NFR-01 | Security and privacy | Encrypted transport and stored sensitive data; secure authentication/recovery; server-side authorisation; private files; no credentials or receipt contents in application logs. Pass access-isolation and attachment-access tests before launch. |
| NFR-02 | Responsiveness | Support 360 px mobile through 1440 px desktop layouts. No page-level horizontal scrolling for core tasks; wide comparisons have an explicit usable mobile view. |
| NFR-03 | Accessibility | Keyboard-operable core flows, labelled form controls, visible focus, readable contrast, accessible chart alternatives and clear validation. Validate with automated checks and manual keyboard/screen-reader review. |
| NFR-04 | Performance | Proposed p95 dashboard load ≤3 seconds and save confirmation ≤2 seconds, excluding file upload, at 20 concurrent users with 5,000 cost items and 10,000 payments in a project. Agree network/device test conditions before testing. |
| NFR-05 | Reliability | Proposed 99.5% monthly availability; daily backups; recovery point ≤24 hours and recovery time ≤8 hours. Demonstrate restore before production launch. |
| NFR-06 | Data integrity | Atomic financial saves, duplicate-submit protection, exact currency reconciliation and conflict detection. No payment is marked saved before server confirmation. |
| NFR-07 | Browser compatibility | Validate current and previous major desktop Chrome, Edge, Firefox and Safari versions at release, plus current mobile Safari and Chrome. |
| NFR-08 | Maintainability | Centralised calculation rules, versioned data changes, error monitoring and documented deployment/restore procedures. |

## 11. User acceptance scenarios

| ID | Scenario and expected outcome | Traceability |
|---|---|---|
| UAT-01 | Enter the reference figures in section 7; display RM2,900 still to pay, RM34,700 unallocated and 74% committed. | OBJ-01; FR-03/04; BR-02/03/05 |
| UAT-02 | Add two alternative RM10,000 and RM12,000 quotes to one item; accept RM10,000. Agreed costs increase by RM10,000 once, not RM22,000. | FR-05; BR-02/04 |
| UAT-03 | On a RM10,000 agreed cost, pay RM2,000 then RM3,000. Paid = RM5,000 and outstanding = RM5,000. Re-submit the second save; totals remain unchanged. | FR-07/12; NFR-06 |
| UAT-04 | Refund RM500 of those payments without a price adjustment. Net paid = RM4,500; outstanding = RM5,500. Apply a separate approved RM500 credit; agreed = RM9,500 and outstanding = RM5,000. | FR-06/07; BR-02/03 |
| UAT-05 | One item is overpaid RM100 and a second owes RM500. Still to pay = RM500; overpayment = RM100 separately. | FR-07; BR-03 |
| UAT-06 | Record a payment while savings snapshot is RM3,000. The snapshot remains RM3,000 and shows its existing as-of date. | FR-01/03; BR-06 |
| UAT-07 | Set 37 of 52 eligible tasks to Done; display 71%. Skip one unfinished task; display 37/51 = 73%. Reopen one completed task; display 36/51 = 71%. | FR-09; BR-08 |
| UAT-08 | Record payment in September and refund in October. Each appears in its transaction month; six-month totals reconcile to underlying records. | FR-03/07; BR-09 |
| UAT-09 | Increase agreed costs beyond target less reserve. Show negative unallocated amount and a clear overrun, with no misleading donut proportions. | FR-04; BR-05 |
| UAT-10 | Attempt another owner's record and receipt URLs. Access is denied without revealing record content. | FR-08; NFR-01 |
| UAT-11 | Interrupt a save, then retry. Show unsaved/error state, preserve entered values and create one record after success. | FR-12; NFR-06 |
| UAT-12 | Export a filtered payment list with a refund and voided transaction. Screen and CSV totals match; voids are excluded from totals and labelled where listed. | FR-11; OBJ-01 |
| UAT-13 | Complete setup, add a quote, record a payment/receipt and update a task on mobile using keyboard/accessibility alternatives where applicable. All actions are reachable and understandable. | OBJ-02/05; UX-02; NFR-02/03 |
| UAT-14 | Allocate a partial payment to a due milestone. Only the unpaid remainder is overdue; paying it clears the reminder without changing the agreed cost. | FR-07/10; BR-09 |

## 12. Delivery approach and release gate

**Stage 1 — Confirm business scope:** Resolve section 14 decisions; approve financial definitions, checklist content and initial-release boundaries.

**Stage 2 — Design:** Prepare desktop/mobile wireframes for Home, Budget, quotations, payment entry, checklist and receipts; validate with the owner against the reference register. Approve visual direction and empty/error states.

**Stage 3 — Build and verify:** Implement account/project isolation, financial records/calculations, documents, checklist and dashboard; test complete journeys and recovery behaviour.

**Stage 4 — Pilot and release:** Populate a pilot project, reconcile totals, run owner UAT, verify backup restoration and complete operating documentation.

Initial release requires all M requirements and UAT scenarios to pass, no unresolved critical/high security or data-integrity defects, acceptable mobile usability, a successful recovery test and owner sign-off. Delivery dates, development cost and hosting spend must be estimated after scope and design approval; none are committed by this BRD.

## 13. Risks, dependencies and controls

| Risk / dependency | Business impact | Control / owner |
|---|---|---|
| Confusing budget, commitment, payments and savings | Misleading affordability decisions | Adopt section 7 labels/formulas; product owner approves examples. |
| Missing or inconsistent records | Inaccurate forecast and balances | Clear required fields, missing-data flags, receipt links and reconciliation; homeowner maintains inputs. |
| Unrecorded variations | Unexpected overspend | Visible variation history and approval; homeowner confirms changes. |
| Stale savings snapshot | False sense of available cash | Show as-of date and stale-data alert; homeowner updates balance. |
| Duplicate payments or concurrent changes | Incorrect totals | Duplicate detection, idempotent saves and conflict handling; development team. |
| Private documents exposed | Loss of privacy | Private storage, access tests and agreed retention; development/operations team. |
| Broad interpretation of “all in one” | Scope and cost expansion | Baseline initial release and assess additions through change control; product owner. |
| Unconfirmed checklist guidance | Users mistake planning prompts for approvals | Owner-approved wording and editable guidance; no automatic certification claims. |
| Hosting/authentication/file-storage services not selected | Delivery and operating-cost uncertainty | Select providers and approve costs during solution design. |

## 14. Decisions required before implementation

The BRD can be reviewed now. These decisions refine the baseline; they do not prevent planning the core product.

| ID | Decision | Proposed starting position |
|---|---|---|
| D-01 | Renovation finances only, or broader personal budgeting? | Renovation-only initial release. |
| D-02 | Project currency, timezone and language? | MYR/RM based on mockups; choose timezone during setup; English initially. |
| D-03 | Personal tool, shared household tool or public commercial product? | Personal owner account initially; household sharing next. Commercial subscriptions require separate scope. |
| D-04 | Manual savings snapshot or fully reconciled cash ledger? | Manual snapshot matching the mockup; no automatic subtraction from savings. |
| D-05 | One project or multiple properties? | One active project in initial interface; records remain project-scoped for future expansion. |
| D-06 | Default checklist and handling of Skip? | Owner-reviewed stages; Skip excluded from completion denominator. |
| D-07 | Need bank feeds, OCR, external reminders or payment processing at launch? | Manual entry and in-app reminders initially. |
| D-08 | What does “Seller codes” represent? | Exclude until purpose, users and workflow are defined. |
| D-09 | Product name, brand assets and final layout? | Use supplied images as visual direction; approve original product identity and final wireframes. |
| D-10 | Hosting region, retention period, deletion timing and operating budget? | Confirm before production; document active-data and backup deletion behaviour. |

## 15. Approval and change control

| Approval | Name | Date | Status |
|---|---|---|---|
| Business scope and priorities | Product owner | — | Pending review |
| Financial definitions and dashboard | Product owner | — | Pending review |
| UX/design baseline | Product owner / designer | — | Pending review |
| Feasibility, estimates and release plan | Delivery lead | — | Pending review |

After approval, each change request must identify affected requirement IDs, business reason, impact on scope/cost/timing, revised acceptance criteria and the owner's decision. Maintain the BRD version history alongside the approved baseline.
