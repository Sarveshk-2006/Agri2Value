# Agri2Value — Farmer Protection Data Architecture & Lifecycle Flows
**Route:** `/app/protection`  
**Module:** Phase 5 — Farmer Protection, Commercial Deal Transparency & Financial Trust  
**Backend Router:** `backend/app/protection/router.py`  
**Database Models:** `DealAgreement`, `DeliveryRecord`, `PaymentRecord`, `FarmerDispute`, `FarmerRiskAlert`, `TransactionAuditEvent`  
**Date:** November 2026

---

## 1. End-to-End Deal Protection Lifecycle Flow

```
[Commercial Agreement Formation]
- Triggered from Decision Engine recommendation or Buyer Network offer
- Generated via POST /api/v1/protection/agreements
- Status: PENDING_ACCEPTANCE -> ACCEPTED
- SHA-256 Digest locked in Immutable Audit Stream
              │
              ▼
[Produce Dispatch & Transit]
- Scheduled pickup from Patil Krishi Farm, Gate 2, Niphad
- Vehicle: MH-15-EG-4412 (Tempo 3T) | Driver: Eknath Shinde
              │
              ▼
[Terminal Arrival & Weighbridge Verification]
- Delivery logged via POST /api/v1/protection/deliveries
- Gross: 6,100 kg | Tare: 3,600 kg | Net Delivered: 2,500 kg
- Weighbridge Certificate #WB-NIPHAD-8821 verified
- Quality inspection: Brix 5.2, Grade A compliant
- Status: CONFIRMED
              │
              ▼
[Milestone Escrow Payment Disbursement]
- Logged via POST /api/v1/protection/payments
- Tranche 1: ₹45,000 disbursed via Escrow Bank Transfer
- Transaction UTR: UPI-RBI-A2V-20260309-8812
- Status: PARTIALLY_PAID
              │
              ▼
[Deduction Verification & Dispute Handling]
- Unexplained deduction detected (₹600 crate washing duplicate)
- Risk Watchdog triggers RISK-1 (Severity: WARNING)
- Farmer raises grievance DISP-2026-8812 via POST /api/v1/protection/disputes
- Sahyadri accounts team issues credit voucher
- Status: RESOLVED
              │
              ▼
[Final Fulfillment & Settlement]
- Remaining 1,500 kg delivered & verified
- Final Tranche ₹23,400 released from escrow
- Agreement status: COMPLETED
```

---

## 2. Financial Arithmetic & Deduction Integrity

```
[Gross Cargo Value] = Confirmed Quantity × Agreed Unit Price
                    = 4,000 kg × ₹18.00/kg = ₹72,000

[Disclosed Pre-Authorized Deductions]:
  - Local Transport Freight (42 km Tempo @ ₹0.045/kg/km):  -₹1,800
  - Handling, Sorting & Returnable Crate Sanitization:      -₹1,200
  - Grade A Quality Moisture Allowance (Credit Pending):     -₹600
  ───────────────────────────────────────────────────────────────
  Total Documented Deductions:                             -₹3,600

[Guaranteed Realized Net Farmer Proceeds]:
  ₹72,000 - ₹3,600 = ₹68,400

[Payment Realization Reconciliation]:
  - Tranche 1 (Advance Milestone Disbursed):                ₹45,000 (65.8%)
  - Tranche 2 (Final Outstanding Balance Due in 48h):       ₹23,400 (34.2%)
  ───────────────────────────────────────────────────────────────
  Total Settled & Protected:                                ₹68,400 (100.0%)
```

---

## 3. Pydantic & TypeScript Schema Mapping

| Frontend Type (`frontend/src/types.ts`) | Backend Model (`backend/app/database/models.py`) | Backend Schema (`backend/app/protection/schemas.py`) |
| :--- | :--- | :--- |
| `DealAgreement` | `DealAgreement` | `DealAgreementResponse` |
| `DeliveryRecord` | `DeliveryRecord` | `DeliveryRecordResponse` |
| `PaymentRecord` | `PaymentRecord` | `PaymentRecordResponse` |
| `FarmerDispute` | `FarmerDispute` | `FarmerDisputeResponse` |
| `FarmerRiskAlert` | `FarmerRiskAlert` | `FarmerRiskAlertResponse` |
| `TransactionAuditEvent` | `TransactionAuditEvent` | `TransactionAuditEventResponse` |
| `ProtectionDashboardMetrics` | Aggregated Queries | `ProtectionDashboardMetrics` |

---

## 4. Grounded Truth & Ethical Fintech Guardrails

1. **No Simulated Escrow Claimed as Real Bank:** All payment records in demo mode carry explicit metadata `data_mode: "demo"` and UI disclaimers noting that transactions are simulated ledger entries for demonstration purposes.
2. **Deterministic Deductions:** Every deduction is mapped to an exact agreement schedule reference (Schedule 2.1 Freight, Schedule 3.4 Handling).
3. **Audit Log Verifiability:** Every transaction state mutation records actor identity, role, timestamp, and SHA-256 digest representation.
