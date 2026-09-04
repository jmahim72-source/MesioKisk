export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'TRANSGENDER';
export type EncounterType = 'OPD' | 'EMERGENCY' | 'FOLLOW_UP';
export type EncounterStatus = 'ARRIVED' | 'INTAKE_IN_PROGRESS' | 'READY_FOR_REVIEW' | 'IN_CONSULTATION' | 'COMPLETED' | 'CANCELLED';
export type TriagePriority = 'ROUTINE' | 'PRIORITY' | 'EMERGENCY';
export type RedFlagSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RedFlagStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'FALSE_POSITIVE';
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EDITED';
export type ConsentStatus = 'GRANTED' | 'DENIED' | 'PARTIALLY_GRANTED' | 'REVOKED';
export type Language = 'hi' | 'en' | 'ta' | 'te' | 'bn' | 'mr';

export interface Patient {
  id: string;
  abha_number?: string;
  abha_number_masked?: string;
  abha_health_id?: string;
  hospital_patient_id: string;
  first_name: string;
  last_name?: string;
  full_name: string;
  date_of_birth?: string;
  gender: Gender;
  phone: string;
  email?: string;
  preferred_language: Language;
  is_low_literacy?: boolean;
  requires_assistance?: boolean;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    district?: string;
    state?: string;
    pincode?: string;
  };
  emergency_contact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  created_at: string;
}

export interface Consent {
  id: string;
  patient_id: string;
  encounter_id?: string;
  purpose: string;
  data_categories: string[];
  language: Language;
  method: string;
  status: ConsentStatus;
  granted_at: string;
  valid_until?: string;
}

export interface Encounter {
  id: string;
  patient_id: string;
  encounter_number: string;
  encounter_date: string;
  encounter_type: EncounterType;
  department: string;
  practitioner_id?: string;
  queue_token: string;
  status: EncounterStatus;
  priority: TriagePriority;
  chief_complaint_hint?: string;
  created_at: string;
}

export interface QuestionOption {
  value: string | number;
  label: string;
  localized_label?: Record<string, string>;
  icon?: string;
}

export interface InterviewQuestion {
  id: string;
  category: 'chief_complaint' | 'hpi' | 'past_history' | 'medication' | 'allergy' | 'ayurvedic' | 'vitals';
  section: string;
  text: string;
  localized_text: Record<string, string>;
  audio_prompt_text?: Record<string, string>;
  input_type: 'VOICE_OR_TEXT' | 'SCALE' | 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'DATE' | 'NUMERIC' | 'FACES_SCALE';
  options?: QuestionOption[];
  required: boolean;
  next_question_map?: Record<string, string>;
}

export interface InterviewResponse {
  id: string;
  session_id: string;
  question_id: string;
  input_type: string;
  raw_text?: string;
  normalized_answer?: Record<string, any>;
  confidence?: number;
  requires_verification?: boolean;
  verified_by_doctor?: boolean;
}

export interface AyurvedicAssessment {
  id: string;
  encounter_id: string;
  prakriti_dominant_dosha?: string;
  prakriti_vata_score?: number;
  prakriti_pitta_score?: number;
  prakriti_kapha_score?: number;
  vikriti_dominant_dosha?: string;
  agni_type?: 'VISHAMAGNI' | 'TIKSHNAGNI' | 'MANDAGNI' | 'SAMAGNI';
  koshtha_type?: 'KRURA' | 'MADHYAMA' | 'MRIDU';
  ahara_vihara_notes?: string;
}

export interface ExtractedEntity {
  id: string;
  document_id: string;
  encounter_id: string;
  type: 'MEDICATION' | 'DIAGNOSIS' | 'LAB_TEST' | 'OBSERVATION' | 'ALLERGY';
  subtype?: string;
  raw_text: string;
  normalized: Record<string, any>;
  confidence: number;
  verification_status: VerificationStatus;
  source_snippet?: string;
}

export interface ClinicalSummary {
  id: string;
  encounter_id: string;
  version: number;
  status: 'DRAFT' | 'FINAL';
  sections: {
    chief_complaint: string;
    history_present_illness: string;
    past_medical_history: string[];
    medications: Array<{ name: string; dose?: string; frequency?: string; duration?: string }>;
    allergies: string[];
    ayurvedic_assessment?: Record<string, any>;
    red_flags: string[];
  };
  source_references?: Array<{
    section: string;
    source_type: 'INTERVIEW' | 'DOCUMENT';
    source_id: string;
  }>;
  doctor_notes?: string;
  doctor_id?: string;
  verified_at?: string;
  generated_at: string;
}

export interface RedFlagAlert {
  id: string;
  encounter_id: string;
  rule_id: string;
  alert_type: string;
  severity: RedFlagSeverity;
  status: RedFlagStatus;
  triggered_symptoms: string[];
  suggested_action: string;
  clinical_context?: string;
  created_at: string;
}
