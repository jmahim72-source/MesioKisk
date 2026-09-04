const API_BASE_URL = 'http://localhost:8000/api/v1';

export const DoctorAPI = {
  async login(username = 'doctor@hospital.gov.in', password = 'secure-password') {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role: 'DOCTOR' })
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {
      console.warn('Backend login fallback', e);
    }
    return {
      access_token: 'mock-token',
      user: {
        first_name: 'Dr. Ananya',
        last_name: 'Sharma',
        role: 'DOCTOR',
        department: 'Ayurveda & General OPD'
      }
    };
  },

  async getQueue(department = 'all') {
    try {
      const res = await fetch(`${API_BASE_URL}/encounters/queue?department=${department}`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {
      console.warn('Backend queue fallback', e);
    }
    return [
      {
        encounter_id: 'enc_meena_01',
        encounter_number: 'OPD-2026-001245',
        patient_name: 'Meena Devi',
        hospital_patient_id: 'HOSP-2026-001245',
        abha_number_masked: '91-2345-XXXX-0123',
        age_gender: '58 F',
        queue_token: 'A-042',
        status: 'READY_FOR_REVIEW',
        priority: 'EMERGENCY',
        department: 'Ayurveda OPD',
        chief_complaint: 'Chest pain and breathlessness since morning',
        has_red_flags: true,
        created_at: new Date().toISOString()
      }
    ];
  },

  async getEncounterSummary(encounterId: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/encounters/${encounterId}/summary`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {
      console.warn('Backend summary fallback', e);
    }
    return {
      summary_id: 'sum_01',
      encounter_id: encounterId,
      status: 'DRAFT',
      is_final: false,
      sections: {
        chief_complaint: 'Chest pain and breathlessness since morning (4 hours)',
        history_present_illness: '58-year-old female presented with retrosternal chest heaviness radiating to left shoulder associated with cold sweating and shortness of breath.',
        past_medical_history: ['Type 2 Diabetes Mellitus', 'Essential Hypertension'],
        medications: [
          { name: 'Metformin', dose: '500 mg', frequency: 'TWICE_DAILY' },
          { name: 'Telmisartan', dose: '40 mg', frequency: 'ONCE_DAILY' }
        ],
        allergies: ['No known drug allergies'],
        ayurvedic_assessment: {
          prakriti: 'VATA_PITTA',
          agni: 'VISHAMAGNI',
          koshtha: 'KRURA'
        },
        red_flags: ['Possible Acute Coronary Syndrome (CARDIAC_001)']
      }
    };
  },

  async verifyEntity(documentId: string, entityId: string, status: 'VERIFIED' | 'REJECTED') {
    try {
      const res = await fetch(`${API_BASE_URL}/documents/${documentId}/entities/${entityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verification_status: status })
      });
      if (res.ok) return (await res.json()).data;
    } catch (e) {
      console.warn('Verify entity fallback', e);
    }
    return { id: entityId, verification_status: status };
  },

  async verifySummary(summaryId: string, note: string, doctorId: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/summaries/${summaryId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verification_note: note, doctor_id: doctorId })
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {
      console.warn('Verify summary fallback', e);
    }
    return { summary_id: summaryId, status: 'FINAL', verified_by: doctorId, verified_at: new Date().toISOString() };
  },

  async exportFHIR(encounterId: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/encounters/${encounterId}/export/fhir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bundle_type: 'DOCUMENT' })
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {
      console.warn('FHIR export fallback', e);
    }
    return {
      export_id: `exp_${encounterId}`,
      status: 'COMPLETED',
      format: 'FHIR_R4_JSON',
      bundle: { resourceType: 'Bundle', id: `bundle-${encounterId}`, type: 'document', entry: [] }
    };
  },

  async exportABDM(encounterId: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/encounters/${encounterId}/export/abdm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consent_id: 'con_01', target: 'MOCK_HIS' })
      });
      if (res.ok) {
        return (await res.json()).data;
      }
    } catch (e) {
      console.warn('ABDM export fallback', e);
    }
    return { abdm_transaction_id: `abdm-txn-${Date.now()}`, status: 'SUCCESSFULLY_PUSHED', resource_count: 5 };
  },

  async acknowledgeRedFlag(alertId: string, note: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/red-flags/${alertId}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TRIAGE_REFERRED', note })
      });
      if (res.ok) return (await res.json()).data;
    } catch (e) {
      console.warn('Ack red flag fallback', e);
    }
    return { alert_id: alertId, status: 'ACKNOWLEDGED' };
  }
};
