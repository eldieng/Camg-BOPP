import { useState, useEffect } from 'react';
import { Eye, Phone, Play, Check, X, UserX, RefreshCw } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, Input } from '../components/ui';
import { queueService, QueueEntry, StationStats } from '../services/queue.service';
import { visionTestService, CreateVisionTestDto } from '../services/visionTest.service';

export default function TestVuePage() {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [stats, setStats] = useState<StationStats | null>(null);
  const [currentPatient, setCurrentPatient] = useState<QueueEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Formulaire test de vue
  const [formData, setFormData] = useState<CreateVisionTestDto>({
    patientId: '',
    rightEye_acuity: '',
    rightEye_sphere: undefined,
    rightEye_cylinder: undefined,
    rightEye_axis: undefined,
    rightEye_addition: undefined,
    leftEye_acuity: '',
    leftEye_sphere: undefined,
    leftEye_cylinder: undefined,
    leftEye_axis: undefined,
    leftEye_addition: undefined,
    pupillaryDistance: undefined,
    notes: '',
  });

  const loadQueue = async () => {
    try {
      setError('');
      const data = await queueService.getQueue('TEST_VUE');
      setQueue(data.queue);
      setStats(data.stats);
      
      // Trouver le patient en cours de service
      const inService = data.queue.find(e => e.status === 'IN_SERVICE');
      if (inService && !currentPatient) {
        setCurrentPatient(inService);
        setFormData(prev => ({ ...prev, patientId: inService.ticket.patient.id }));
      }
    } catch (err) {
      console.error('Erreur chargement file:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
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
      const entry = await queueService.callNext('TEST_VUE');
      if (entry) {
        setSuccess(`Patient ${entry.ticket.patient.lastName} ${entry.ticket.patient.firstName} appelé`);
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

  const handleSubmitTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPatient) return;
    
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      await visionTestService.create({
        ...formData,
        queueEntryId: currentPatient.id,
      });
      
      setSuccess('Test enregistré, patient transféré vers consultation');
      setCurrentPatient(null);
      setFormData({
        patientId: '',
        rightEye_acuity: '', rightEye_sphere: undefined, rightEye_cylinder: undefined,
        rightEye_axis: undefined, rightEye_addition: undefined,
        leftEye_acuity: '', leftEye_sphere: undefined, leftEye_cylinder: undefined,
        leftEye_axis: undefined, leftEye_addition: undefined,
        pupillaryDistance: undefined, notes: '',
      });
      setTimeout(() => setSuccess(''), 3000);
      loadQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Test de Vue</h1>
        <Button onClick={loadQueue} variant="secondary" leftIcon={<RefreshCw className="w-4 h-4" />} size="sm">
          Actualiser
        </Button>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
          <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg border border-yellow-200">
            <p className="text-xs sm:text-sm text-yellow-700">En attente</p>
            <p className="text-xl sm:text-2xl font-bold text-yellow-800">{stats.waiting}</p>
          </div>
          <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
            <p className="text-xs sm:text-sm text-blue-700">En service</p>
            <p className="text-xl sm:text-2xl font-bold text-blue-800">{stats.inService}</p>
          </div>
          <div className="bg-green-50 p-3 sm:p-4 rounded-lg border border-green-200">
            <p className="text-xs sm:text-sm text-green-700">Terminés</p>
            <p className="text-xl sm:text-2xl font-bold text-green-800">{stats.completed}</p>
          </div>
          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border">
            <p className="text-xs sm:text-sm text-gray-600">Temps moyen</p>
            <p className="text-xl sm:text-2xl font-bold">{stats.avgWaitTime} min</p>
          </div>
        </div>
      )}

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}
      {success && <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">{success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* File d'attente */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <CardTitle className="text-base sm:text-lg">File d'attente ({queue.filter(e => e.status === 'WAITING').length})</CardTitle>
              <Button 
                onClick={handleCallNext} 
                isLoading={isLoading} 
                leftIcon={<Phone className="w-4 h-4" />} 
                size="sm" 
                className="w-full sm:w-auto"
                disabled={queue.some(e => e.status === 'CALLED' || e.status === 'IN_SERVICE')}
              >
                Appeler suivant
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
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm sm:text-base truncate">{entry.ticket.patient.lastName} {entry.ticket.patient.firstName}</p>
                        <p className="text-xs sm:text-sm text-gray-500">
                          {entry.ticket.ticketNumber} • {calculateAge(entry.ticket.patient.dateOfBirth)} ans
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${queueService.getStatusColor(entry.status)}`}>
                          {queueService.getStatusLabel(entry.status)}
                        </span>
                      </div>
                      {entry.status === 'CALLED' && (
                        <div className="flex gap-1 w-full sm:w-auto">
                          <Button size="sm" variant="success" onClick={() => handleStartService(entry)} leftIcon={<Play className="w-3 h-3" />} className="flex-1 sm:flex-none">
                            Démarrer
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => handleNoShow(entry)} leftIcon={<UserX className="w-3 h-3" />} className="flex-1 sm:flex-none">
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

        {/* Formulaire Test de Vue */}
        <Card className={currentPatient ? 'border-2 border-blue-500' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="w-5 h-5 mr-2" />
              {currentPatient ? `Test - ${currentPatient.ticket.patient.lastName} ${currentPatient.ticket.patient.firstName}` : 'Sélectionnez un patient'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!currentPatient ? (
              <p className="text-center text-gray-500 py-8">Appelez un patient et démarrez le service pour saisir le test</p>
            ) : (
              <form onSubmit={handleSubmitTest} className="space-y-4">
                {/* Œil Droit */}
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Œil Droit (OD)</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <Input label="Acuité" value={formData.rightEye_acuity || ''} onChange={(e) => setFormData({ ...formData, rightEye_acuity: e.target.value })} placeholder="10/10" />
                    <Input type="number" step="0.25" label="Sphère" value={formData.rightEye_sphere ?? ''} onChange={(e) => setFormData({ ...formData, rightEye_sphere: e.target.value ? parseFloat(e.target.value) : undefined })} />
                    <Input type="number" step="0.25" label="Cylindre" value={formData.rightEye_cylinder ?? ''} onChange={(e) => setFormData({ ...formData, rightEye_cylinder: e.target.value ? parseFloat(e.target.value) : undefined })} />
                    <Input type="number" label="Axe (°)" value={formData.rightEye_axis ?? ''} onChange={(e) => setFormData({ ...formData, rightEye_axis: e.target.value ? parseInt(e.target.value) : undefined })} />
                    <Input type="number" step="0.25" label="Addition" value={formData.rightEye_addition ?? ''} onChange={(e) => setFormData({ ...formData, rightEye_addition: e.target.value ? parseFloat(e.target.value) : undefined })} />
                  </div>
                </div>

                {/* Œil Gauche */}
                <div className="p-3 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">Œil Gauche (OG)</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <Input label="Acuité" value={formData.leftEye_acuity || ''} onChange={(e) => setFormData({ ...formData, leftEye_acuity: e.target.value })} placeholder="10/10" />
                    <Input type="number" step="0.25" label="Sphère" value={formData.leftEye_sphere ?? ''} onChange={(e) => setFormData({ ...formData, leftEye_sphere: e.target.value ? parseFloat(e.target.value) : undefined })} />
                    <Input type="number" step="0.25" label="Cylindre" value={formData.leftEye_cylinder ?? ''} onChange={(e) => setFormData({ ...formData, leftEye_cylinder: e.target.value ? parseFloat(e.target.value) : undefined })} />
                    <Input type="number" label="Axe (°)" value={formData.leftEye_axis ?? ''} onChange={(e) => setFormData({ ...formData, leftEye_axis: e.target.value ? parseInt(e.target.value) : undefined })} />
                    <Input type="number" step="0.25" label="Addition" value={formData.leftEye_addition ?? ''} onChange={(e) => setFormData({ ...formData, leftEye_addition: e.target.value ? parseFloat(e.target.value) : undefined })} />
                  </div>
                </div>

                {/* Autres mesures */}
                <div className="grid grid-cols-2 gap-4">
                  <Input type="number" step="0.5" label="Écart pupillaire (mm)" value={formData.pupillaryDistance ?? ''} onChange={(e) => setFormData({ ...formData, pupillaryDistance: e.target.value ? parseFloat(e.target.value) : undefined })} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea className="w-full px-4 py-2 border border-gray-300 rounded-lg" rows={2} value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button type="submit" className="flex-1" isLoading={isLoading} leftIcon={<Check className="w-5 h-5" />}>
                    Enregistrer & Transférer
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setCurrentPatient(null)} leftIcon={<X className="w-5 h-5" />} className="w-full sm:w-auto">
                    Annuler
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
