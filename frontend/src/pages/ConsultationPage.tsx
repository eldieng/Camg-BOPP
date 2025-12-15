import { useState, useEffect } from 'react';
import { Stethoscope, Phone, Play, Check, X, UserX, RefreshCw, Plus, Trash2 } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, Input } from '../components/ui';
import { queueService, QueueEntry, StationStats } from '../services/queue.service';
import { consultationService, CreateConsultationDto, CreatePrescriptionDto, PatientHistory } from '../services/consultation.service';
import { visionTestService } from '../services/visionTest.service';

export default function ConsultationPage() {
  
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [stats, setStats] = useState<StationStats | null>(null);
  const [currentPatient, setCurrentPatient] = useState<QueueEntry | null>(null);
  const [patientHistory, setPatientHistory] = useState<PatientHistory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'consultation' | 'history'>('consultation');

  // Formulaire consultation
  const [formData, setFormData] = useState<CreateConsultationDto>({
    patientId: '',
    chiefComplaint: '',
    diagnosis: '',
    notes: '',
    intraocularPressureOD: undefined,
    intraocularPressureOG: undefined,
    prescriptions: [],
  });

  const loadQueue = async () => {
    try {
      setError('');
      const data = await queueService.getQueue('CONSULTATION');
      setQueue(data.queue);
      setStats(data.stats);
      
      const inService = data.queue.find(e => e.status === 'IN_SERVICE');
      if (inService && !currentPatient) {
        setCurrentPatient(inService);
        setFormData(prev => ({ ...prev, patientId: inService.ticket.patient.id }));
        loadPatientHistory(inService.ticket.patient.id);
      }
    } catch (err) {
      console.error('Erreur chargement file:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    }
  };

  const loadPatientHistory = async (patientId: string) => {
    try {
      const history = await consultationService.getPatientHistory(patientId);
      setPatientHistory(history);
      
      // Charger le dernier test de vue
      const visionTests = await visionTestService.getByPatient(patientId);
      if (visionTests.length > 0) {
        setPatientHistory(prev => prev ? { ...prev, visionTests } : null);
      }
    } catch (err) {
      console.error('Erreur chargement historique:', err);
    }
  };

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleCallNext = async () => {
    setError('');
    setIsLoading(true);
    try {
      const entry = await queueService.callNext('CONSULTATION');
      if (entry) {
        setSuccess(`Patient ${entry.ticket.patient.lastName} appelé`);
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

  const handleStartService = async (entry: QueueEntry) => {
    setError('');
    setSuccess('');
    try {
      await queueService.startService(entry.id);
      setCurrentPatient(entry);
      setFormData(prev => ({ ...prev, patientId: entry.ticket.patient.id, queueEntryId: entry.id }));
      loadPatientHistory(entry.ticket.patient.id);
      setSuccess('Service démarré');
      setTimeout(() => setSuccess(''), 3000);
      loadQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const handleNoShow = async (entry: QueueEntry) => {
    setError('');
    setSuccess('');
    try {
      await queueService.markNoShow(entry.id);
      setSuccess('Patient marqué absent');
      setTimeout(() => setSuccess(''), 3000);
      loadQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const addPrescription = (eyeType: 'OD' | 'OG') => {
    const newPrescription: CreatePrescriptionDto = {
      eyeType,
      sphere: undefined,
      cylinder: undefined,
      axis: undefined,
      addition: undefined,
      lensType: '',
      coating: '',
    };
    setFormData(prev => ({
      ...prev,
      prescriptions: [...(prev.prescriptions || []), newPrescription],
    }));
  };

  const updatePrescription = (index: number, field: keyof CreatePrescriptionDto, value: any) => {
    setFormData(prev => ({
      ...prev,
      prescriptions: prev.prescriptions?.map((p, i) => i === index ? { ...p, [field]: value } : p),
    }));
  };

  const removePrescription = (index: number) => {
    setFormData(prev => ({
      ...prev,
      prescriptions: prev.prescriptions?.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent, sendToLunettes: boolean = false) => {
    e.preventDefault();
    if (!currentPatient) return;
    
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      await consultationService.create({
        ...formData,
        queueEntryId: currentPatient.id,
      });
      
      // Si prescription de lunettes, envoyer à la station Lunettes
      if (sendToLunettes) {
        await queueService.completeService(currentPatient.id, 'LUNETTES');
        setSuccess('Consultation enregistrée - Patient envoyé aux Lunettes');
      } else {
        await queueService.completeService(currentPatient.id);
        setSuccess('Consultation enregistrée - Parcours terminé');
      }
      
      setCurrentPatient(null);
      setPatientHistory(null);
      setFormData({
        patientId: '', chiefComplaint: '', diagnosis: '', notes: '',
        intraocularPressureOD: undefined, intraocularPressureOG: undefined,
        prescriptions: [],
      });
      setTimeout(() => setSuccess(''), 3000);
      loadQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Consultation Médicale</h1>
        <Button onClick={loadQueue} variant="secondary" leftIcon={<RefreshCw className="w-4 h-4" />}>
          Actualiser
        </Button>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-700">En attente</p>
            <p className="text-2xl font-bold text-yellow-800">{stats.waiting}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">En consultation</p>
            <p className="text-2xl font-bold text-blue-800">{stats.inService}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-sm text-green-700">Terminées</p>
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
              <CardTitle>File ({queue.filter(e => e.status === 'WAITING').length})</CardTitle>
              <Button 
                onClick={handleCallNext} 
                isLoading={isLoading} 
                leftIcon={<Phone className="w-4 h-4" />} 
                size="sm"
                disabled={
                  // Désactiver seulement si les 2 salles sont occupées
                  queue.filter(e => (e.status === 'CALLED' || e.status === 'IN_SERVICE')).length >= 2
                }
              >
                Suivant
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {queue.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Aucun patient</p>
              ) : (
                queue.map((entry) => (
                  <div key={entry.id} className={`p-3 rounded-lg border ${entry.status === 'IN_SERVICE' ? 'bg-blue-50 border-blue-300' : entry.status === 'CALLED' ? 'bg-orange-50 border-orange-300' : 'bg-gray-50'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{entry.ticket.patient.lastName} {entry.ticket.patient.firstName}</p>
                        <p className="text-xs text-gray-500">{entry.ticket.ticketNumber}</p>
                        <div className="flex gap-1 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${queueService.getStatusColor(entry.status)}`}>
                            {queueService.getStatusLabel(entry.status)}
                          </span>
                          {entry.roomNumber && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-semibold">
                              Salle {entry.roomNumber}
                            </span>
                          )}
                          {entry.ticket.priority !== 'NORMAL' && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                              entry.ticket.priority === 'EMERGENCY' ? 'bg-red-100 text-red-800' :
                              entry.ticket.priority === 'DISABLED' ? 'bg-purple-100 text-purple-800' :
                              entry.ticket.priority === 'PREGNANT' ? 'bg-pink-100 text-pink-800' :
                              entry.ticket.priority === 'ELDERLY' ? 'bg-amber-100 text-amber-800' : ''
                            }`}>
                              {entry.ticket.priority === 'EMERGENCY' ? '🚨 Urgence' :
                               entry.ticket.priority === 'DISABLED' ? '♿ PMR' :
                               entry.ticket.priority === 'PREGNANT' ? '🤰 Enceinte' :
                               entry.ticket.priority === 'ELDERLY' ? '👴 Senior' : entry.ticket.priority}
                            </span>
                          )}
                        </div>
                      </div>
                      {entry.status === 'CALLED' && (
                        <div className="flex flex-col space-y-1">
                          <Button size="sm" variant="success" onClick={() => handleStartService(entry)} leftIcon={<Play className="w-3 h-3" />}>
                            Démarrer
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => handleNoShow(entry)} leftIcon={<UserX className="w-3 h-3" />}>
                            Absent
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Consultation */}
        <div className="lg:col-span-2">
          <Card className={currentPatient ? 'border-2 border-blue-500' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Stethoscope className="w-5 h-5 mr-2" />
                  {currentPatient ? `${currentPatient.ticket.patient.lastName} ${currentPatient.ticket.patient.firstName}` : 'Sélectionnez un patient'}
                </CardTitle>
                {currentPatient && (
                  <div className="flex space-x-2">
                    <button onClick={() => setActiveTab('consultation')} className={`px-3 py-1 rounded ${activeTab === 'consultation' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}>
                      Consultation
                    </button>
                    <button onClick={() => setActiveTab('history')} className={`px-3 py-1 rounded ${activeTab === 'history' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}>
                      Historique
                    </button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!currentPatient ? (
                <p className="text-center text-gray-500 py-8">Appelez un patient pour commencer</p>
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
                          <p><strong>Notes:</strong> {c.notes || '-'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {(!patientHistory?.consultations?.length && !patientHistory?.visionTests?.length) && (
                    <p className="text-center text-gray-500">Aucun historique</p>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
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
                      <Button 
                        type="button" 
                        className="flex-1" 
                        isLoading={isLoading} 
                        onClick={(e) => handleSubmit(e, false)}
                        leftIcon={<Check className="w-5 h-5" />}
                      >
                        Terminer (Médicament)
                      </Button>
                      <Button 
                        type="button" 
                        variant="success"
                        className="flex-1" 
                        isLoading={isLoading} 
                        onClick={(e) => handleSubmit(e, true)}
                        leftIcon={<Stethoscope className="w-5 h-5" />}
                      >
                        Envoyer aux Lunettes
                      </Button>
                    </div>
                    <Button type="button" variant="secondary" onClick={() => { setCurrentPatient(null); setPatientHistory(null); }} leftIcon={<X className="w-5 h-5" />}>
                      Annuler
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
