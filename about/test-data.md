# MediKiosk - Complete Testing & Demo Dataset

This document provides ready-to-use testing datasets, personas, login credentials, red-flag speech prompts, sample prescriptions, and API payloads for testing all MediKiosk components.

---

## 1. System Login Credentials (RBAC)

| Role | Username / Email | Password | Facility / Department |
|---|---|---|---|
| **Senior Physician** | `doctor@hospital.gov.in` | `secure-password` | AIIA Delhi • Ayurveda & General OPD |
| **Hospital Admin** | `admin@hospital.gov.in` | `admin-password` | IT & Hospital Administration |
| **Kiosk Terminal** | `kiosk@hospital.gov.in` | `kiosk-token-2026` | Ground Floor OPD Waiting Area |

---

## 2. Test Patient Personas

### Persona 1: Meena Devi (Primary SIH Demo Scenario - Cardiac Red Flag)
- **First Name**: `Meena`
- **Last Name**: `Devi`
- **Age / DOB**: `58 Years` / `1968-04-15`
- **Gender**: `FEMALE`
- **Phone**: `+91 98765 43210`
- **ABHA ID**: `91-2345-6789-0123` (Masked: `91-2345-XXXX-0123`)
- **Hospital ID**: `HOSP-2026-001245`
- **Language**: `Hindi (hi)`
- **Chief Complaint Prompt**: *"सुबह से सीने में भारीपन व तेज दर्द है और बहुत पसीना आ रहा है।"*
- **Triggered Red Flag**: `CARDIAC_001` (Critical Priority $\rightarrow$ Token: `A-042`)
- **Ayurvedic Profile**: `Vata-Pitta Prakriti`, `Vishamagni`, `Krura Koshtha`
- **Known History**: Type 2 Diabetes, Hypertension

---

### Persona 2: Rajesh Sharma (Chronic Musculoskeletal & Gastric OPD)
- **First Name**: `Rajesh`
- **Last Name**: `Sharma`
- **Age / DOB**: `45 Years` / `1981-08-22`
- **Gender**: `MALE`
- **Phone**: `+91 98111 22334`
- **ABHA ID**: `91-4455-6677-8899`
- **Hospital ID**: `HOSP-2026-002389`
- **Language**: `English (en)`
- **Chief Complaint Prompt**: *"Chronic lower back pain for 3 weeks and acid reflux after meals."*
- **Triggered Red Flag**: `None` (Routine OPD Priority $\rightarrow$ Token: `A-043`)
- **Ayurvedic Profile**: `Vata Dominant`, `Tikshnagni (Acidity)`, `Madhyama Koshtha`
- **Known History**: Lumbar spondylosis, GERD

---

### Persona 3: Gurpreet Singh (Respiratory Distress Red Flag)
- **First Name**: `Gurpreet`
- **Last Name**: `Singh`
- **Age / DOB**: `62 Years` / `1964-11-05`
- **Gender**: `MALE`
- **Phone**: `+91 98222 33445`
- **ABHA ID**: `91-7788-9900-1122`
- **Hospital ID**: `HOSP-2026-003412`
- **Language**: `English (en)`
- **Chief Complaint Prompt**: *"Severe breathlessness, wheezing, and unable to complete sentences."*
- **Triggered Red Flag**: `RESP_001` (Critical Priority $\rightarrow$ Token: `G-015`)
- **Known History**: Chronic Asthma / COPD

---

### Persona 4: Savita Patel (Acute Neurological / Stroke Red Flag)
- **First Name**: `Savita`
- **Last Name**: `Patel`
- **Age / DOB**: `67 Years` / `1959-02-18`
- **Gender**: `FEMALE`
- **Phone**: `+91 98333 44556`
- **ABHA ID**: `91-1122-3344-5566`
- **Hospital ID**: `HOSP-2026-004578`
- **Language**: `Hindi (hi)`
- **Chief Complaint Prompt**: *"अचानक से दायाँ हाथ और पैर सुन्न हो गया है और बोलने में जीभ लड़खड़ा रही है।"*
- **Triggered Red Flag**: `STROKE_001` (Critical Priority $\rightarrow$ Token: `G-016`)

---

## 3. Red-Flag Test Keywords & Speech Prompts

| Test Rule | Language | Voice / Text Input String to Test | Expected Trigger |
|---|---|---|---|
| **CARDIAC_001** | Hindi | `"सुबह से सीने में दर्द है और सांस फूल रही है पसीना आ रहा है"` | Critical Red Flag Alert |
| **CARDIAC_001** | English | `"Severe chest pain radiating to left arm with cold sweat and nausea"` | Critical Red Flag Alert |
| **STROKE_001** | Hindi | `"अचानक एक तरफ कमजोरी और बोलने में दिक्कत आ रही है"` | Critical Red Flag Alert |
| **STROKE_001** | English | `"Sudden weakness in right arm and slurred speech facial droop"` | Critical Red Flag Alert |
| **RESP_001** | English | `"Severe breathlessness cyanosis unable to speak full sentence"` | Critical Red Flag Alert |
| **BLEED_001** | Hindi | `"खून की उल्टी और काला मल आ रहा है"` | Critical Red Flag Alert |

---

## 4. Sample Document Texts for OCR Testing

### Sample 1: Standard Prescription (`prescription_jan_2026.jpg`)
```text
AIIMS OPD / District Hospital Meerut
Date: 12-Jan-2026 | Patient: Meena Devi (58 F)
Rx:
1. Tab Metformin 500mg PO BD x 1 month (After meals)
2. Tab Telmisartan 40mg PO OD (Morning)
3. Tab Pantoprazole 40mg PO OD (Before breakfast)
Diagnosis: Type 2 Diabetes Mellitus, Essential Hypertension
Advice: Fasting Blood Sugar, HbA1c test
Dr. A. K. Verma, MD (Reg No: MCI-45210)
```
*Expected Extracted Entities*:
- **Medication 1**: `Metformin` | `500 mg` | `TWICE_DAILY`
- **Medication 2**: `Telmisartan` | `40 mg` | `ONCE_DAILY`
- **Diagnosis**: `Type 2 Diabetes Mellitus (ICD-10: E11)`, `Essential Hypertension (ICD-10: I10)`

---

### Sample 2: Pathology Blood Sugar Report (`lab_report_hba1c.pdf`)
```text
CENTRAL PATHOLOGY LABORATORY
Patient Name: Meena Devi | Age/Sex: 58/F | Date: 14-Jan-2026
TEST RESULTS:
Fasting Blood Sugar (FBS): 168 mg/dL (Reference Range: 70 - 100 mg/dL) [HIGH]
Post Prandial Blood Sugar (PPBS): 242 mg/dL (Reference Range: < 140 mg/dL) [HIGH]
HbA1c (Glycated Hemoglobin): 8.4 % (Reference Range: < 5.7 %) [ELEVATED]
Serum Creatinine: 0.9 mg/dL (Reference Range: 0.6 - 1.2 mg/dL) [NORMAL]
```
*Expected Extracted Entities*:
- **Lab Test 1**: `Fasting Blood Glucose` | `168 mg/dL` | `Flag: HIGH`
- **Lab Test 2**: `HbA1c` | `8.4 %` | `Flag: HIGH`

---

## 5. Sample API Request Payloads (cURL / JSON)

### 1. Doctor Login
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "doctor@hospital.gov.in",
    "password": "secure-password",
    "role": "DOCTOR"
  }'
```

### 2. Patient Registration
```bash
curl -X POST "http://localhost:8000/api/v1/patients" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Meena",
    "last_name": "Devi",
    "phone": "+919876543210",
    "abha_number": "91-2345-6789-0123",
    "date_of_birth": "1968-04-15",
    "gender": "FEMALE",
    "preferred_language": "hi"
  }'
```

### 3. Fetch Live OPD Queue
```bash
curl -X GET "http://localhost:8000/api/v1/encounters/queue?department=all"
```

### 4. Fetch FHIR R4 Bundle
```bash
curl -X POST "http://localhost:8000/api/v1/encounters/enc_meena_01/export/fhir" \
  -H "Content-Type: application/json" \
  -d '{"bundle_type": "DOCUMENT"}'
```
