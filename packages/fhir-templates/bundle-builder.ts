export interface FHIRResource {
  resourceType: string;
  id: string;
  [key: string]: any;
}

export interface FHIRBundle {
  resourceType: 'Bundle';
  id: string;
  meta: {
    lastUpdated: string;
    profile?: string[];
  };
  type: 'document' | 'collection' | 'transaction';
  entry: Array<{
    fullUrl: string;
    resource: FHIRResource;
  }>;
}

export function buildFHIRPatient(patient: {
  id: string;
  abha_number?: string;
  hospital_patient_id: string;
  first_name: string;
  last_name?: string;
  date_of_birth?: string;
  gender: string;
  phone?: string;
}): FHIRResource {
  return {
    resourceType: 'Patient',
    id: patient.id,
    identifier: [
      {
        system: 'https://healthid.abdm.gov.in',
        value: patient.abha_number || 'UNKNOWN'
      },
      {
        system: 'https://hospital.gov.in/patient-id',
        value: patient.hospital_patient_id
      }
    ],
    name: [
      {
        use: 'official',
        given: [patient.first_name],
        family: patient.last_name || ''
      }
    ],
    gender: (patient.gender || 'unknown').toLowerCase(),
    birthDate: patient.date_of_birth || '1970-01-01',
    telecom: patient.phone
      ? [{ system: 'phone', value: patient.phone, use: 'mobile' }]
      : []
  };
}

export function buildFHIREncounter(encounter: {
  id: string;
  patient_id: string;
  encounter_date: string;
  department: string;
  status: string;
}): FHIRResource {
  return {
    resourceType: 'Encounter',
    id: encounter.id,
    status: 'finished',
    class: {
      system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
      code: 'AMB',
      display: 'ambulatory'
    },
    subject: {
      reference: `Patient/${encounter.patient_id}`
    },
    serviceType: {
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: '408443003',
          display: encounter.department || 'General OPD'
        }
      ]
    },
    period: {
      start: `${encounter.encounter_date}T09:00:00Z`
    }
  };
}

export function buildFHIRClinicalSummaryBundle(data: {
  patient: any;
  encounter: any;
  summary: any;
  extractedEntities?: any[];
}): FHIRBundle {
  const timestamp = new Date().toISOString();
  const bundleId = `bundle-${data.encounter.id || '001'}`;

  const patientResource = buildFHIRPatient(data.patient);
  const encounterResource = buildFHIREncounter(data.encounter);

  const conditionResources: FHIRResource[] = (data.summary.sections?.past_medical_history || []).map(
    (condition: string, index: number) => ({
      resourceType: 'Condition',
      id: `cond-${index + 1}`,
      clinicalStatus: {
        coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }]
      },
      subject: { reference: `Patient/${data.patient.id}` },
      code: { text: condition }
    })
  );

  const medicationResources: FHIRResource[] = (data.summary.sections?.medications || []).map(
    (med: any, index: number) => ({
      resourceType: 'MedicationRequest',
      id: `med-${index + 1}`,
      status: 'active',
      intent: 'order',
      medicationCodeableConcept: { text: typeof med === 'string' ? med : `${med.name} ${med.dose || ''} ${med.frequency || ''}`.trim() },
      subject: { reference: `Patient/${data.patient.id}` }
    })
  );

  const compositionResource: FHIRResource = {
    resourceType: 'Composition',
    id: `comp-${data.encounter.id}`,
    status: 'final',
    type: {
      coding: [{ system: 'http://loinc.org', code: '11488-4', display: 'Consultation note' }]
    },
    subject: { reference: `Patient/${data.patient.id}` },
    encounter: { reference: `Encounter/${data.encounter.id}` },
    date: timestamp,
    title: 'MediKiosk Clinical Intake Summary',
    section: [
      {
        title: 'Chief Complaint & HPI',
        text: {
          status: 'generated',
          div: `<div xmlns="http://www.w3.org/1999/xhtml"><p><strong>Chief Complaint:</strong> ${data.summary.sections?.chief_complaint || 'None'}</p><p>${data.summary.sections?.history_present_illness || ''}</p></div>`
        }
      },
      {
        title: 'Ayurvedic Assessment',
        text: {
          status: 'generated',
          div: `<div xmlns="http://www.w3.org/1999/xhtml"><p><strong>Prakriti:</strong> ${data.summary.sections?.ayurvedic_assessment?.prakriti || 'N/A'}</p><p><strong>Agni:</strong> ${data.summary.sections?.ayurvedic_assessment?.agni || 'N/A'}</p></div>`
        }
      }
    ]
  };

  const allResources = [
    compositionResource,
    patientResource,
    encounterResource,
    ...conditionResources,
    ...medicationResources
  ];

  return {
    resourceType: 'Bundle',
    id: bundleId,
    meta: {
      lastUpdated: timestamp,
      profile: ['https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle']
    },
    type: 'document',
    entry: allResources.map(res => ({
      fullUrl: `urn:uuid:${res.id}`,
      resource: res
    }))
  };
}
