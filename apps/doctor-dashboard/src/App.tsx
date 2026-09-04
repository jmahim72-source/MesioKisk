import React, { useState, useEffect } from 'react';
import {
  HeartPulse, Users, AlertTriangle, FileCheck, CheckCircle2, XCircle,
  Download, Send, Eye, ShieldAlert, Sparkles, Stethoscope, RefreshCw,
  Clock, ArrowRight, Activity, FileText, Check, ChevronRight
} from 'lucide-react';
import { DoctorAPI } from './services/api';

type ViewMode = 'QUEUE' | 'WORKSPACE' | 'FHIR_EXPORT' | 'AUDIT_LOGS';

export function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('QUEUE');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [queue, setQueue] = useState<any[]>([]);
  const [selectedEncounter, setSelectedEncounter] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Verification state
  const [verifiedEntities, setVerifiedEntities] = useState<Record<string, 'VERIFIED' | 'REJECTED'>>({
    ent_01: 'VERIFIED',
    ent_02: 'VERIFIED'
  });
  const [doctorNotes, setDoctorNotes] = useState<string>('Patient confirmed acute retrosternal chest pain with left arm radiation. Stat 12-lead ECG ordered.');
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [fhirBundle, setFhirBundle] = useState<any>(null);
  const [showFhirModal, setShowFhirModal] = useState<boolean>(false);
  const [abdmPushed, setAbdmPushed] = useState<boolean>(false);

  useEffect(() => {
    loadQueue();
  }, [departmentFilter]);

  const loadQueue = async () => {
    setLoading(true);
    const data = await DoctorAPI.getQueue(departmentFilter);
    setQueue(data);
    setLoading(false);
  };

  const openEncounter = async (enc: any) => {
    setSelectedEncounter(enc);
    setLoading(true);
    const sumData = await DoctorAPI.getEncounterSummary(enc.encounter_id);
    setSummary(sumData);
    setIsVerified(sumData.is_final || false);
    setCurrentView('WORKSPACE');
    setLoading(false);
  };

  const handleVerifyEntity = async (entId: string, status: 'VERIFIED' | 'REJECTED') => {
    setVerifiedEntities(prev => ({ ...prev, [entId]: status }));
  };

  const handleFinalVerification = async () => {
    if (!summary) return;
    const res = await DoctorAPI.verifySummary(
      summary.summary_id,
      doctorNotes,
      'Dr. Ananya Sharma, MD (Senior Consultant)'
    );
    setIsVerified(true);
    alert('Clinical record verified and signed off successfully.');
  };

  const handleOpenFhir = async () => {
    if (!selectedEncounter) return;
    const res = await DoctorAPI.exportFHIR(selectedEncounter.encounter_id);
    setFhirBundle(res.bundle);
    setShowFhirModal(true);
  };

  const handlePushABDM = async () => {
    if (!selectedEncounter) return;
    const res = await DoctorAPI.exportABDM(selectedEncounter.encounter_id);
    setAbdmPushed(true);
    alert(`Successfully pushed to ABDM Gateway. Transaction ID: ${res.abdm_transaction_id}`);
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-badge">
            <HeartPulse size={26} />
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: 'white' }}>MediKiosk</div>
            <div style={{ fontSize: '12px', color: 'var(--text-sidebar)' }}>Physician Portal v1.0</div>
          </div>
        </div>

        <nav style={{ flex: 1 }}>
          <button
            className={`nav-item ${currentView === 'QUEUE' ? 'active' : ''}`}
            onClick={() => setCurrentView('QUEUE')}
          >
            <Users size={18} />
            <span>OPD Queue ({queue.length})</span>
          </button>

          {selectedEncounter && (
            <button
              className={`nav-item ${currentView === 'WORKSPACE' ? 'active' : ''}`}
              onClick={() => setCurrentView('WORKSPACE')}
            >
              <Stethoscope size={18} />
              <span>Clinical Workspace</span>
            </button>
          )}

          <button
            className={`nav-item ${currentView === 'FHIR_EXPORT' ? 'active' : ''}`}
            onClick={() => {
              if (selectedEncounter) handleOpenFhir();
              else alert('Please select a patient from the OPD queue first.');
            }}
          >
            <FileCheck size={18} />
            <span>FHIR R4 / ABDM</span>
          </button>

          <button
            className={`nav-item ${currentView === 'AUDIT_LOGS' ? 'active' : ''}`}
            onClick={() => setCurrentView('AUDIT_LOGS')}
          >
            <Activity size={18} />
            <span>Audit & Compliance</span>
          </button>
        </nav>

        <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>Dr. Ananya Sharma</div>
          <div style={{ fontSize: '12px', color: 'var(--text-sidebar)' }}>AIIA Delhi • Room 104</div>
          <div style={{ fontSize: '11px', color: '#34d399', marginTop: '6px' }}>● Online & Authorized</div>
        </div>
      </aside>

      {/* Main Area */}
      <main className="main-content">
        <header className="top-nav">
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800' }}>
              {currentView === 'QUEUE' && 'Live OPD Patient Queue'}
              {currentView === 'WORKSPACE' && 'Clinical Summary Review & Verification'}
              {currentView === 'FHIR_EXPORT' && 'FHIR R4 Interoperability Gateway'}
              {currentView === 'AUDIT_LOGS' && 'System Audit Trail & HIPAA Logs'}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              All India Institute of Ayurveda • Ministry of Ayush • OPD Shift 1
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button className="btn btn-secondary" onClick={loadQueue}>
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </header>

        <div className="content-body">
          {/* VIEW 1: OPD QUEUE */}
          {currentView === 'QUEUE' && (
            <div>
              {/* Emergency Banner if red flag exists in queue */}
              {queue.some(q => q.has_red_flags) && (
                <div style={{ background: '#fef2f2', border: '1px solid #f87171', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <AlertTriangle color="var(--danger)" size={28} />
                    <div>
                      <div style={{ fontWeight: '800', color: 'var(--danger)', fontSize: '16px' }}>
                        CRITICAL EMERGENCY TRIAGE ALERT
                      </div>
                      <div style={{ fontSize: '14px', color: '#991b1b' }}>
                        Patient Meena Devi (Token: A-042) flagged for possible Acute Coronary Syndrome.
                      </div>
                    </div>
                  </div>
                  <button
                    className="btn btn-danger"
                    onClick={() => openEncounter(queue[0])}
                  >
                    Open Stat Encounter <ArrowRight size={16} />
                  </button>
                </div>
              )}

              {/* Department Filters */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                {['all', 'Ayurveda', 'General Medicine'].map((dept) => (
                  <button
                    key={dept}
                    className={`btn ${departmentFilter === dept ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setDepartmentFilter(dept)}
                    style={{ fontSize: '14px', padding: '8px 16px' }}
                  >
                    {dept === 'all' ? 'All Departments' : dept}
                  </button>
                ))}
              </div>

              {/* Table */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Token</th>
                      <th>Patient Details</th>
                      <th>ABHA ID</th>
                      <th>Department</th>
                      <th>Chief Complaint</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queue.map((enc) => (
                      <tr key={enc.encounter_id} onClick={() => openEncounter(enc)}>
                        <td>
                          <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary)' }}>
                            {enc.queue_token}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: '700' }}>{enc.patient_name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {enc.age_gender} • {enc.hospital_patient_id}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '13px', fontFamily: 'monospace' }}>
                            {enc.abha_number_masked || 'N/A'}
                          </span>
                        </td>
                        <td>{enc.department}</td>
                        <td style={{ maxWidth: '260px' }}>
                          <div style={{ fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {enc.chief_complaint}
                          </div>
                        </td>
                        <td>
                          <span className={`badge badge-${(enc.priority || 'routine').toLowerCase()}`}>
                            {enc.priority}
                          </span>
                        </td>
                        <td>
                          <span className="badge" style={{ background: '#ecfdf5', color: 'var(--primary-dark)' }}>
                            {enc.status}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '13px' }}>
                            Review <ChevronRight size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 2: CLINICAL WORKSPACE */}
          {currentView === 'WORKSPACE' && selectedEncounter && summary && (
            <div>
              {/* Patient Banner */}
              <div className="card" style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '800' }}>{selectedEncounter.patient_name}</h2>
                    <span className="badge" style={{ background: 'var(--primary)', color: 'white' }}>
                      Token: {selectedEncounter.queue_token}
                    </span>
                    <span className="badge badge-emergency">
                      {selectedEncounter.priority}
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', opacity: 0.8, marginTop: '4px' }}>
                    ABHA: {selectedEncounter.abha_number_masked} • Hospital ID: {selectedEncounter.hospital_patient_id} • 58 Yrs / Female
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn btn-secondary" onClick={handleOpenFhir} style={{ background: 'white' }}>
                    <FileCheck size={16} /> View FHIR R4
                  </button>
                  <button className="btn btn-primary" onClick={handlePushABDM}>
                    <Send size={16} /> Push to ABDM
                  </button>
                </div>
              </div>

              {/* Workspace Split Columns */}
              <div className="workspace-grid">
                {/* Left Column: AI Summary */}
                <div>
                  <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sparkles color="var(--primary)" size={20} /> AI Clinical Intake Summary
                      </h3>
                      <span className="badge badge-routine">Draft v1 (AI-Generated)</span>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>CHIEF COMPLAINT</div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#991b1b', background: '#fef2f2', padding: '10px', borderRadius: '8px', marginTop: '4px' }}>
                        {summary.sections?.chief_complaint}
                      </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>HISTORY OF PRESENT ILLNESS</div>
                      <div style={{ fontSize: '15px', lineHeight: '1.6', marginTop: '4px', background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                        {summary.sections?.history_present_illness}
                      </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>PAST MEDICAL HISTORY</div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                        {(summary.sections?.past_medical_history || []).map((pm: string, i: number) => (
                          <span key={i} className="badge badge-priority" style={{ fontSize: '13px', padding: '6px 12px' }}>
                            {pm}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Ayurvedic Assessment */}
                    <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '12px', border: '1px solid #bbf7d0', marginBottom: '16px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--primary-dark)', marginBottom: '8px' }}>
                        🌿 Ayurvedic Profile (दशविध परीक्षा)
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', fontSize: '13px' }}>
                        <div><strong>Prakriti:</strong> {summary.sections?.ayurvedic_assessment?.prakriti || 'VATA_PITTA'}</div>
                        <div><strong>Agni:</strong> {summary.sections?.ayurvedic_assessment?.agni || 'VISHAMAGNI'}</div>
                        <div><strong>Koshtha:</strong> {summary.sections?.ayurvedic_assessment?.koshtha || 'KRURA'}</div>
                      </div>
                    </div>

                    {/* Doctor Clinical Notes */}
                    <div style={{ marginTop: '20px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px' }}>
                        DOCTOR CLINICAL NOTES & VERIFICATION
                      </label>
                      <textarea
                        rows={3}
                        value={doctorNotes}
                        onChange={(e) => setDoctorNotes(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '14px' }}
                      />
                    </div>

                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                      <button
                        className={`btn ${isVerified ? 'btn-success' : 'btn-primary'}`}
                        onClick={handleFinalVerification}
                        style={{ padding: '12px 24px', fontSize: '16px' }}
                      >
                        <CheckCircle2 size={18} />
                        {isVerified ? 'Record Verified & Signed (Dr. Sharma)' : 'Sign-Off & Clinically Verify'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column: OCR Documents & Entity Verification */}
                <div>
                  <div className="card">
                    <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText color="var(--secondary)" size={20} /> Uploaded Document & Extracted Entities
                    </h3>

                    {/* Extracted Entities List */}
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '10px' }}>
                        EXTRACTED MEDICATIONS & LAB VALUES (OCR + NLP)
                      </div>

                      <div className="entity-row">
                        <div>
                          <div style={{ fontWeight: '700' }}>Metformin 500 mg (PO BD)</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Confidence: 95% • Source: Rx Line 1</div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className={`btn ${verifiedEntities.ent_01 === 'VERIFIED' ? 'btn-success' : 'btn-secondary'}`}
                            style={{ padding: '6px 10px', fontSize: '12px' }}
                            onClick={() => handleVerifyEntity('ent_01', 'VERIFIED')}
                          >
                            <Check size={14} /> Accept
                          </button>
                          <button
                            className={`btn ${verifiedEntities.ent_01 === 'REJECTED' ? 'btn-danger' : 'btn-secondary'}`}
                            style={{ padding: '6px 10px', fontSize: '12px' }}
                            onClick={() => handleVerifyEntity('ent_01', 'REJECTED')}
                          >
                            <XCircle size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="entity-row">
                        <div>
                          <div style={{ fontWeight: '700' }}>Telmisartan 40 mg (PO OD)</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Confidence: 92% • Source: Rx Line 2</div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className={`btn ${verifiedEntities.ent_02 === 'VERIFIED' ? 'btn-success' : 'btn-secondary'}`}
                            style={{ padding: '6px 10px', fontSize: '12px' }}
                            onClick={() => handleVerifyEntity('ent_02', 'VERIFIED')}
                          >
                            <Check size={14} /> Accept
                          </button>
                          <button
                            className={`btn ${verifiedEntities.ent_02 === 'REJECTED' ? 'btn-danger' : 'btn-secondary'}`}
                            style={{ padding: '6px 10px', fontSize: '12px' }}
                            onClick={() => handleVerifyEntity('ent_02', 'REJECTED')}
                          >
                            <XCircle size={14} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Scanned Document Preview Box */}
                    <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>
                        DOCUMENT OCR TEXT (prescription_jan_2026.jpg)
                      </div>
                      <pre style={{ fontSize: '12px', background: '#1e293b', color: '#e2e8f0', padding: '14px', borderRadius: '8px', overflowX: 'auto', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
{`AIIMS OPD / District Hospital Meerut
Patient: Meena Devi, 58 F | Date: 12-Jan-2026
Rx:
1. Tab Metformin 500mg PO BD x 1 month (After meals)
2. Tab Telmisartan 40mg PO OD (Morning)
3. Tab Pantoprazole 40mg PO OD (Before breakfast)
Diagnosis: Type 2 Diabetes Mellitus, Essential Hypertension`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: AUDIT & COMPLIANCE LOGS */}
          {currentView === 'AUDIT_LOGS' && (
            <div className="card">
              <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px' }}>
                HIPAA & DPDP Act 2023 Tamper-Evident Audit Trail
              </h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Event Category</th>
                    <th>Action</th>
                    <th>Actor / Role</th>
                    <th>Audit Details</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontSize: '13px', fontFamily: 'monospace' }}>2026-09-04T10:05:00Z</td>
                    <td><span className="badge badge-routine">CONSENT</span></td>
                    <td>CREATE</td>
                    <td>PATIENT (Kiosk)</td>
                    <td>Audio-guided DPDP consent granted for OPD intake session.</td>
                  </tr>
                  <tr>
                    <td style={{ fontSize: '13px', fontFamily: 'monospace' }}>2026-09-04T10:20:00Z</td>
                    <td><span className="badge badge-emergency">EMERGENCY</span></td>
                    <td>TRIGGER</td>
                    <td>RULE ENGINE</td>
                    <td>CARDIAC_001 emergency alert generated for token A-042.</td>
                  </tr>
                  <tr>
                    <td style={{ fontSize: '13px', fontFamily: 'monospace' }}>2026-09-04T10:40:00Z</td>
                    <td><span className="badge badge-verified">VERIFY</span></td>
                    <td>UPDATE</td>
                    <td>Dr. Ananya Sharma</td>
                    <td>Clinical draft verified and signed off with doctor credentials.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* FHIR R4 Bundle Modal */}
      {showFhirModal && fhirBundle && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '800' }}>HL7 FHIR R4 Bundle Inspector (ABDM Ready)</h3>
              <button className="btn btn-secondary" onClick={() => setShowFhirModal(false)}>Close</button>
            </div>

            <div style={{ marginBottom: '16px', display: 'flex', gap: '10px' }}>
              <button
                className="btn btn-primary"
                onClick={() => {
                  const blob = new Blob([JSON.stringify(fhirBundle, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `fhir-bundle-${selectedEncounter?.encounter_number || 'export'}.json`;
                  a.click();
                }}
              >
                <Download size={16} /> Download JSON Bundle
              </button>

              <button className="btn btn-secondary" onClick={handlePushABDM}>
                <Send size={16} /> Transmit to Mock HIS
              </button>
            </div>

            <pre style={{ background: '#0f172a', color: '#38bdf8', padding: '18px', borderRadius: '12px', fontSize: '13px', maxHeight: '55vh', overflowY: 'auto' }}>
              {JSON.stringify(fhirBundle, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
export default App;
