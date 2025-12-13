import { forwardRef } from 'react';

interface Prescription {
  eyeType: 'OD' | 'OG';
  sphere?: number;
  cylinder?: number;
  axis?: number;
  addition?: number;
  lensType?: string;
  coating?: string;
}

interface PrescriptionPrintProps {
  patient: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
  };
  consultation: {
    diagnosis?: string;
    notes?: string;
    createdAt: string;
  };
  prescriptions: Prescription[];
  doctor: {
    firstName: string;
    lastName: string;
  };
}

const PrescriptionPrint = forwardRef<HTMLDivElement, PrescriptionPrintProps>(
  ({ patient, consultation, prescriptions, doctor }, ref) => {
    const today = new Date();
    const birthDate = new Date(patient.dateOfBirth);
    const age = today.getFullYear() - birthDate.getFullYear();

    const odPrescription = prescriptions.find(p => p.eyeType === 'OD');
    const ogPrescription = prescriptions.find(p => p.eyeType === 'OG');

    return (
      <div
        ref={ref}
        style={{
          width: '210mm',
          minHeight: '297mm',
          padding: '20mm',
          fontFamily: 'Georgia, serif',
          fontSize: '12pt',
          backgroundColor: 'white',
          color: 'black',
        }}
      >
        {/* En-tête */}
        <div style={{ textAlign: 'center', marginBottom: '15mm', borderBottom: '2px solid #1e40af', paddingBottom: '10mm' }}>
          <h1 style={{ fontSize: '24pt', fontWeight: 'bold', color: '#1e40af', margin: 0 }}>
            CAMG-BOPP
          </h1>
          <p style={{ fontSize: '14pt', margin: '5px 0' }}>Dispensaire Ophtalmologique</p>
          <p style={{ fontSize: '10pt', color: '#666' }}>
            Dakar, Sénégal • Tél: +221 XX XXX XX XX
          </p>
        </div>

        {/* Titre */}
        <div style={{ textAlign: 'center', margin: '10mm 0' }}>
          <h2 style={{ fontSize: '18pt', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Ordonnance Optique
          </h2>
        </div>

        {/* Informations patient */}
        <div style={{ 
          backgroundColor: '#f8fafc', 
          padding: '10mm', 
          borderRadius: '5mm', 
          marginBottom: '10mm',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: '3px 0' }}>
                <strong>Patient:</strong> {patient.lastName} {patient.firstName}
              </p>
              <p style={{ margin: '3px 0' }}>
                <strong>Âge:</strong> {age} ans
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: '3px 0' }}>
                <strong>Date:</strong> {new Date(consultation.createdAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Diagnostic */}
        {consultation.diagnosis && (
          <div style={{ marginBottom: '10mm' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '3mm' }}>Diagnostic:</p>
            <p style={{ paddingLeft: '5mm', fontStyle: 'italic' }}>{consultation.diagnosis}</p>
          </div>
        )}

        {/* Tableau de prescription */}
        <div style={{ marginBottom: '10mm' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '5mm', fontSize: '14pt' }}>Prescription de verres correcteurs:</p>
          
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse', 
            border: '2px solid #1e40af',
            marginBottom: '5mm'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#1e40af', color: 'white' }}>
                <th style={{ padding: '8px', border: '1px solid #1e40af', width: '15%' }}>Œil</th>
                <th style={{ padding: '8px', border: '1px solid #1e40af', width: '17%' }}>Sphère</th>
                <th style={{ padding: '8px', border: '1px solid #1e40af', width: '17%' }}>Cylindre</th>
                <th style={{ padding: '8px', border: '1px solid #1e40af', width: '17%' }}>Axe</th>
                <th style={{ padding: '8px', border: '1px solid #1e40af', width: '17%' }}>Addition</th>
                <th style={{ padding: '8px', border: '1px solid #1e40af', width: '17%' }}>Type verre</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1', fontWeight: 'bold', backgroundColor: '#eff6ff' }}>
                  OD (Droit)
                </td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                  {odPrescription?.sphere !== undefined ? (odPrescription.sphere > 0 ? `+${odPrescription.sphere}` : odPrescription.sphere) : '—'}
                </td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                  {odPrescription?.cylinder !== undefined ? (odPrescription.cylinder > 0 ? `+${odPrescription.cylinder}` : odPrescription.cylinder) : '—'}
                </td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                  {odPrescription?.axis !== undefined ? `${odPrescription.axis}°` : '—'}
                </td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                  {odPrescription?.addition !== undefined ? `+${odPrescription.addition}` : '—'}
                </td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                  {odPrescription?.lensType || '—'}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1', fontWeight: 'bold', backgroundColor: '#f0fdf4' }}>
                  OG (Gauche)
                </td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                  {ogPrescription?.sphere !== undefined ? (ogPrescription.sphere > 0 ? `+${ogPrescription.sphere}` : ogPrescription.sphere) : '—'}
                </td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                  {ogPrescription?.cylinder !== undefined ? (ogPrescription.cylinder > 0 ? `+${ogPrescription.cylinder}` : ogPrescription.cylinder) : '—'}
                </td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                  {ogPrescription?.axis !== undefined ? `${ogPrescription.axis}°` : '—'}
                </td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                  {ogPrescription?.addition !== undefined ? `+${ogPrescription.addition}` : '—'}
                </td>
                <td style={{ padding: '10px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                  {ogPrescription?.lensType || '—'}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Traitements */}
          {(odPrescription?.coating || ogPrescription?.coating) && (
            <p style={{ marginTop: '5mm' }}>
              <strong>Traitements recommandés:</strong> {odPrescription?.coating || ogPrescription?.coating}
            </p>
          )}
        </div>

        {/* Notes */}
        {consultation.notes && (
          <div style={{ marginBottom: '15mm' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '3mm' }}>Observations:</p>
            <p style={{ paddingLeft: '5mm' }}>{consultation.notes}</p>
          </div>
        )}

        {/* Signature */}
        <div style={{ 
          marginTop: '20mm', 
          display: 'flex', 
          justifyContent: 'flex-end' 
        }}>
          <div style={{ textAlign: 'center', width: '60mm' }}>
            <p style={{ marginBottom: '15mm' }}>Le Médecin,</p>
            <div style={{ borderTop: '1px solid black', paddingTop: '3mm' }}>
              <p style={{ fontWeight: 'bold' }}>Dr. {doctor.firstName} {doctor.lastName}</p>
            </div>
          </div>
        </div>

        {/* Pied de page */}
        <div style={{ 
          position: 'absolute',
          bottom: '15mm',
          left: '20mm',
          right: '20mm',
          borderTop: '1px solid #e2e8f0',
          paddingTop: '5mm',
          fontSize: '9pt',
          color: '#666',
          textAlign: 'center'
        }}>
          <p>Cette ordonnance est valable 3 mois à compter de la date de prescription.</p>
          <p>CAMG-BOPP - Dispensaire Ophtalmologique - Dakar, Sénégal</p>
        </div>
      </div>
    );
  }
);

PrescriptionPrint.displayName = 'PrescriptionPrint';

export default PrescriptionPrint;
