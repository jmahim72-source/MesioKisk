---
trigger: always_on
---

# MediKiosk System Architecture & Engineering Standards

## 1. System Overview & Core Mission

MediKiosk is an interactive, secure, and resilient healthcare self-service kiosk system designed for clinical intake, patient check-in, triage assistance, vital sign collection, queue management, and electronic health record (EHR/EMR) synchronization.

All development must prioritize patient privacy, hardware reliability, high accessibility, and fail-safe clinical workflows.

---

## 2. Core Architectural Principles

- **Separation of Concerns**: Strict boundary isolation between UI presentation, hardware abstraction (peripherals), business/triage logic, and external EHR integrations.
- **Offline-First Resilience**: Critical check-in and queue operations must handle intermittent network drops with local queuing, optimistic updates, and idempotent sync.
- **Finite State Machine (FSM) Driven Flows**: Patient workflows (check-in, vitals, payment, ticketing) must be modeled as deterministic state machines with explicit timeouts and error recovery transitions.
- **Zero-Residual PHI on Endpoints**: No Protected Health Information (PHI) or Personally Identifiable Information (PII) may persist unencrypted on kiosk local storage. All session buffers must be immediately wiped upon completion or timeout.
- **Hardware Agnosticism**: All physical devices (printers, barcode/QR scanners, RFID readers, vitals monitors, payment terminals) must interface via standardized Hardware Abstraction Layers (HAL) with mock implementations for testing.

---

## 3. Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 Kiosk Touch & Voice UI                      │
│      (Accessible, Multilingual, Auto-Resetting View)        │
├─────────────────────────────────────────────────────────────┤
│                 Session & Workflow Engine                   │
│   (Finite State Machine, Idle Timer, Privacy Purge)         │
├──────────────────────────────┬──────────────────────────────┤
│   Hardware Abstraction Layer │   Core Domain & Triage Logic │
│   (Scanners, Printers,       │   (Validation, Routing,      │
│    Vitals Sensors, POS)      │    Queue Ticket Generation)  │
├──────────────────────────────┴──────────────────────────────┤
│               Integration & Sync Layer                      │
│     (FHIR / HL7 v2 APIs, Local Queue, Audit Logger)         │
└─────────────────────────────────────────────────────────────┘
```

### 3.1. Frontend & Kiosk UI Layer
- **Touch-First Ergonomics**: Minimum touch target size of 48x48px (preferably 64x64px), high contrast (WCAG 2.1 AAA compliant), dynamic text scaling.
- **Accessibility & Multilingual**: Internationalization (i18n) by default; support for screen reading and multi-language switching at any screen before submission.
- **Privacy Screen Protections**: Mask sensitive data fields (e.g., SSN, National ID, DOB, phone numbers); blur background content during idle timers.

### 3.2. Hardware Abstraction Layer (HAL)
- All peripheral integrations (e.g., thermal printer, optical scanner, NFC/smart card reader, pulse oximeter, blood pressure cuff) must implement clean interfaces:
  ```typescript
  interface PeripheralDevice<TConfig, TData> {
    connect(config: TConfig): Promise<void>;
    disconnect(): Promise<void>;
    getStatus(): Promise<DeviceStatus>;
    onData(callback: (data: TData) => void): Unsubscribe;
    onError(callback: (err: DeviceError) => void): Unsubscribe;
  }
  ```
- Hardware failures (e.g., paper out, scanner offline) must never crash the main application and must trigger graceful fallback paths (e.g., SMS digital ticket, on-screen manual entry).

### 3.3. Triage & Workflow Engine
- Patient intake steps must follow strict sequential state transitions:
  `IDLE -> PATIENT_IDENTIFICATION -> VERIFICATION -> CLINICAL_TRIAGE -> VITALS_COLLECTION -> ROUTING_CONFIRMATION -> DISPENSE_TICKET -> SESSION_CLEANUP -> IDLE`
- Inactivity timeouts must display a grace-period warning modal (15–30s countdown) before terminating and purging the session back to `IDLE`.

### 3.4. Healthcare Integration Layer (EHR / FHIR)
- External healthcare communication must adhere to **HL7 FHIR R4** standards (e.g., `Patient`, `Encounter`, `Observation`, `Appointment`, `QuestionnaireResponse`).
- API calls must be wrapped in retry logic with exponential backoff and circuit breakers for external hospital information systems (HIS).

---

## 4. Security, Privacy & Compliance (HIPAA / GDPR)

- **Encryption**:
  - In-Transit: TLS 1.3 mandatory for all remote communications.
  - At-Rest: AES-256 for local configuration, cached queue queues, and audit logs.
- **Session Sanitization**:
  - Memory buffers holding PHI/PII must be cleared immediately when transitioning to `IDLE` or `ERROR`.
  - Browser/system caches, forms autocomplete, and local unencrypted storage are strictly forbidden for patient data.
- **Audit Logging**:
  - Tamper-evident logging for all patient access events, hardware errors, administrative actions, and system state changes.
  - Logs must never store raw PHI/PII (use pseudonymous IDs and hashes).
- **Endpoint Hardening**:
  - Kiosk lockdown mode: Disable OS gestures, developer shortcuts, external context menus, and unauthorized USB mounting.

---

## 5. Repository & Code Organization

When structuring MediKiosk modules and components:

```
src/
├── core/              # FSM workflow engine, state managers, event buses
├── hardware/          # Hardware Abstraction Layer (HAL) & device drivers
│   ├── printers/      # Thermal receipt & wristband printers
│   ├── scanners/      # QR/Barcode and document scanners
│   ├── sensors/       # Vitals telemetry (BP, SpO2, Weight)
│   └── mocks/         # Mock hardware simulators for local development
├── features/          # Workflow modules (auth, checkin, vitals, queue)
│   ├── check-in/
│   ├── triage/
│   ├── vitals/
│   └── ticketing/
├── integrations/      # FHIR / HL7 clients, HIS gateways, sync queues
├── security/          # Encryption utilities, session purgers, audit logging
├── ui/                # Touch components, layout wrappers, virtual keyboards
└── types/             # Domain models, FHIR DTOs, device payloads
```

---

## 6. Development & Testing Standards

- **Hardware Mocking**: Unit and integration tests must run cleanly in CI without physical hardware using the mock HAL drivers.
- **Synthetic Data**: Use only synthetic, anonymized test fixtures for patient records. Never test with real medical data.
- **State Machine Verification**: Comprehensive test coverage for all edge transitions (abort by user, device disconnect, session timeout, concurrent card swipe).
- **Error Recovery Testing**: Simulate peripheral disconnects mid-transaction and verify graceful recovery and rollback.
