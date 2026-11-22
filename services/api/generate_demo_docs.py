import os
from PIL import Image, ImageDraw, ImageFont

output_dir = r"c:\Users\mahim\OneDrive\Desktop\WEB DEV\MesioKisk\demo_documents"
os.makedirs(output_dir, exist_ok=True)

# 1. TEXT FILES
p1_text = """======================================================================
     ALL INDIA INSTITUTE OF AYURVEDA & AIIMS OPD CLINICAL SERVICES
             CENTRAL DISTRICT HOSPITAL & RESEARCH CENTRE
======================================================================
Outpatient Department (OPD) Consultation Card
OPD No: OPD-2026-001245                    Date: 12-Jan-2026
Patient Name: Meena Devi                    Age/Gender: 58 Yrs / Female
ABHA ID: 91-2345-6789-0123                  Contact: +91 98765 43210
Address: Meerut, Uttar Pradesh              Department: General Medicine

Vitals:
  * Blood Pressure: 152/94 mmHg (Elevated Stage 2 HTN)
  * Pulse Rate: 84 bpm (Regular)
  * Weight: 68 kg | Height: 154 cm | BMI: 28.7 kg/m2
  * Random Blood Glucose: 210 mg/dL

Clinical Diagnosis:
  1. Type 2 Diabetes Mellitus (Uncontrolled, duration ~6 yrs)
  2. Essential Hypertension (Grade II)
  3. Dyspepsia / GERD

Rx (Medication Prescribed):
----------------------------------------------------------------------
1. Tab Metformin Hydrochloride 500 mg
   Dose: 1 tablet Twice Daily (PO BD) - Immediately after morning & evening meals
   Quantity: 60 tablets (1 month supply)

2. Tab Telmisartan 40 mg
   Dose: 1 tablet Once Daily (PO OD) - Every morning at 8:00 AM
   Quantity: 30 tablets (1 month supply)

3. Tab Pantoprazole 40 mg
   Dose: 1 tablet Once Daily (PO OD) - 30 minutes before breakfast
   Quantity: 30 tablets (1 month supply)

Doctor Advice & Orders:
  * Low sodium (Namak kam) & low carbohydrate diabetic diet.
  * 30 minutes daily brisk walk.
  * Stat investigations ordered: Fasting Blood Sugar, PPBS, HbA1c, Serum Lipid Profile.
  * Review after 1 month with test reports.

Attending Physician:
Dr. A. K. Verma, MD (Internal Medicine)
Reg. No: MCI-48291 / DMC-2014
Senior Consultant Physician, AIIA OPD Block
======================================================================
"""

p2_text = """======================================================================
          CENTRAL PATHOLOGY & DIAGNOSTIC BIOCHEMISTRY LAB
               NATIONAL HEALTH ACCREDITED LABORATORY
======================================================================
Patient Name: Meena Devi                     Lab ID: LAB-2026-9941
Age/Gender: 58 Yrs / Female                  Collection Date: 14-Jan-2026
Referring Doctor: Dr. A. K. Verma, MD         Reporting Date: 14-Jan-2026
Specimen: Fasting Fluoride Plasma & Serum    Status: FINAL VERIFIED

BIOCHEMICAL INVESTIGATION REPORT:
-----------------------------------------------------------------------------------
TEST DESCRIPTION                  RESULT       UNITS      REFERENCE INTERVAL   FLAG
-----------------------------------------------------------------------------------
Fasting Blood Sugar (FBS)          168.0       mg/dL      70.0 - 100.0         HIGH
Post Prandial Blood Sugar (PPBS)   242.0       mg/dL      < 140.0              HIGH
HbA1c (Glycated Hemoglobin)         8.4         %          < 5.7 (Normal)       ELEVATED
                                                          5.7 - 6.4 (Prediabetes)
                                                          >= 6.5 (Diabetic)
Average Estimated Glucose (eAG)    194.0       mg/dL      ---                  ELEVATED

Serum Creatinine                   0.92        mg/dL      0.60 - 1.20          NORMAL
Blood Urea Nitrogen (BUN)          18.5        mg/dL      7.0 - 20.0           NORMAL
Total Cholesterol                  215.0       mg/dL      < 200.0              BORDERLINE
Serum Triglycerides                190.0       mg/dL      < 150.0              HIGH
HDL Cholesterol (Good)             39.0        mg/dL      > 50.0               LOW
LDL Cholesterol (Calculated)       138.0       mg/dL      < 100.0              HIGH
-----------------------------------------------------------------------------------

Clinical Impression:
  * Glycemic parameters indicate poor glycemic control (HbA1c 8.4%, FBS 168 mg/dL).
  * Mixed dyslipidemia with elevated triglycerides and LDL.
  * Renal function parameters (Serum Creatinine 0.92 mg/dL) within normal limits.

Checked By: S. Sharma, MSc (Biochem)
Reporting Pathologist:
Dr. R. K. Saxena, MD (Pathology)
Senior Consultant Biochemist & Lab Director
======================================================================
"""

p3_text = """======================================================================
             GOVERNMENT COMMUNITY HEALTH CENTRE & POLICLINIC
                     OPD PRESCRIBER CONSULTATION SLIP
======================================================================
Date: 18-Feb-2026                            OPD Slip No: G-10842
Patient Name: Rajesh Kumar                   Age / Gender: 34 Yrs / Male
Phone: +91 94123 45678                       Department: General Medicine

Vitals:
  * Temperature: 102.4 F (Oral)
  * Blood Pressure: 122/82 mmHg
  * SpO2: 98% on room air
  * Pulse: 96 bpm

Chief Complaint:
  * High fever with chills for 3 days
  * Severe body ache, sore throat, and dry cough

Diagnosis:
  * Acute Viral Upper Respiratory Tract Infection (URTI) with High Grade Pyrexia

Rx:
----------------------------------------------------------------------
1. Tab Paracetamol 650 mg (PO TDS)
   Take 1 tablet thrice daily after food x 4 days (SOS for temp > 100 F)

2. Tab Amoxicillin + Clavulanic Acid 625 mg (PO BD)
   Take 1 tablet twice daily after meals x 5 days (Morning & Night)

3. Syp Levocetirizine + Montelukast
   Take 10 ml once daily at bedtime x 5 days

4. ORS Hydration Sachet - Dissolve in 1 liter clean water, sip throughout day

Doctor Advice:
  * Plenty of warm fluids and steam inhalation twice daily.
  * Return if fever persists beyond 3 days or if breathlessness occurs.

Consulting Medical Officer:
Dr. S. K. Gupta, MBBS
Medical Officer, CHC Health Centre
======================================================================
"""

with open(os.path.join(output_dir, "prescription_meena_devi.txt"), "w", encoding="utf-8") as f:
    f.write(p1_text)

with open(os.path.join(output_dir, "lab_report_blood_sugar_lipid.txt"), "w", encoding="utf-8") as f:
    f.write(p2_text)

with open(os.path.join(output_dir, "prescription_general_fever.txt"), "w", encoding="utf-8") as f:
    f.write(p3_text)

print("Text files written successfully.")

# 2. IMAGE GENERATION (High-res clean simulated hospital sheets)
def render_sheet_image(title, subtitle, sections, filename, header_color=(13, 148, 136)):
    width = 1200
    height = 1500
    img = Image.new("RGB", (width, height), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Header Bar
    draw.rectangle([0, 0, width, 130], fill=header_color)
    draw.text((40, 25), title, fill=(255, 255, 255), font=None)
    draw.text((40, 75), subtitle, fill=(220, 252, 231), font=None)

    # Border
    draw.rectangle([20, 20, width - 20, height - 20], outline=header_color, width=3)

    y = 160
    for header, content in sections:
        # Section Header
        draw.rectangle([40, y, width - 40, y + 36], fill=(241, 245, 249))
        draw.text((50, y + 10), header, fill=(30, 41, 59))
        y += 48

        # Section Content
        lines = content.strip().split("\n")
        for line in lines:
            if line.startswith("•") or line.startswith("*") or line.startswith("1.") or line.startswith("2.") or line.startswith("3."):
                draw.text((60, y), line, fill=(15, 23, 42))
            elif "HIGH" in line or "ELEVATED" in line:
                draw.text((60, y), line, fill=(185, 28, 28))
            else:
                draw.text((60, y), line, fill=(51, 65, 85))
            y += 26
        y += 20

    # Footer
    draw.line([40, height - 90, width - 40, height - 90], fill=(203, 213, 225), width=2)
    draw.text((50, height - 70), "Official Clinical Record • Verified by MediKiosk Intake Module • Ayushman Bharat Digital Mission (ABDM)", fill=(100, 116, 139))

    img.save(os.path.join(output_dir, filename), "PNG", quality=95)
    print(f"Generated {filename}")

# Generate Prescription 1 (Meena Devi)
render_sheet_image(
    "ALL INDIA INSTITUTE OF AYURVEDA & AIIMS OPD CLINICAL SERVICES",
    "Central District Hospital • Outpatient Medical Intake Prescription Slip",
    [
        ("PATIENT IDENTIFICATION & VITALS",
         "Patient Name: Meena Devi                   Age / Gender: 58 Yrs / Female\n"
         "OPD Token: A-042                           Encounter No: OPD-2026-001245\n"
         "ABHA ID: 91-2345-6789-0123                 Date of Visit: 12-Jan-2026\n"
         "Blood Pressure: 152/94 mmHg (Elevated)     Pulse: 84 bpm | Weight: 68 kg | BMI: 28.7"),
        ("CLINICAL DIAGNOSIS & CHIEF COMPLAINT",
         "• Type 2 Diabetes Mellitus (Duration 6 years, uncontrolled)\n"
         "• Essential Hypertension (Stage II)\n"
         "• Chronic Dyspepsia and intermittent epigastric burning"),
        ("Rx - PRESCRIBED MEDICATIONS",
         "1. Tab Metformin 500 mg (PO BD)\n"
         "   Take 1 tablet twice daily after meals (Morning & Night) x 30 days\n"
         "2. Tab Telmisartan 40 mg (PO OD)\n"
         "   Take 1 tablet once daily morning after breakfast x 30 days\n"
         "3. Tab Pantoprazole 40 mg (PO OD)\n"
         "   Take 1 tablet once daily in morning 30 minutes before food x 30 days"),
        ("PHYSICIAN ADVICE & INVESTIGATIONS ORDERED",
         "• Mandatory Fasting Blood Sugar (FBS) & HbA1c Lab Panel\n"
         "• Low salt & diabetic balanced diet\n"
         "• 30 minutes brisk morning walk\n"
         "• Review in OPD Room 104 with test reports after 4 weeks"),
        ("ATTENDING MEDICAL PRACTITIONER SIGN-OFF",
         "Dr. A. K. Verma, MD (Senior Physician)\n"
         "Department of Internal Medicine & Clinical Ayush Integration\n"
         "Registration No: MCI-48291 / DMC-2014")
    ],
    "prescription_meena_devi.png",
    header_color=(13, 148, 136)
)

# Generate Lab Report (Meena Devi)
render_sheet_image(
    "CENTRAL CLINICAL PATHOLOGY & BIOCHEMICAL LABORATORY",
    "NABL Accredited Diagnostics • Automated Serum Biochemistry Report",
    [
        ("PATIENT & SAMPLE SPECIMEN DETAILS",
         "Patient Name: Meena Devi                   Age / Gender: 58 Yrs / Female\n"
         "Lab Sample ID: LAB-2026-9941               Collection Date: 14-Jan-2026\n"
         "Referring Doctor: Dr. A. K. Verma, MD      Report Status: FINAL VERIFIED\n"
         "Specimen Type: Fluoride Plasma & Clotted Blood Serum (Fasting 10 Hours)"),
        ("GLYCEMIC CONTROL & DIABETIC PROFILE",
         "• Fasting Blood Sugar (FBS):       168 mg/dL    [HIGH]       (Ref: 70 - 100 mg/dL)\n"
         "• Post Prandial Sugar (PPBS):      242 mg/dL    [HIGH]       (Ref: < 140 mg/dL)\n"
         "• HbA1c (Glycated Hemoglobin):     8.4 %        [ELEVATED]   (Ref: Normal < 5.7 %, Diabetic >= 6.5 %)\n"
         "• Estimated Average Glucose (eAG): 194 mg/dL    [ELEVATED]"),
        ("LIPID & RENAL FUNCTION PANEL",
         "• Serum Creatinine:                0.92 mg/dL   [NORMAL]     (Ref: 0.60 - 1.20 mg/dL)\n"
         "• Blood Urea Nitrogen (BUN):       18.5 mg/dL   [NORMAL]     (Ref: 7.0 - 20.0 mg/dL)\n"
         "• Total Cholesterol:               215 mg/dL    [BORDERLINE] (Ref: < 200 mg/dL)\n"
         "• Serum Triglycerides:             190 mg/dL    [HIGH]       (Ref: < 150 mg/dL)\n"
         "• HDL Cholesterol (Good):          39 mg/dL     [LOW]        (Ref: > 50 mg/dL)\n"
         "• LDL Cholesterol:                 138 mg/dL    [HIGH]       (Ref: < 100 mg/dL)"),
        ("LABORATORY INTERPRETATION & SIGN-OFF",
         "Impression: Findings consistent with uncontrolled Type 2 Diabetes with secondary dyslipidemia.\n"
         "Renal function is currently preserved.\n"
         "Reporting Pathologist: Dr. R. K. Saxena, MD (Pathology), Lab Director")
    ],
    "lab_report_blood_sugar_lipid.png",
    header_color=(30, 64, 175)
)

print("All demo medical documents and images generated successfully.")
