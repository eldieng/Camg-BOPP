import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Calendar, Eye, Stethoscope, Glasses, FileText, Clock, Printer, Crown } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent } from '../components/ui';
import { patientService, Patient } from '../services/patient.service';
import { consultationService, PatientHistory } from '../services/consultation.service';
import { visionTestService, VisionTest } from '../services/visionTest.service';

export default function PatientHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [history, setHistory] = useState<PatientHistory | null>(null);
  const [visionTests, setVisionTests] = useState<VisionTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'consultations' | 'tests' | 'prescriptions'>('overview');

  useEffect(() => {
    if (id) {
      loadPatientData(id);
    }
  }, [id]);

  const loadPatientData = async (patientId: string) => {
    setIsLoading(true);
    try {
      const [patientData, historyData, testsData] = await Promise.all([
        patientService.getById(patientId),
        consultationService.getPatientHistory(patientId),
        visionTestService.getByPatient(patientId),
      ]);
      setPatient(patientData);
      setHistory(historyData);
      setVisionTests(testsData);
    } catch (err) {
      console.error('Erreur chargement données patient:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAge = (dob: string) => {
    const today = new Date();
    const birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const printPatientFile = () => {
    if (!patient) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const age = calculateAge(patient.dateOfBirth);
    const lastTest = visionTests[0];
    const lastConsult = history?.consultations?.[0];

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fiche Patient - ${patient.lastName} ${patient.firstName}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: Arial, sans-serif; font-size: 11pt; color: #333; margin: 0; padding: 0; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1e40af; padding-bottom: 15px; margin-bottom: 20px; }
          .logo { font-size: 24pt; font-weight: bold; color: #1e40af; }
          .logo-sub { font-size: 10pt; color: #666; }
          .doc-title { text-align: right; }
          .doc-title h2 { margin: 0; color: #1e40af; font-size: 14pt; }
          .doc-title .date { font-size: 10pt; color: #666; }
          .patient-info { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 20px; }
          .patient-info h3 { margin: 0 0 10px 0; color: #1e40af; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
          .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
          .info-item { }
          .info-label { font-size: 9pt; color: #666; text-transform: uppercase; }
          .info-value { font-weight: bold; font-size: 11pt; }
          .reg-number { font-family: monospace; background: #1e40af; color: white; padding: 3px 8px; border-radius: 4px; font-size: 10pt; }
          .vip-badge { background: #fbbf24; color: #78350f; padding: 3px 8px; border-radius: 4px; font-size: 9pt; font-weight: bold; }
          .section { margin-bottom: 20px; }
          .section h3 { color: #1e40af; font-size: 12pt; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 10px; }
          .vision-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          .vision-table th, .vision-table td { border: 1px solid #e2e8f0; padding: 8px; text-align: center; }
          .vision-table th { background: #f1f5f9; font-size: 10pt; }
          .vision-table .eye-header { background: #1e40af; color: white; }
          .vision-table .od { background: #eff6ff; }
          .vision-table .og { background: #f0fdf4; }
          .consultation-box { background: #fefce8; border: 1px solid #fef08a; border-radius: 8px; padding: 15px; margin-bottom: 15px; }
          .consultation-box h4 { margin: 0 0 10px 0; color: #854d0e; }
          .prescription-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .prescription-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; }
          .prescription-box.od { background: #eff6ff; border-color: #bfdbfe; }
          .prescription-box.og { background: #f0fdf4; border-color: #bbf7d0; }
          .prescription-box h5 { margin: 0 0 8px 0; text-align: center; }
          .rx-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; text-align: center; }
          .rx-item { }
          .rx-label { font-size: 8pt; color: #666; }
          .rx-value { font-weight: bold; font-size: 12pt; }
          .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 9pt; color: #666; }
          .signature { text-align: right; }
          .signature-line { border-top: 1px solid #333; width: 200px; margin-top: 40px; padding-top: 5px; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">CAMG-BOPP</div>
            <div class="logo-sub">Dispensaire Ophtalmologique<br/>Dakar, Sénégal</div>
          </div>
          <div class="doc-title">
            <h2>FICHE PATIENT</h2>
            <div class="date">Imprimé le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>

        <div class="patient-info">
          <h3>
            Informations Patient
            ${patient.registrationNumber ? `<span class="reg-number">${patient.registrationNumber}</span>` : ''}
            ${patient.isVIP ? `<span class="vip-badge">⭐ VIP</span>` : ''}
          </h3>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Nom complet</div>
              <div class="info-value">${patient.lastName} ${patient.firstName}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Date de naissance</div>
              <div class="info-value">${new Date(patient.dateOfBirth).toLocaleDateString('fr-FR')} (${age} ans)</div>
            </div>
            <div class="info-item">
              <div class="info-label">Genre</div>
              <div class="info-value">${patient.gender === 'MALE' ? 'Homme' : 'Femme'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Téléphone</div>
              <div class="info-value">${patient.phone || '-'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Adresse</div>
              <div class="info-value">${patient.address || '-'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Statut particulier</div>
              <div class="info-value">
                ${patient.isPregnant ? '🤰 Femme enceinte' : ''}
                ${patient.isDisabled ? '♿ Personne handicapée' : ''}
                ${!patient.isPregnant && !patient.isDisabled ? 'Aucun' : ''}
              </div>
            </div>
          </div>
          ${patient.isVIP && patient.vipReason ? `<div style="margin-top: 10px; font-style: italic; color: #854d0e;">Raison VIP: ${patient.vipReason}</div>` : ''}
        </div>

        ${lastTest ? `
        <div class="section">
          <h3>Dernier Test de Vue (${new Date(lastTest.createdAt).toLocaleDateString('fr-FR')})</h3>
          <table class="vision-table">
            <tr>
              <th></th>
              <th class="eye-header" style="background: #3b82f6;">Œil Droit (OD)</th>
              <th class="eye-header" style="background: #22c55e;">Œil Gauche (OG)</th>
            </tr>
            <tr>
              <th>Acuité visuelle</th>
              <td class="od">${lastTest.rightEye_acuity || '-'}</td>
              <td class="og">${lastTest.leftEye_acuity || '-'}</td>
            </tr>
            <tr>
              <th>Sphère</th>
              <td class="od">${lastTest.rightEye_sphere ?? '-'}</td>
              <td class="og">${lastTest.leftEye_sphere ?? '-'}</td>
            </tr>
            <tr>
              <th>Cylindre</th>
              <td class="od">${lastTest.rightEye_cylinder ?? '-'}</td>
              <td class="og">${lastTest.leftEye_cylinder ?? '-'}</td>
            </tr>
            <tr>
              <th>Axe</th>
              <td class="od">${lastTest.rightEye_axis ? lastTest.rightEye_axis + '°' : '-'}</td>
              <td class="og">${lastTest.leftEye_axis ? lastTest.leftEye_axis + '°' : '-'}</td>
            </tr>
            <tr>
              <th>Addition</th>
              <td class="od">${lastTest.rightEye_addition ?? '-'}</td>
              <td class="og">${lastTest.leftEye_addition ?? '-'}</td>
            </tr>
            ${lastTest.pupillaryDistance ? `
            <tr>
              <th>Écart pupillaire</th>
              <td colspan="2" style="text-align: center;">${lastTest.pupillaryDistance} mm</td>
            </tr>
            ` : ''}
          </table>
          ${lastTest.notes ? `<p><strong>Notes:</strong> ${lastTest.notes}</p>` : ''}
        </div>
        ` : ''}

        ${lastConsult ? `
        <div class="section">
          <h3>Dernière Consultation (${new Date(lastConsult.createdAt).toLocaleDateString('fr-FR')})</h3>
          <div class="consultation-box">
            ${lastConsult.chiefComplaint ? `<p><strong>Motif:</strong> ${lastConsult.chiefComplaint}</p>` : ''}
            ${lastConsult.diagnosis ? `<p><strong>Diagnostic:</strong> ${lastConsult.diagnosis}</p>` : ''}
            ${lastConsult.notes ? `<p><strong>Notes:</strong> ${lastConsult.notes}</p>` : ''}
            ${lastConsult.intraocularPressureOD || lastConsult.intraocularPressureOG ? `
              <p><strong>Pression intraoculaire:</strong> OD: ${lastConsult.intraocularPressureOD ?? '-'} mmHg | OG: ${lastConsult.intraocularPressureOG ?? '-'} mmHg</p>
            ` : ''}
          </div>
          
          ${lastConsult.prescriptions && lastConsult.prescriptions.length > 0 ? `
          <h4>Prescriptions</h4>
          <div class="prescription-grid">
            ${lastConsult.prescriptions.filter(p => p.eyeType === 'OD').map(p => `
              <div class="prescription-box od">
                <h5>Œil Droit (OD)</h5>
                ${p.medication ? `<p><strong>Médicament:</strong> ${p.medication}</p>` : ''}
                ${p.dosage ? `<p><strong>Posologie:</strong> ${p.dosage}</p>` : ''}
                ${p.duration ? `<p><strong>Durée:</strong> ${p.duration}</p>` : ''}
                ${p.sphere !== undefined || p.cylinder !== undefined ? `
                <div class="rx-grid">
                  <div class="rx-item"><div class="rx-label">Sph</div><div class="rx-value">${p.sphere ?? '-'}</div></div>
                  <div class="rx-item"><div class="rx-label">Cyl</div><div class="rx-value">${p.cylinder ?? '-'}</div></div>
                  <div class="rx-item"><div class="rx-label">Axe</div><div class="rx-value">${p.axis ?? '-'}°</div></div>
                  <div class="rx-item"><div class="rx-label">Add</div><div class="rx-value">${p.addition ?? '-'}</div></div>
                </div>
                ` : ''}
                ${p.lensType ? `<p style="margin-top: 5px;"><strong>Verre:</strong> ${p.lensType}</p>` : ''}
              </div>
            `).join('')}
            ${lastConsult.prescriptions.filter(p => p.eyeType === 'OG').map(p => `
              <div class="prescription-box og">
                <h5>Œil Gauche (OG)</h5>
                ${p.medication ? `<p><strong>Médicament:</strong> ${p.medication}</p>` : ''}
                ${p.dosage ? `<p><strong>Posologie:</strong> ${p.dosage}</p>` : ''}
                ${p.duration ? `<p><strong>Durée:</strong> ${p.duration}</p>` : ''}
                ${p.sphere !== undefined || p.cylinder !== undefined ? `
                <div class="rx-grid">
                  <div class="rx-item"><div class="rx-label">Sph</div><div class="rx-value">${p.sphere ?? '-'}</div></div>
                  <div class="rx-item"><div class="rx-label">Cyl</div><div class="rx-value">${p.cylinder ?? '-'}</div></div>
                  <div class="rx-item"><div class="rx-label">Axe</div><div class="rx-value">${p.axis ?? '-'}°</div></div>
                  <div class="rx-item"><div class="rx-label">Add</div><div class="rx-value">${p.addition ?? '-'}</div></div>
                </div>
                ` : ''}
                ${p.lensType ? `<p style="margin-top: 5px;"><strong>Verre:</strong> ${p.lensType}</p>` : ''}
              </div>
            `).join('')}
          </div>
          ` : ''}
        </div>
        ` : ''}

        <div class="section">
          <h3>Résumé des Visites</h3>
          <table class="vision-table">
            <tr>
              <th>Consultations</th>
              <th>Tests de vue</th>
              <th>Prescriptions</th>
              <th>Première visite</th>
            </tr>
            <tr>
              <td><strong>${history?.consultations?.length || 0}</strong></td>
              <td><strong>${visionTests.length}</strong></td>
              <td><strong>${history?.consultations?.reduce((acc, c) => acc + (c.prescriptions?.length || 0), 0) || 0}</strong></td>
              <td>${patient.createdAt ? new Date(patient.createdAt).toLocaleDateString('fr-FR') : '-'}</td>
            </tr>
          </table>
        </div>

        <div class="footer">
          <div>
            <strong>CAMG-BOPP</strong> - Centre d'Appui Médical Général<br/>
            Dispensaire Ophtalmologique - Dakar, Sénégal
          </div>
          <div class="signature">
            <div class="signature-line">Signature du médecin</div>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Patient non trouvé</p>
        <Button onClick={() => navigate('/patients')} className="mt-4">
          Retour à la liste
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => navigate('/patients')} leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Retour
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                Dossier Patient: {patient.lastName} {patient.firstName}
              </h1>
              {patient.isVIP && (
                <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                  <Crown className="w-4 h-4" /> VIP
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              {patient.registrationNumber && (
                <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">{patient.registrationNumber}</span>
              )}
              <span>Historique complet des visites et traitements</span>
            </div>
          </div>
        </div>
        <Button onClick={printPatientFile} leftIcon={<Printer className="w-4 h-4" />}>
          Imprimer fiche
        </Button>
      </div>

      {/* Infos patient */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 bg-blue-200 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-blue-700" />
            </div>
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Nom complet</p>
                <p className="font-semibold">{patient.lastName} {patient.firstName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Âge</p>
                <p className="font-semibold">{calculateAge(patient.dateOfBirth)} ans</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Genre</p>
                <p className="font-semibold">{patient.gender === 'MALE' ? 'Homme' : 'Femme'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Téléphone</p>
                <p className="font-semibold">{patient.phone || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date de naissance</p>
                <p className="font-semibold">{new Date(patient.dateOfBirth).toLocaleDateString('fr-FR')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Adresse</p>
                <p className="font-semibold">{patient.address || '-'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Statut particulier</p>
                <div className="flex gap-2 mt-1">
                  {patient.isPregnant && <span className="px-2 py-1 bg-pink-100 text-pink-800 rounded-full text-xs">Femme enceinte</span>}
                  {patient.isDisabled && <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">Personne handicapée</span>}
                  {!patient.isPregnant && !patient.isDisabled && <span className="text-gray-500">Aucun</span>}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="w-8 h-8 mx-auto text-blue-500 mb-2" />
            <div className="text-2xl font-bold">{history?.consultations?.length || 0}</div>
            <div className="text-sm text-gray-500">Consultations</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Eye className="w-8 h-8 mx-auto text-indigo-500 mb-2" />
            <div className="text-2xl font-bold">{visionTests.length}</div>
            <div className="text-sm text-gray-500">Tests de vue</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Glasses className="w-8 h-8 mx-auto text-purple-500 mb-2" />
            <div className="text-2xl font-bold">
              {history?.consultations?.reduce((acc, c) => acc + (c.prescriptions?.length || 0), 0) || 0}
            </div>
            <div className="text-sm text-gray-500">Prescriptions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 mx-auto text-green-500 mb-2" />
            <div className="text-2xl font-bold">
              {history?.consultations?.[0] 
                ? new Date(history.consultations[0].createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                : '-'}
            </div>
            <div className="text-sm text-gray-500">Dernière visite</div>
          </CardContent>
        </Card>
      </div>

      {/* Onglets */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-4">
          {[
            { id: 'overview', label: 'Vue d\'ensemble', icon: FileText },
            { id: 'consultations', label: 'Consultations', icon: Stethoscope },
            { id: 'tests', label: 'Tests de vue', icon: Eye },
            { id: 'prescriptions', label: 'Prescriptions', icon: Glasses },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dernière consultation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-green-500" />
                Dernière consultation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history?.consultations?.[0] ? (
                <div className="space-y-3">
                  <div className="text-sm text-gray-500">
                    {formatDate(history.consultations[0].createdAt)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Motif</p>
                    <p>{history.consultations[0].chiefComplaint || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Diagnostic</p>
                    <p>{history.consultations[0].diagnosis || '-'}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Aucune consultation</p>
              )}
            </CardContent>
          </Card>

          {/* Dernier test de vue */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-500" />
                Dernier test de vue
              </CardTitle>
            </CardHeader>
            <CardContent>
              {visionTests[0] ? (
                <div className="space-y-3">
                  <div className="text-sm text-gray-500">
                    {formatDate(visionTests[0].createdAt)}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-700">Œil Droit (OD)</p>
                      <p className="text-lg font-bold">{visionTests[0].rightEye_acuity || '-'}</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm font-medium text-green-700">Œil Gauche (OG)</p>
                      <p className="text-lg font-bold">{visionTests[0].leftEye_acuity || '-'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Aucun test de vue</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'consultations' && (
        <Card>
          <CardHeader>
            <CardTitle>Historique des consultations</CardTitle>
          </CardHeader>
          <CardContent>
            {history?.consultations && history.consultations.length > 0 ? (
              <div className="space-y-4">
                {history.consultations.map((consultation, idx) => (
                  <div key={idx} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div className="text-sm text-gray-500">{formatDate(consultation.createdAt)}</div>
                      {consultation.prescriptions && consultation.prescriptions.length > 0 && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                          {consultation.prescriptions.length} prescription(s)
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Motif</p>
                        <p className="text-gray-900">{consultation.chiefComplaint || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Diagnostic</p>
                        <p className="text-gray-900">{consultation.diagnosis || '-'}</p>
                      </div>
                      {consultation.notes && (
                        <div className="md:col-span-2">
                          <p className="text-sm font-medium text-gray-700">Notes</p>
                          <p className="text-gray-900">{consultation.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Aucune consultation enregistrée</p>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'tests' && (
        <Card>
          <CardHeader>
            <CardTitle>Historique des tests de vue</CardTitle>
          </CardHeader>
          <CardContent>
            {visionTests.length > 0 ? (
              <div className="space-y-4">
                {visionTests.map((test, idx) => (
                  <div key={idx} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="text-sm text-gray-500 mb-3">{formatDate(test.createdAt)}</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 bg-blue-50 rounded-lg text-center">
                        <p className="text-xs text-blue-600">Acuité OD</p>
                        <p className="text-xl font-bold text-blue-800">{test.rightEye_acuity || '-'}</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg text-center">
                        <p className="text-xs text-green-600">Acuité OG</p>
                        <p className="text-xl font-bold text-green-800">{test.leftEye_acuity || '-'}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg text-center">
                        <p className="text-xs text-gray-600">Correction OD</p>
                        <p className="text-xl font-bold text-gray-800">{test.rightEye_sphere ? `${test.rightEye_sphere}` : '-'}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg text-center">
                        <p className="text-xs text-gray-600">Correction OG</p>
                        <p className="text-xl font-bold text-gray-800">{test.leftEye_sphere ? `${test.leftEye_sphere}` : '-'}</p>
                      </div>
                    </div>
                    {test.notes && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-500">Notes: {test.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Aucun test de vue enregistré</p>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'prescriptions' && (
        <Card>
          <CardHeader>
            <CardTitle>Historique des prescriptions</CardTitle>
          </CardHeader>
          <CardContent>
            {history?.consultations?.some(c => c.prescriptions && c.prescriptions.length > 0) ? (
              <div className="space-y-4">
                {history.consultations
                  .filter(c => c.prescriptions && c.prescriptions.length > 0)
                  .map((consultation, idx) => (
                    <div key={idx} className="p-4 border rounded-lg">
                      <div className="text-sm text-gray-500 mb-3">
                        Consultation du {formatDate(consultation.createdAt)}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {consultation.prescriptions?.map((prescription, pIdx) => (
                          <div 
                            key={pIdx} 
                            className={`p-3 rounded-lg ${prescription.eyeType === 'OD' ? 'bg-blue-50' : 'bg-green-50'}`}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">
                                {prescription.eyeType === 'OD' ? 'Œil Droit (OD)' : 'Œil Gauche (OG)'}
                              </span>
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-sm">
                              <div>
                                <p className="text-gray-500">Sph</p>
                                <p className="font-medium">{prescription.sphere ?? '-'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Cyl</p>
                                <p className="font-medium">{prescription.cylinder ?? '-'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Axe</p>
                                <p className="font-medium">{prescription.axis ?? '-'}°</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Add</p>
                                <p className="font-medium">{prescription.addition ?? '-'}</p>
                              </div>
                            </div>
                            {(prescription.lensType || prescription.coating) && (
                              <div className="mt-2 pt-2 border-t text-sm">
                                {prescription.lensType && <span className="mr-3">Verre: {prescription.lensType}</span>}
                                {prescription.coating && <span>Traitement: {prescription.coating}</span>}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Aucune prescription enregistrée</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
