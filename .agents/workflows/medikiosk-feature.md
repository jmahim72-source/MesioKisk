---
description: Standard workflow for implementing features in the MediKiosk healthcare kiosk system.
---

# MediKiosk Feature Development Workflow

## Goal

Safely implement and verify clinical intake, hardware peripheral, UI, or EHR integration features for MediKiosk while maintaining strict HIPAA compliance, hardware resilience, state-machine integrity, and zero-residual PHI standards.

---

## 1. Domain & Compliance Assessment

Before modifying or writing code, evaluate:

- **Clinical Workflow**: Identify affected stages (`PATIENT_IDENTIFICATION`, `VERIFICATION`, `CLINICAL_TRIAGE`, `VITALS_COLLECTION`, `ROUTING`, `DISPENSE_TICKET`).
- **Privacy & PHI/PII Scope**: Ensure no patient data is written to unencrypted storage, browser caches, or permanent local files.
- **Hardware Dependencies**: Identify required peripherals (printers, barcode/QR scanners, RFID readers, vitals monitors, payment terminals).
- **EHR / FHIR Compatibility**: Identify affected HL7 FHIR R4 resources (`Patient`, `Encounter`, `Observation`, `Appointment`, `QuestionnaireResponse`).

---

## 2. Architecture & State Mapping

- **Finite State Machine (FSM)**:
  - Map new screens and interactions to explicit FSM states.
  - Define entry, active, completion, timeout, and error recovery transitions.
  - Configure idle timers with grace-period warning modals (15–30s countdown).
- **Hardware Abstraction Layer (HAL)**:
  - Ensure hardware interactions use standardized `PeripheralDevice` interfaces.
  - Define or update mock drivers in `src/hardware/mocks/` for local simulation and CI.
- **Offline & Fallback Logic**:
  - Implement idempotent local queues for network-disconnected states.
  - Define hardware failure fallback paths (e.g., printer failure -> digital SMS/QR ticket).

---

## 3. UI/UX & Accessibility Standards

- **Touch Ergonomics**: Ensure all interactive elements meet minimum 48x48px (preferably 64x64px) touch targets.
- **Accessibility & i18n**: Support dynamic text scaling, high-contrast themes (WCAG 2.1 AAA), and multilingual strings.
- **Privacy Shielding**: Mask sensitive inputs (National ID, DOB, phone, SSN) and provide visual feedback for session timeout warnings.

---

## 4. Implementation Plan

Document a brief implementation plan before major changes:

- Target files to create/modify across `src/ui`, `src/features`, `src/hardware`, `src/core`, `src/integrations`.
- State transition diagram or FSM schema updates.
- Synthetic patient fixtures and mock hardware behaviors needed.
- Verification and rollback plan.

---

## 5. Implementation Guidelines

- **Modular Structure**: Keep hardware drivers, UI views, business logic, and API clients isolated.
- **Strong Typing**: Use strict TypeScript definitions for all domain models, device payloads, and FHIR DTOs.
- **Session Purge Hooks**: Guarantee that session memory buffers are immediately wiped when transitioning to `IDLE` or `ERROR`.
- **Audit Logging**: Add tamper-evident audit logs for patient access and system events using pseudonymous identifiers (never raw PHI).

---

## 6. Verification & Testing

Execute verification in this sequence:

1. **HAL Mock Simulation**:
   - Verify peripheral connect, disconnect, read success, and error events using mock drivers.
2. **FSM State Coverage**:
   - Test happy path, user cancellation, idle session timeout, and concurrent input edge cases.
3. **Synthetic Data**:
   - Validate only with anonymized, synthetic patient fixtures (never real PHI).
4. **Build & Quality Checks**:
   - Run unit/integration tests.
   - Run type-checking, linter, and application build commands.

---

## 7. Review & Security Audit

Inspect the complete git diff to ensure:

- Zero unencrypted PHI/PII persistence (no `localStorage` / `sessionStorage` containing patient medical records).
- No hardcoded API keys, certificates, or credentials.
- Graceful error boundaries around all hardware operations.
- Clean component lifecycle cleanup (no leaked timers or event listeners).

---

## 8. Report & Hand-off

Summarize:

- **What Changed**: Clinical features, UI screens, hardware drivers, or API endpoints added.
- **Files Modified/Created**: Explicit file paths.
- **Verification Results**: Tests executed, hardware simulations passed, build status.
- **Operational Notes**: Any peripheral driver settings or environment configs required.
