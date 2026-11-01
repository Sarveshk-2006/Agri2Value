# 08 — Build Roadmap, Testing and Team Plan

## 8.1 Build philosophy

Build one vertical slice end-to-end before adding more modules. A vertical slice means the user can enter a crop lot, receive a calculation, choose an option, request execution and record the outcome. It is not enough to finish the UI, backend and ML as isolated pieces.

## 8.2 Recommended build phases

### Phase 0 — Freeze product decisions

Deliverables:
- Select pilot crop and geography.
- Agree on one farmer demo persona and one harvest scenario.
- Confirm current stack and existing code.
- Select which data will be live, manual or demo.
- Agree on the core success criteria.

Exit gate: everyone can explain the product in one sentence and knows which features are P0.

### Phase 1 — Working foundation

Build:
- Frontend shell and responsive navigation.
- Backend project and database migrations.
- Authentication or clearly labelled demo login.
- Farmer profile, farm and crop-lot creation.
- Demo seed data with provenance labels.

Exit gate: a farmer can sign in, create a farm and create a harvest lot; data persists after refresh.

### Phase 2 — Profit engine vertical slice

Build:
- Option generation for raw sale, direct buyer and one processing path.
- Cost breakdown and net profit calculations.
- Feasibility statuses.
- Recommendation explanation.
- Unit tests and an independent spreadsheet calculation for cross-checking.

Exit gate: all example calculations match expected results; missing costs and unavailable capacity are handled correctly.

### Phase 3 — Buyer and execution

Build:
- Buyer/processor listing.
- Offer request and response.
- Transport request and confirmation.
- Option selection and execution status timeline.

Exit gate: a selected option can move from pending to confirmed and cannot be labelled ready before required confirmations.

### Phase 4 — Transaction and actual profit

Build:
- Delivery record.
- Actual cost lines.
- Payment status and partial payment.
- Estimate-versus-actual reconciliation.

Exit gate: demo transaction produces a correct actual net-profit report.

### Phase 5 — One signature feature

Choose the most reliable differentiator based on the team's actual capacity:
- Crop Rescue Mode (recommended because it reinforces the central product loop); or
- Working ESP32 sensor flow; or
- Validated crop disease model.

Do not attempt all three if it risks breaking the main journey.

Exit gate: feature is demonstrated from input to output, with limitations stated honestly.

### Phase 6 — Polish and judging readiness

- Mobile responsive UI.
- Error/empty/loading states.
- Local-language labels for key flow.
- Demo dataset and reset script.
- Smoke test on the actual demo device/network.
- Backup recording/screenshots.
- Pitch and timing rehearsal.

Exit gate: a clean run can be completed repeatedly without manual database edits.

## 8.3 Suggested team responsibilities

Adapt to team size and actual skills. Avoid assigning one person to every module.

| Workstream | Responsibilities | Key handoff |
|---|---|---|
| Product/UI | Farmer journey, wireframes, React screens, accessibility | Screen flows and API needs |
| Backend/data | Auth, schema, APIs, seed data, permissions | Stable endpoints and migrations |
| Decision engine | Formula definitions, option models, feasibility, tests | Versioned calculation module |
| AI/IoT | Crop model or ESP32 pipeline, evaluation and device testing | Inference/telemetry API |
| Integration/QA/pitch | End-to-end integration, demo script, test cases, pitch | Stable release and evidence |

If there are only 3 people, combine Product/UI with integration/pitch, Backend/data with decision engine, and AI/IoT with QA. Assign one person as integration owner who protects the main journey.

## 8.4 Suggested Git workflow

- `main` always deployable.
- Short feature branches: `feature/crop-lot`, `feature/decision-engine`, `feature/buyer-offers`.
- Pull requests require another team member to review.
- Keep `.env` out of Git; provide `.env.example` with placeholder names only.
- Pin dependencies before demo.
- Tag a release candidate and stop risky feature work before the event.

## 8.5 Testing strategy

### Unit tests — calculation engine

- Raw sale revenue and costs.
- Direct buyer offer and partial quantity.
- Processing yield and output revenue.
- Transport allocation for shared load.
- Storage loss and holding cost.
- Net profit per input kg.
- Missing price/cost handling.
- Decimal rounding and currency handling.

### Feasibility tests

- Processor unavailable → processing not confirmed feasible.
- Buyer capacity too small → partial quantity or infeasible.
- No transport before deadline → option blocked or pending.
- Upfront cost exceeds farmer limit → conditional/infeasible according to policy.
- Crop deadline passed → stale option rejected.

### Integration tests

- Create farmer → farm → crop lot → decision run.
- Select option → create service request → confirm booking.
- Record delivery → add actual costs → add payment → reconcile profit.
- Buyer cancellation → activate rescue → select alternate option.

### AI tests

- Separate train/validation/test data.
- Per-class precision, recall and F1.
- Confusion matrix.
- Low-confidence and unsupported-image handling.
- Model version stored with prediction.

### IoT tests

- Valid reading accepted.
- Duplicate sequence rejected/ignored safely.
- Out-of-range value flagged.
- Stale device shown offline.
- Network loss does not trigger pump.
- Manual override works.

### Security tests

- Farmer cannot read another farmer's lot.
- Buyer cannot see private farmer data without consent.
- Invalid/expired OTP rejected.
- Upload size/type validation.
- Admin actions logged.
- No secrets in client bundle or Git repository.

### UX tests

Ask a tester unfamiliar with the project to complete the main flow. Observe whether they understand:
- what quantity they entered;
- whether prices are live or sample;
- why an option is recommended;
- what still needs confirmation;
- what their actual profit means.

## 8.6 Demo readiness checklist

- [ ] Stable frontend and backend URLs.
- [ ] Database seeded with known demo accounts and scenario.
- [ ] One-click/reset script or reliable manual reset instructions.
- [ ] All demo data visibly labelled.
- [ ] No broken links or dead buttons.
- [ ] No hardcoded secrets.
- [ ] Main flow works on a fresh browser session.
- [ ] Internet-loss fallback understood.
- [ ] ESP32/model demo tested separately.
- [ ] Backup screenshots/video available.
- [ ] Pitch fits allocated time.
- [ ] Every metric and claim has evidence or is clearly described as a target.

## 8.7 What to cut if time is short

Cut in this order:
1. Satellite imagery and advanced geospatial analytics.
2. Full scheme/insurance workflow.
3. Complex voice automation.
4. Multi-crop disease model.
5. Real-time multi-provider marketplace integration.

Do not cut:
- Correct net-profit calculation.
- Feasibility gate.
- Clear data labels.
- Buyer/transport execution state (even if provider confirmation is simulated and labelled).
- Actual-profit reconciliation.
- Main end-to-end test.

## 8.8 Definition of done

A feature is “done” only when:
- user can reach it in the UI;
- backend validation and persistence work;
- loading, empty and error states exist;
- permissions are checked;
- a test covers the main behaviour;
- demo/live data is labelled;
- a teammate can explain it;
- it works in the integrated demo environment.
