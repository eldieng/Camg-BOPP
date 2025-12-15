import { useState, useEffect } from 'react';
import { Glasses, Phone, User, Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent } from '../components/ui';
import { queueService, QueueEntry, StationStats } from '../services/queue.service';

export default function LunettesPage() {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [stats, setStats] = useState<StationStats | null>(null);
  const [currentPatient, setCurrentPatient] = useState<QueueEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Charger la file d'attente
  const loadQueue = async () => {
    try {
      setError('');
      const data = await queueService.getQueue('LUNETTES');
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
      const entry = await queueService.callNext('LUNETTES');
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
      setSuccess('Service terminé');
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
            <Glasses className="w-6 sm:w-8 h-6 sm:h-8 text-purple-600" />
            Station Lunettes
          </h1>
          <p className="text-sm sm:text-base text-gray-600">Remise et ajustement des lunettes</p>
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
              <Button onClick={handleCallNext} disabled={isLoading || waitingPatients.length === 0} size="sm" className="w-full sm:w-auto">
                <Phone className="w-4 h-4 mr-2" />
                Appeler suivant
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {waitingPatients.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Glasses className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Aucun patient en attente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {waitingPatients.map((entry, idx) => (
                  <div
                    key={entry.id}
                    className={`p-3 rounded-lg border ${
                      idx === 0 ? 'border-purple-300 bg-purple-50' : 'border-gray-200 bg-white'
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
                <div className="bg-purple-50 rounded-xl p-6">
                  <div className="flex items-center gap-3 sm:gap-4 mb-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 sm:w-8 sm:h-8 text-purple-700" />
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

                {/* Checklist lunettes */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Vérifications</h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="w-5 h-5 rounded text-purple-600" />
                      <span>Vérifier la prescription</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="w-5 h-5 rounded text-purple-600" />
                      <span>Contrôler les verres (sphère, cylindre, axe)</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="w-5 h-5 rounded text-purple-600" />
                      <span>Ajuster la monture</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="w-5 h-5 rounded text-purple-600" />
                      <span>Expliquer l'entretien des lunettes</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="w-5 h-5 rounded text-purple-600" />
                      <span>Remettre l'étui et le chiffon</span>
                    </label>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  {currentPatient.status === 'CALLED' && (
                    <Button onClick={handleStartService} disabled={isLoading} className="flex-1">
                      <Clock className="w-4 h-4 mr-2" />
                      Démarrer
                    </Button>
                  )}
                  {currentPatient.status === 'IN_SERVICE' && (
                    <Button onClick={handleComplete} disabled={isLoading} variant="success" className="flex-1">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Terminer
                    </Button>
                  )}
                  <Button onClick={handleNoShow} disabled={isLoading} variant="danger" className="w-full sm:w-auto">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Absent
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Glasses className="w-16 h-16 mx-auto mb-4 text-gray-300" />
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
            <div className="p-2 bg-purple-100 rounded-lg">
              <Glasses className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Station Lunettes - Dernière étape</h4>
              <p className="text-sm text-gray-600 mt-1">
                Cette station est la dernière étape du parcours patient. Après la remise des lunettes, 
                le patient a terminé sa visite au dispensaire. Assurez-vous de bien vérifier la prescription 
                et d'ajuster correctement la monture avant de terminer.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
