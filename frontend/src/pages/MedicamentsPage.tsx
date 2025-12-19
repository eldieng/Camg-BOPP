import { useState, useEffect } from 'react';
import { Pill, Phone, User, Clock, CheckCircle, AlertCircle, RefreshCw, Calendar, X } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, Input } from '../components/ui';
import { queueService, QueueEntry, StationStats } from '../services/queue.service';

export default function MedicamentsPage() {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [stats, setStats] = useState<StationStats | null>(null);
  const [currentPatient, setCurrentPatient] = useState<QueueEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [appointmentData, setAppointmentData] = useState({
    scheduledDate: '',
    scheduledTime: '09:00',
    reason: 'Suivi traitement',
  });

  // Charger la file d'attente
  const loadQueue = async () => {
    try {
      setError('');
      const data = await queueService.getQueue('MEDICAMENTS');
      setQueue(data.queue);
      setStats(data.stats);
      
      // Trouver le patient en service
      const called = data.queue.find(q => q.status === 'CALLED');
      const inService = data.queue.find(q => q.status === 'IN_SERVICE');
      setCurrentPatient(inService || called || null);
    } catch (err) {
      console.error('Erreur chargement file:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    }
  };

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 10000);
    return () => clearInterval(interval);
  }, []);

  // Appeler le prochain patient
  const handleCallNext = async () => {
    setIsLoading(true);
    try {
      setError('');
      setSuccess('');
      const entry = await queueService.callNext('MEDICAMENTS');
      if (entry) {
        setCurrentPatient(entry);
        setSuccess('Patient appelé');
      } else {
        setSuccess('Aucun patient en attente');
      }
      loadQueue();
    } catch (err) {
      console.error('Erreur appel:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'appel');
    } finally {
      setIsLoading(false);
    }
  };

  // Démarrer le service
  const handleStartService = async () => {
    if (!currentPatient) return;
    setIsLoading(true);
    try {
      setError('');
      setSuccess('');
      await queueService.startService(currentPatient.id);
      setSuccess('Service démarré');
      loadQueue();
    } catch (err) {
      console.error('Erreur démarrage:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du démarrage');
    } finally {
      setIsLoading(false);
    }
  };

  // Terminer le service (fin du parcours patient)
  const handleComplete = async () => {
    if (!currentPatient) return;
    setIsLoading(true);
    try {
      setError('');
      setSuccess('');
      // Pas de prochaine station - le parcours est terminé
      await queueService.completeService(currentPatient.id);
      setCurrentPatient(null);
      setSuccess('Service terminé - Médicaments remis');
      loadQueue();
    } catch (err) {
      console.error('Erreur completion:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la complétion');
    } finally {
      setIsLoading(false);
    }
  };

  // Marquer absent
  const handleNoShow = async () => {
    if (!currentPatient) return;
    setIsLoading(true);
    try {
      setError('');
      setSuccess('');
      await queueService.markNoShow(currentPatient.id);
      setCurrentPatient(null);
      setSuccess('Patient marqué absent');
      loadQueue();
    } catch (err) {
      console.error('Erreur no-show:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du marquage absent');
    } finally {
      setIsLoading(false);
    }
  };

  // Créer un rendez-vous de suivi
  const handleCreateAppointment = async () => {
    if (!currentPatient || !appointmentData.scheduledDate) return;
    setError('');
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${apiUrl}/appointments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: currentPatient.ticket.patient.id,
          scheduledDate: appointmentData.scheduledDate,
          scheduledTime: appointmentData.scheduledTime,
          reason: appointmentData.reason || 'Suivi traitement',
        }),
      });

      if (response.ok) {
        setSuccess(`Rendez-vous créé pour le ${new Date(appointmentData.scheduledDate).toLocaleDateString('fr-FR')} à ${appointmentData.scheduledTime}`);
        setShowAppointmentModal(false);
        setAppointmentData({ scheduledDate: '', scheduledTime: '09:00', reason: 'Suivi traitement' });
      } else {
        const data = await response.json();
        setError(data.error?.message || 'Erreur lors de la création du rendez-vous');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setIsLoading(false);
    }
  };

  // Terminer avec RDV
  const handleCompleteWithAppointment = async () => {
    if (!currentPatient || !appointmentData.scheduledDate) return;
    setError('');
    setIsLoading(true);
    try {
      // Créer le RDV d'abord
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${apiUrl}/appointments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: currentPatient.ticket.patient.id,
          scheduledDate: appointmentData.scheduledDate,
          scheduledTime: appointmentData.scheduledTime,
          reason: appointmentData.reason || 'Suivi traitement',
        }),
      });

      if (response.ok) {
        // Puis terminer le service
        await queueService.completeService(currentPatient.id);
        setSuccess(`Service terminé - RDV créé pour le ${new Date(appointmentData.scheduledDate).toLocaleDateString('fr-FR')}`);
        setShowAppointmentModal(false);
        setAppointmentData({ scheduledDate: '', scheduledTime: '09:00', reason: 'Suivi traitement' });
        setCurrentPatient(null);
        loadQueue();
      } else {
        const data = await response.json();
        setError(data.error?.message || 'Erreur lors de la création du rendez-vous');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculer l'âge
  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const waitingPatients = queue.filter(q => q.status === 'WAITING');

  return (
    <div className="space-y-6">
      {success && (
        <div className="p-3 rounded-lg bg-green-50 text-green-800 border border-green-200">
          {success}
        </div>
      )}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-800 border border-red-200">
          {error}
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Pill className="w-6 sm:w-8 h-6 sm:h-8 text-teal-600" />
            Station Médicaments
          </h1>
          <p className="text-sm sm:text-base text-gray-600">Remise des médicaments prescrits</p>
        </div>
        <Button onClick={loadQueue} variant="secondary" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-yellow-600">{stats?.waiting || 0}</div>
            <div className="text-xs sm:text-sm text-gray-500">En attente</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-blue-600">{stats?.inService || 0}</div>
            <div className="text-xs sm:text-sm text-gray-500">En service</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-green-600">{stats?.completed || 0}</div>
            <div className="text-xs sm:text-sm text-gray-500">Terminés</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-gray-600">{stats?.avgWaitTime || 0} min</div>
            <div className="text-xs sm:text-sm text-gray-500">Attente moy.</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* File d'attente */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <CardTitle className="text-base sm:text-lg">File d'attente ({waitingPatients.length})</CardTitle>
              <Button onClick={handleCallNext} disabled={isLoading || waitingPatients.length === 0 || currentPatient !== null} size="sm" className="w-full sm:w-auto">
                <Phone className="w-4 h-4 mr-2" />
                Appeler suivant
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {waitingPatients.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Pill className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Aucun patient en attente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {waitingPatients.map((entry, idx) => (
                  <div
                    key={entry.id}
                    className={`p-3 rounded-lg border ${
                      idx === 0 ? 'border-teal-300 bg-teal-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">
                          {entry.ticket.patient.firstName} {entry.ticket.patient.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          Ticket: {entry.ticket.ticketNumber} • {calculateAge(entry.ticket.patient.dateOfBirth)} ans
                        </div>
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
                      <div className="text-right">
                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                          #{idx + 1}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Patient en cours */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Patient en cours</CardTitle>
          </CardHeader>
          <CardContent>
            {currentPatient ? (
              <div className="space-y-6">
                {/* Infos patient */}
                <div className="bg-teal-50 rounded-xl p-6">
                  <div className="flex items-center gap-3 sm:gap-4 mb-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-teal-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 sm:w-8 sm:h-8 text-teal-700" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                        {currentPatient.ticket.patient.firstName} {currentPatient.ticket.patient.lastName}
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600">
                        {calculateAge(currentPatient.ticket.patient.dateOfBirth)} ans • {currentPatient.ticket.ticketNumber}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <span className={`px-3 py-1 rounded-full ${
                      currentPatient.status === 'CALLED' 
                        ? 'bg-orange-100 text-orange-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {currentPatient.status === 'CALLED' ? 'Appelé' : 'En service'}
                    </span>
                    {currentPatient.ticket.priority !== 'NORMAL' && (
                      <span className="px-3 py-1 rounded-full bg-red-100 text-red-800">
                        Prioritaire
                      </span>
                    )}
                  </div>
                </div>

                {/* Checklist médicaments */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Vérifications</h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="w-5 h-5 rounded text-teal-600" />
                      <span>Vérifier l'ordonnance du médecin</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="w-5 h-5 rounded text-teal-600" />
                      <span>Contrôler les médicaments (nom, dosage, quantité)</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="w-5 h-5 rounded text-teal-600" />
                      <span>Vérifier les allergies du patient</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="w-5 h-5 rounded text-teal-600" />
                      <span>Expliquer la posologie et les effets secondaires</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="w-5 h-5 rounded text-teal-600" />
                      <span>Remettre les médicaments au patient</span>
                    </label>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  {currentPatient.status === 'CALLED' && (
                    <Button onClick={handleStartService} disabled={isLoading} className="w-full">
                      <Clock className="w-4 h-4 mr-2" />
                      Démarrer le service
                    </Button>
                  )}
                  {currentPatient.status === 'IN_SERVICE' && (
                    <>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button onClick={handleComplete} disabled={isLoading} variant="success" className="flex-1">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Terminer (sans RDV)
                        </Button>
                        <Button onClick={() => setShowAppointmentModal(true)} disabled={isLoading} className="flex-1 bg-teal-600 hover:bg-teal-700">
                          <Calendar className="w-4 h-4 mr-2" />
                          Terminer + Planifier RDV
                        </Button>
                      </div>
                    </>
                  )}
                  <Button onClick={handleNoShow} disabled={isLoading} variant="danger" className="w-full sm:w-auto">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Patient absent
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Pill className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">Aucun patient en cours</p>
                <p className="text-sm">Cliquez sur "Appeler suivant" pour commencer</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-teal-100 rounded-lg">
              <Pill className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Station Médicaments - Dernière étape</h4>
              <p className="text-sm text-gray-600 mt-1">
                Cette station est la dernière étape du parcours patient. Après la remise des médicaments, 
                vous pouvez planifier un rendez-vous de suivi si le traitement nécessite un contrôle.
                Assurez-vous de bien vérifier l'ordonnance et d'expliquer correctement la posologie.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal Rendez-vous de suivi */}
      {showAppointmentModal && currentPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Planifier un rendez-vous de suivi</h2>
              <button onClick={() => setShowAppointmentModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-teal-50 rounded-lg">
              <p className="font-medium">{currentPatient.ticket.patient.firstName} {currentPatient.ticket.patient.lastName}</p>
              <p className="text-sm text-gray-600">Ticket: {currentPatient.ticket.ticketNumber}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date du rendez-vous</label>
                <Input
                  type="date"
                  value={appointmentData.scheduledDate}
                  onChange={(e) => setAppointmentData({ ...appointmentData, scheduledDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Heure</label>
                <Input
                  type="time"
                  value={appointmentData.scheduledTime}
                  onChange={(e) => setAppointmentData({ ...appointmentData, scheduledTime: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motif</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  value={appointmentData.reason}
                  onChange={(e) => setAppointmentData({ ...appointmentData, reason: e.target.value })}
                >
                  <option value="Suivi traitement">Suivi traitement</option>
                  <option value="Contrôle">Contrôle</option>
                  <option value="Renouvellement ordonnance">Renouvellement ordonnance</option>
                  <option value="Vérification effets secondaires">Vérification effets secondaires</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowAppointmentModal(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  className="flex-1 bg-teal-600 hover:bg-teal-700"
                  onClick={handleCompleteWithAppointment}
                  isLoading={isLoading}
                  disabled={!appointmentData.scheduledDate}
                  leftIcon={<Calendar className="w-4 h-4" />}
                >
                  Terminer + Créer RDV
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
