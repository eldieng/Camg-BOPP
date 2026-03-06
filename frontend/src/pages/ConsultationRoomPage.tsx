import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Stethoscope, Phone, Check, UserX, RefreshCw, Plus, Trash2, Download, ArrowLeft, Pill, Scissors, X, Glasses } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, Input } from '../components/ui';
import { queueService, QueueEntry, StationStats } from '../services/queue.service';
import { consultationService, CreateConsultationDto, CreatePrescriptionDto, PatientHistory } from '../services/consultation.service';
import { visionTestService } from '../services/visionTest.service';
import { reportService } from '../services/report.service';
import {
  surgeryService,
  SurgeryType,
  OperatedEye,
  AnalysisType,
  surgeryTypeLabels,
  eyeLabels,
  analysisTypeLabels,
} from '../services/surgery.service';
import { glassesOrderService, lensTypeOptions, coatingOptions } from '../services/glassesOrder.service';

export default function ConsultationRoomPage() {
  const { roomNumber } = useParams<{ roomNumber: string }>();
  const navigate = useNavigate();
  const room = parseInt(roomNumber || '1') as 1 | 2;

  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [stats, setStats] = useState<StationStats | null>(null);
  const [currentPatient, setCurrentPatient] = useState<QueueEntry | null>(null);
  const [patientHistory, setPatientHistory] = useState<PatientHistory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'consultation' | 'history'>('consultation');

  const [showBlocModal, setShowBlocModal] = useState(false);
  const [blocForm, setBlocForm] = useState({
    type: 'CATARACTE' as SurgeryType,
    customType: '',
    operatedEye: 'OD' as OperatedEye,
    anesthesiaType: 'Locale',
    analyses: [] as AnalysisType[],
  });

  const [showGlassesModal, setShowGlassesModal] = useState(false);
  const [glassesForm, setGlassesForm] = useState({
    lensType: '',
    coating: '',
    frameType: '',
    frameReference: '',
    pupillaryDistance: '',
    notes: '',
  });

  const [formData, setFormData] = useState<CreateConsultationDto>({
    patientId: '', chiefComplaint: '', diagnosis: '', notes: '',
    intraocularPressureOD: undefined, intraocularPressureOG: undefined, prescriptions: [],
  });

  const waitingPatients = queue.filter(e => e.status === 'WAITING');

  const loadQueue = async () => {
    try {
      setError('');
      const data = await queueService.getQueue('CONSULTATION');
      setQueue(data.queue);
      setStats(data.stats);

      // Restaurer le patient en service pour cette salle
      const myPatient = data.queue.find(e => 
        (e.status === 'IN_SERVICE' || e.status === 'CALLED') && e.roomNumber === room
      );
      if (myPatient && !currentPatient) {
        setCurrentPatient(myPatient);
        setFormData(prev => ({ ...prev, patientId: myPatient.ticket.patient.id }));
        loadPatientHistory(myPatient.ticket.patient.id);
      }
    } catch (err) {
      console.error('Erreur chargement file:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    }
  };

  const loadPatientHistory = async (patientId: string) => {
    try {
      const history = await consultationService.getPatientHistory(patientId);
      const visionTests = await visionTestService.getByPatient(patientId);
      setPatientHistory({ ...history, visionTests });
    } catch (err) {
      console.error('Erreur chargement historique:', err);
    }
  };

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 15000);
    return () => clearInterval(interval);
  }, [room]);

  const handleCallNext = async () => {
    setError('');
    setIsLoading(true);
    try {
      // Passer le numéro de salle pour que le patient soit assigné à cette salle spécifique
      const entry = await queueService.callNext('CONSULTATION', room);
      if (entry) {
        await queueService.startService(entry.id);
        setCurrentPatient({ ...entry, roomNumber: room, status: 'IN_SERVICE' });
        setFormData(prev => ({ ...prev, patientId: entry.ticket.patient.id }));
        loadPatientHistory(entry.ticket.patient.id);
        setSuccess(`Patient ${entry.ticket.patient.lastName} appelé en Salle ${room}`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Aucun patient en attente');
      }
      loadQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNoShow = async () => {
    if (!currentPatient) return;
    setError('');
    try {
      await queueService.markNoShow(currentPatient.id);
      setCurrentPatient(null);
      setPatientHistory(null);
      setFormData({ patientId: '', chiefComplaint: '', diagnosis: '', notes: '', intraocularPressureOD: undefined, intraocularPressureOG: undefined, prescriptions: [] });
      setSuccess('Patient marqué absent');
      setTimeout(() => setSuccess(''), 3000);
      loadQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const addPrescription = (eyeType: 'OD' | 'OG') => {
    const newPrescription: CreatePrescriptionDto = {
      eyeType, sphere: undefined, cylinder: undefined, axis: undefined,
      addition: undefined, lensType: '', coating: '',
    };
    setFormData(prev => ({ ...prev, prescriptions: [...(prev.prescriptions || []), newPrescription] }));
  };

  const updatePrescription = (index: number, field: keyof CreatePrescriptionDto, value: any) => {
    setFormData(prev => ({
      ...prev,
      prescriptions: prev.prescriptions?.map((p, i) => i === index ? { ...p, [field]: value } : p),
    }));
  };

  const removePrescription = (index: number) => {
    setFormData(prev => ({ ...prev, prescriptions: prev.prescriptions?.filter((_, i) => i !== index) }));
  };

  const handleSendToBloc = async () => {
    if (!currentPatient) return;
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      // 1. Sauvegarder la consultation
      const consultation = await consultationService.create({ ...formData, queueEntryId: currentPatient.id });

      // 2. Créer l'opération
      await surgeryService.createSurgery({
        patientId: currentPatient.ticket.patient.id,
        consultationId: consultation.id,
        type: blocForm.type,
        customType: blocForm.type === 'AUTRE' ? blocForm.customType : undefined,
        operatedEye: blocForm.operatedEye,
        diagnosis: formData.diagnosis || undefined,
        anesthesiaType: blocForm.anesthesiaType,
      });

      // 3. Prescrire les analyses si sélectionnées
      if (blocForm.analyses.length > 0) {
        await surgeryService.createMultipleAnalyses({
          patientId: currentPatient.ticket.patient.id,
          consultationId: consultation.id,
          types: blocForm.analyses,
        });
      }

      // 4. Terminer le service
      await queueService.completeService(currentPatient.id);

      setSuccess(`Patient envoyé au Bloc Opératoire - ${blocForm.analyses.length} analyse(s) prescrite(s)`);
      setShowBlocModal(false);
      setCurrentPatient(null);
      setPatientHistory(null);
      setFormData({ patientId: '', chiefComplaint: '', diagnosis: '', notes: '', intraocularPressureOD: undefined, intraocularPressureOG: undefined, prescriptions: [] });
      setBlocForm({ type: 'CATARACTE', customType: '', operatedEye: 'OD', anesthesiaType: 'Locale', analyses: [] });
      setTimeout(() => setSuccess(''), 4000);
      loadQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setIsLoading(false);
    }
  };

  // Créer commande de lunettes et envoyer patient
  const handleGlassesOrder = async () => {
    if (!currentPatient) return;
    setError('');
    setIsLoading(true);
    try {
      // 1. Créer la consultation
      const consultation = await consultationService.create({ ...formData, queueEntryId: currentPatient.id });

      // 2. Extraire les prescriptions optiques OD et OG
      const odPrescription = formData.prescriptions?.find(p => p.eyeType === 'OD');
      const ogPrescription = formData.prescriptions?.find(p => p.eyeType === 'OG');

      // 3. Créer la commande de lunettes
      await glassesOrderService.create({
        patientId: currentPatient.ticket.patient.id,
        consultationId: consultation.id,
        odSphere: odPrescription?.sphere,
        odCylinder: odPrescription?.cylinder,
        odAxis: odPrescription?.axis,
        odAddition: odPrescription?.addition,
        ogSphere: ogPrescription?.sphere,
        ogCylinder: ogPrescription?.cylinder,
        ogAxis: ogPrescription?.axis,
        ogAddition: ogPrescription?.addition,
        lensType: glassesForm.lensType || odPrescription?.lensType || ogPrescription?.lensType,
        coating: glassesForm.coating || odPrescription?.coating || ogPrescription?.coating,
        frameType: glassesForm.frameType || undefined,
        frameReference: glassesForm.frameReference || undefined,
        pupillaryDistance: glassesForm.pupillaryDistance ? parseFloat(glassesForm.pupillaryDistance) : undefined,
        notes: glassesForm.notes || undefined,
      });

      // 4. Terminer le service (patient reviendra chercher ses lunettes)
      await queueService.completeService(currentPatient.id);

      setSuccess('Commande de lunettes créée - Le patient sera notifié quand les lunettes seront prêtes');
      setShowGlassesModal(false);
      setCurrentPatient(null);
      setPatientHistory(null);
      setFormData({ patientId: '', chiefComplaint: '', diagnosis: '', notes: '', intraocularPressureOD: undefined, intraocularPressureOG: undefined, prescriptions: [] });
      setGlassesForm({ lensType: '', coating: '', frameType: '', frameReference: '', pupillaryDistance: '', notes: '' });
      setTimeout(() => setSuccess(''), 4000);
      loadQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (nextStation: 'LUNETTES' | 'MEDICAMENTS' | null = null) => {
    if (!currentPatient) return;
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      await consultationService.create({ ...formData, queueEntryId: currentPatient.id });

      if (nextStation) {
        await queueService.completeService(currentPatient.id, nextStation);
        setSuccess(`Consultation terminée - Patient envoyé aux ${nextStation === 'LUNETTES' ? 'Lunettes' : 'Médicaments'}`);
      } else {
        await queueService.completeService(currentPatient.id);
        setSuccess('Consultation terminée');
      }

      setCurrentPatient(null);
      setPatientHistory(null);
      setFormData({ patientId: '', chiefComplaint: '', diagnosis: '', notes: '', intraocularPressureOD: undefined, intraocularPressureOG: undefined, prescriptions: [] });
      setTimeout(() => setSuccess(''), 3000);
      loadQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadPatientPDF = async () => {
    if (!currentPatient) return;
    try {
      const report = await reportService.getPatientReport(currentPatient.ticket.patient.id);
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      const calculateAge = (dob: string) => {
        const birth = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        return age;
      };

      const html = `<!DOCTYPE html><html><head><title>Fiche Patient</title>
        <style>body{font-family:Arial,sans-serif;padding:40px;color:#333;max-width:800px;margin:0 auto}h1{color:#1e40af;border-bottom:2px solid #1e40af;padding-bottom:10px}h2{color:#374151;margin-top:30px}.patient-info{background:#f3f4f6;padding:20px;border-radius:8px;margin:20px 0}table{width:100%;border-collapse:collapse;margin:15px 0}th,td{border:1px solid #e5e7eb;padding:10px;text-align:left}th{background:#f9fafb}.section{margin:20px 0;padding:15px;background:#fafafa;border-radius:8px}.footer{margin-top:40px;text-align:center;color:#9ca3af;font-size:12px}</style></head>
        <body><h1>Fiche Patient - CAMG-BOPP</h1>
        <div class="patient-info"><h3>${report.patient.lastName} ${report.patient.firstName}</h3>
        <p><strong>Date de naissance:</strong> ${new Date(report.patient.dateOfBirth).toLocaleDateString('fr-FR')} (${calculateAge(report.patient.dateOfBirth)} ans)</p>
        ${report.patient.phone ? '<p><strong>Téléphone:</strong> ' + report.patient.phone + '</p>' : ''}</div>
        ${report.visionTests.length > 0 ? '<h2>Tests de Vue</h2>' + report.visionTests.map(vt => '<div class="section"><p><strong>Date:</strong> ' + new Date(vt.date).toLocaleDateString('fr-FR') + '</p><table><tr><th></th><th>Acuité</th><th>Sphère</th><th>Cylindre</th><th>Axe</th></tr><tr><td>OD</td><td>' + (vt.rightEye.acuity || '-') + '</td><td>' + (vt.rightEye.sphere ?? '-') + '</td><td>' + (vt.rightEye.cylinder ?? '-') + '</td><td>' + (vt.rightEye.axis ?? '-') + '</td></tr><tr><td>OG</td><td>' + (vt.leftEye.acuity || '-') + '</td><td>' + (vt.leftEye.sphere ?? '-') + '</td><td>' + (vt.leftEye.cylinder ?? '-') + '</td><td>' + (vt.leftEye.axis ?? '-') + '</td></tr></table></div>').join('') : ''}
        ${report.consultations.length > 0 ? '<h2>Consultations</h2>' + report.consultations.map(c => '<div class="section"><p><strong>Date:</strong> ' + new Date(c.date).toLocaleDateString('fr-FR') + '</p>' + (c.diagnosis ? '<p><strong>Diagnostic:</strong> ' + c.diagnosis + '</p>' : '') + '</div>').join('') : ''}
        <div class="footer"><p>Généré le ${new Date().toLocaleDateString('fr-FR')}</p></div></body></html>`;

      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => printWindow.print();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => navigate('/consultation')} leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Retour
          </Button>
          <h1 className={`text-2xl font-bold ${room === 1 ? 'text-blue-700' : 'text-green-700'}`}>
            <Stethoscope className="w-6 h-6 inline mr-2" />
            Salle {room}
          </h1>
        </div>
        <Button onClick={loadQueue} variant="secondary" leftIcon={<RefreshCw className="w-4 h-4" />}>Actualiser</Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-700">En attente</p>
            <p className="text-2xl font-bold text-yellow-800">{waitingPatients.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-sm text-green-700">Terminées aujourd'hui</p>
            <p className="text-2xl font-bold text-green-800">{stats.completed}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border">
            <p className="text-sm text-gray-600">Temps moyen</p>
            <p className="text-2xl font-bold">{stats.avgWaitTime} min</p>
          </div>
        </div>
      )}

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}
      {success && <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">{success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* File d'attente */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>File ({waitingPatients.length})</CardTitle>
              <Button 
                onClick={handleCallNext} 
                isLoading={isLoading} 
                leftIcon={<Phone className="w-4 h-4" />} 
                size="sm"
                disabled={waitingPatients.length === 0 || currentPatient !== null}
              >
                Appeler
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {waitingPatients.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Aucun patient en attente</p>
              ) : (
                waitingPatients.map((entry) => (
                  <div key={entry.id} className="p-3 rounded-lg border bg-gray-50">
                    <p className="font-medium text-sm">{entry.ticket.patient.lastName} {entry.ticket.patient.firstName}</p>
                    <p className="text-xs text-gray-500">{entry.ticket.ticketNumber}</p>
                    {entry.ticket.priority !== 'NORMAL' && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        entry.ticket.priority === 'EMERGENCY' ? 'bg-red-100 text-red-800' :
                        entry.ticket.priority === 'DISABLED' ? 'bg-purple-100 text-purple-800' :
                        entry.ticket.priority === 'PREGNANT' ? 'bg-pink-100 text-pink-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {entry.ticket.priority === 'EMERGENCY' ? '🚨 Urgence' :
                         entry.ticket.priority === 'DISABLED' ? '♿ PMR' :
                         entry.ticket.priority === 'PREGNANT' ? '🤰 Enceinte' : '👴 Senior'}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Zone consultation */}
        <div className="lg:col-span-2">
          <Card className={currentPatient ? `border-2 ${room === 1 ? 'border-blue-500' : 'border-green-500'}` : ''}>
            <CardHeader className={room === 1 ? 'bg-blue-50' : 'bg-green-50'}>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Stethoscope className="w-5 h-5 mr-2" />
                  {currentPatient ? `${currentPatient.ticket.patient.lastName} ${currentPatient.ticket.patient.firstName}` : 'En attente de patient'}
                </CardTitle>
                {currentPatient && (
                  <div className="flex space-x-2 items-center">
                    <button onClick={() => setActiveTab('consultation')} className={`px-3 py-1 rounded ${activeTab === 'consultation' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}>Consultation</button>
                    <button onClick={() => setActiveTab('history')} className={`px-3 py-1 rounded ${activeTab === 'history' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}>Historique</button>
                    <button onClick={downloadPatientPDF} className="px-3 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 flex items-center gap-1"><Download className="w-4 h-4" /> PDF</button>
                    <Button size="sm" variant="danger" onClick={handleNoShow} leftIcon={<UserX className="w-3 h-3" />}>Absent</Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!currentPatient ? (
                <p className="text-center text-gray-500 py-12">Cliquez sur "Appeler" pour faire entrer le prochain patient</p>
              ) : activeTab === 'history' ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {patientHistory?.visionTests && patientHistory.visionTests.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Dernier test de vue</h4>
                      <div className="p-3 bg-gray-50 rounded-lg text-sm">
                        <p>OD: {patientHistory.visionTests[0].rightEye_acuity || '-'} | Sph: {patientHistory.visionTests[0].rightEye_sphere || '-'}</p>
                        <p>OG: {patientHistory.visionTests[0].leftEye_acuity || '-'} | Sph: {patientHistory.visionTests[0].leftEye_sphere || '-'}</p>
                      </div>
                    </div>
                  )}
                  {patientHistory?.consultations && patientHistory.consultations.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Consultations précédentes</h4>
                      {patientHistory.consultations.map((c) => (
                        <div key={c.id} className="p-3 bg-gray-50 rounded-lg mb-2 text-sm">
                          <p className="text-gray-500">{new Date(c.createdAt).toLocaleDateString('fr-FR')}</p>
                          <p><strong>Diagnostic:</strong> {c.diagnosis || '-'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Résultats test de vue */}
                  {patientHistory?.visionTests && patientHistory.visionTests.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-800 mb-3">👁️ Résultats du Test de Vue</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-white rounded p-3">
                          <p className="font-medium text-gray-700 mb-2">Œil Droit (OD)</p>
                          <p>Acuité: <span className="font-semibold">{patientHistory.visionTests[0].rightEye_acuity || '-'}</span></p>
                          <p>Sphère: <span className="font-semibold">{patientHistory.visionTests[0].rightEye_sphere ?? '-'}</span></p>
                          <p>Cylindre: <span className="font-semibold">{patientHistory.visionTests[0].rightEye_cylinder ?? '-'}</span></p>
                          <p>Axe: <span className="font-semibold">{patientHistory.visionTests[0].rightEye_axis ?? '-'}°</span></p>
                        </div>
                        <div className="bg-white rounded p-3">
                          <p className="font-medium text-gray-700 mb-2">Œil Gauche (OG)</p>
                          <p>Acuité: <span className="font-semibold">{patientHistory.visionTests[0].leftEye_acuity || '-'}</span></p>
                          <p>Sphère: <span className="font-semibold">{patientHistory.visionTests[0].leftEye_sphere ?? '-'}</span></p>
                          <p>Cylindre: <span className="font-semibold">{patientHistory.visionTests[0].leftEye_cylinder ?? '-'}</span></p>
                          <p>Axe: <span className="font-semibold">{patientHistory.visionTests[0].leftEye_axis ?? '-'}°</span></p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <Input type="number" step="0.1" label="PIO OD (mmHg)" value={formData.intraocularPressureOD ?? ''} onChange={(e) => setFormData({ ...formData, intraocularPressureOD: e.target.value ? parseFloat(e.target.value) : undefined })} />
                    <Input type="number" step="0.1" label="PIO OG (mmHg)" value={formData.intraocularPressureOG ?? ''} onChange={(e) => setFormData({ ...formData, intraocularPressureOG: e.target.value ? parseFloat(e.target.value) : undefined })} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Motif de consultation</label>
                    <textarea className="w-full px-4 py-2 border border-gray-300 rounded-lg" rows={2} value={formData.chiefComplaint || ''} onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Diagnostic</label>
                    <textarea className="w-full px-4 py-2 border border-gray-300 rounded-lg" rows={2} value={formData.diagnosis || ''} onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea className="w-full px-4 py-2 border border-gray-300 rounded-lg" rows={2} value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
                  </div>

                  {/* Prescriptions */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-gray-700">Prescriptions</label>
                      <div className="flex space-x-2">
                        <Button type="button" size="sm" variant="secondary" onClick={() => addPrescription('OD')} leftIcon={<Plus className="w-3 h-3" />}>OD</Button>
                        <Button type="button" size="sm" variant="secondary" onClick={() => addPrescription('OG')} leftIcon={<Plus className="w-3 h-3" />}>OG</Button>
                      </div>
                    </div>
                    {formData.prescriptions?.map((p, i) => (
                      <div key={i} className={`p-3 rounded-lg mb-2 ${p.eyeType === 'OD' ? 'bg-blue-50' : 'bg-green-50'}`}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{p.eyeType === 'OD' ? 'Œil Droit' : 'Œil Gauche'}</span>
                          <Button type="button" size="sm" variant="danger" onClick={() => removePrescription(i)} leftIcon={<Trash2 className="w-3 h-3" />} />
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <Input type="number" step="0.25" label="Sph" value={p.sphere ?? ''} onChange={(e) => updatePrescription(i, 'sphere', e.target.value ? parseFloat(e.target.value) : undefined)} />
                          <Input type="number" step="0.25" label="Cyl" value={p.cylinder ?? ''} onChange={(e) => updatePrescription(i, 'cylinder', e.target.value ? parseFloat(e.target.value) : undefined)} />
                          <Input type="number" label="Axe" value={p.axis ?? ''} onChange={(e) => updatePrescription(i, 'axis', e.target.value ? parseInt(e.target.value) : undefined)} />
                          <Input type="number" step="0.25" label="Add" value={p.addition ?? ''} onChange={(e) => updatePrescription(i, 'addition', e.target.value ? parseFloat(e.target.value) : undefined)} />
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <Input label="Type verre" value={p.lensType || ''} onChange={(e) => updatePrescription(i, 'lensType', e.target.value)} />
                          <Input label="Traitement" value={p.coating || ''} onChange={(e) => updatePrescription(i, 'coating', e.target.value)} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex space-x-2">
                      <Button type="button" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white" isLoading={isLoading} onClick={() => setShowGlassesModal(true)} leftIcon={<Glasses className="w-5 h-5" />}>
                        Commander Lunettes
                      </Button>
                      <Button type="button" className="flex-1 bg-teal-600 hover:bg-teal-700" isLoading={isLoading} onClick={() => handleSubmit('MEDICAMENTS')} leftIcon={<Pill className="w-5 h-5" />}>
                        Envoyer aux Médicaments
                      </Button>
                    </div>
                    <Button type="button" className="w-full bg-orange-600 hover:bg-orange-700 text-white" isLoading={isLoading} onClick={() => setShowBlocModal(true)} leftIcon={<Scissors className="w-5 h-5" />}>
                      Envoyer au Bloc Opératoire
                    </Button>
                    <Button type="button" variant="secondary" className="w-full" isLoading={isLoading} onClick={() => handleSubmit(null)} leftIcon={<Check className="w-5 h-5" />}>
                      Terminer (sans transfert)
                    </Button>
                  </div>

                  {/* Modal Bloc Opératoire */}
                  {showBlocModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-4 border-b bg-orange-50">
                          <h3 className="text-lg font-bold text-orange-800 flex items-center gap-2">
                            <Scissors className="w-5 h-5" /> Bloc Opératoire
                          </h3>
                          <button onClick={() => setShowBlocModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-4 space-y-4">
                          <p className="text-sm text-gray-600">Patient: <strong>{currentPatient?.ticket.patient.lastName} {currentPatient?.ticket.patient.firstName}</strong></p>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Type d'opération *</label>
                              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" value={blocForm.type} onChange={(e) => setBlocForm({ ...blocForm, type: e.target.value as SurgeryType })}>
                                {(Object.entries(surgeryTypeLabels) as [SurgeryType, string][]).map(([t, l]) => (
                                  <option key={t} value={t}>{l}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Œil opéré</label>
                              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" value={blocForm.operatedEye} onChange={(e) => setBlocForm({ ...blocForm, operatedEye: e.target.value as OperatedEye })}>
                                {(Object.entries(eyeLabels) as [OperatedEye, string][]).map(([e, l]) => (
                                  <option key={e} value={e}>{l}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {blocForm.type === 'AUTRE' && (
                            <Input label="Préciser le type" value={blocForm.customType} onChange={(e) => setBlocForm({ ...blocForm, customType: e.target.value })} />
                          )}

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Anesthésie</label>
                            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" value={blocForm.anesthesiaType} onChange={(e) => setBlocForm({ ...blocForm, anesthesiaType: e.target.value })}>
                              <option value="Locale">Locale</option>
                              <option value="Générale">Générale</option>
                              <option value="Locorégionale">Locorégionale</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Analyses à prescrire</label>
                            <div className="grid grid-cols-2 gap-1.5">
                              {(Object.entries(analysisTypeLabels) as [AnalysisType, string][]).map(([type, label]) => (
                                <label key={type} className={`flex items-center p-2 rounded border cursor-pointer text-sm ${
                                  blocForm.analyses.includes(type) ? 'bg-orange-50 border-orange-300' : 'hover:bg-gray-50'
                                }`}>
                                  <input type="checkbox" checked={blocForm.analyses.includes(type)} onChange={(e) => {
                                    if (e.target.checked) setBlocForm({ ...blocForm, analyses: [...blocForm.analyses, type] });
                                    else setBlocForm({ ...blocForm, analyses: blocForm.analyses.filter(a => a !== type) });
                                  }} className="mr-2" />
                                  {label}
                                </label>
                              ))}
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button onClick={handleSendToBloc} isLoading={isLoading} className="flex-1 bg-orange-600 hover:bg-orange-700">
                              Confirmer
                            </Button>
                            <Button variant="secondary" onClick={() => setShowBlocModal(false)} className="flex-1">
                              Annuler
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Modal Commande Lunettes */}
                  {showGlassesModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-4 border-b bg-purple-50">
                          <h3 className="text-lg font-bold text-purple-800 flex items-center gap-2">
                            <Glasses className="w-5 h-5" /> Commander Lunettes
                          </h3>
                          <button onClick={() => setShowGlassesModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-4 space-y-4">
                          <p className="text-sm text-gray-600">Patient: <strong>{currentPatient?.ticket.patient.lastName} {currentPatient?.ticket.patient.firstName}</strong></p>

                          {/* Résumé prescription */}
                          {formData.prescriptions && formData.prescriptions.length > 0 && (
                            <div className="bg-blue-50 p-3 rounded-lg text-sm">
                              <p className="font-medium text-blue-800 mb-2">Prescription optique:</p>
                              <div className="grid grid-cols-2 gap-2">
                                {formData.prescriptions.map((p, i) => (
                                  <div key={i} className={`p-2 rounded ${p.eyeType === 'OD' ? 'bg-blue-100' : 'bg-green-100'}`}>
                                    <p className="font-medium">{p.eyeType === 'OD' ? 'OD' : 'OG'}</p>
                                    <p className="text-xs">Sph: {p.sphere ?? '-'} | Cyl: {p.cylinder ?? '-'} | Axe: {p.axis ?? '-'}°</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Type de verre</label>
                              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" value={glassesForm.lensType} onChange={(e) => setGlassesForm({ ...glassesForm, lensType: e.target.value })}>
                                <option value="">-- Sélectionner --</option>
                                {lensTypeOptions.map(opt => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Traitement</label>
                              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" value={glassesForm.coating} onChange={(e) => setGlassesForm({ ...glassesForm, coating: e.target.value })}>
                                <option value="">-- Sélectionner --</option>
                                {coatingOptions.map(opt => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <Input label="Type monture" value={glassesForm.frameType} onChange={(e) => setGlassesForm({ ...glassesForm, frameType: e.target.value })} placeholder="Ex: Métal, Plastique..." />
                            <Input label="Référence monture" value={glassesForm.frameReference} onChange={(e) => setGlassesForm({ ...glassesForm, frameReference: e.target.value })} placeholder="Ex: RAY-001" />
                          </div>

                          <Input label="Écart pupillaire (mm)" type="number" step="0.5" value={glassesForm.pupillaryDistance} onChange={(e) => setGlassesForm({ ...glassesForm, pupillaryDistance: e.target.value })} />

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notes pour l'atelier</label>
                            <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" rows={2} value={glassesForm.notes} onChange={(e) => setGlassesForm({ ...glassesForm, notes: e.target.value })} placeholder="Instructions spéciales..." />
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button onClick={handleGlassesOrder} isLoading={isLoading} className="flex-1 bg-purple-600 hover:bg-purple-700">
                              Créer la commande
                            </Button>
                            <Button variant="secondary" onClick={() => setShowGlassesModal(false)} className="flex-1">
                              Annuler
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}
