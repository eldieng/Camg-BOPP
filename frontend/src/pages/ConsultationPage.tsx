import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, RefreshCw, Users, DoorOpen } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent } from '../components/ui';
import { queueService, QueueEntry, StationStats } from '../services/queue.service';
import { useAuth } from '../contexts/AuthContext';

export default function ConsultationPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [stats, setStats] = useState<StationStats | null>(null);
  const [error, setError] = useState('');

  const waitingPatients = queue.filter(e => e.status === 'WAITING');
  const room1Patient = queue.find(e => (e.status === 'IN_SERVICE' || e.status === 'CALLED') && e.roomNumber === 1);
  const room2Patient = queue.find(e => (e.status === 'IN_SERVICE' || e.status === 'CALLED') && e.roomNumber === 2);

  const loadQueue = async () => {
    try {
      setError('');
      const data = await queueService.getQueue('CONSULTATION');
      setQueue(data.queue);
      setStats(data.stats);
    } catch (err) {
      console.error('Erreur chargement file:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    }
  };

  // Rediriger automatiquement vers la salle assignée si le médecin en a une
  useEffect(() => {
    if (user?.assignedRoom) {
      navigate(`/consultation/salle/${user.assignedRoom}`);
    }
  }, [user, navigate]);

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          <Stethoscope className="w-6 h-6 inline mr-2" />
          Consultation Médicale
        </h1>
        <Button onClick={loadQueue} variant="secondary" leftIcon={<RefreshCw className="w-4 h-4" />}>
          Actualiser
        </Button>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

      {/* Message d'instruction */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-800 font-medium">👨‍⚕️ Choisissez votre salle de consultation</p>
        <p className="text-blue-600 text-sm mt-1">
          Sélectionnez la salle qui vous est attribuée. Une fois dans la salle, vous pourrez appeler et consulter les patients.
          <strong> Restez dans la même salle pendant toute votre session.</strong>
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-700">En attente</p>
            <p className="text-2xl font-bold text-yellow-800">{waitingPatients.length}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">En consultation</p>
            <p className="text-2xl font-bold text-blue-800">{(room1Patient ? 1 : 0) + (room2Patient ? 1 : 0)}</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/consultation/salle/1')}>
          <CardHeader className="bg-blue-50">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <DoorOpen className="w-6 h-6 mr-2 text-blue-600" />
                Salle 1
              </span>
              {room1Patient ? (
                <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">🔵 Occupée</span>
              ) : (
                <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full">✅ Libre</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="py-6">
            {room1Patient ? (
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-800">{room1Patient.ticket.patient.lastName} {room1Patient.ticket.patient.firstName}</p>
                <p className="text-sm text-gray-500">{room1Patient.ticket.ticketNumber}</p>
                <p className="text-sm text-blue-600 mt-2">{room1Patient.status === 'CALLED' ? 'Patient appelé' : 'En consultation'}</p>
              </div>
            ) : (
              <p className="text-center text-gray-500">Aucun patient en cours</p>
            )}
            <Button className="w-full mt-4" variant={room1Patient ? 'primary' : 'success'}>
              {room1Patient ? 'Continuer la consultation' : 'Entrer en Salle 1'}
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/consultation/salle/2')}>
          <CardHeader className="bg-green-50">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <DoorOpen className="w-6 h-6 mr-2 text-green-600" />
                Salle 2
              </span>
              {room2Patient ? (
                <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full">🟢 Occupée</span>
              ) : (
                <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full">✅ Libre</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="py-6">
            {room2Patient ? (
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-800">{room2Patient.ticket.patient.lastName} {room2Patient.ticket.patient.firstName}</p>
                <p className="text-sm text-gray-500">{room2Patient.ticket.ticketNumber}</p>
                <p className="text-sm text-green-600 mt-2">{room2Patient.status === 'CALLED' ? 'Patient appelé' : 'En consultation'}</p>
              </div>
            ) : (
              <p className="text-center text-gray-500">Aucun patient en cours</p>
            )}
            <Button className="w-full mt-4" variant={room2Patient ? 'primary' : 'success'}>
              {room2Patient ? 'Continuer la consultation' : 'Entrer en Salle 2'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            File d'attente ({waitingPatients.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {waitingPatients.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Aucun patient en attente</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {waitingPatients.map((entry) => (
                <div key={entry.id} className="p-3 rounded-lg border bg-gray-50 text-center">
                  <p className="font-medium text-sm">{entry.ticket.patient.lastName}</p>
                  <p className="text-xs text-gray-500">{entry.ticket.ticketNumber}</p>
                  {entry.ticket.priority !== 'NORMAL' && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold inline-block mt-1 ${
                      entry.ticket.priority === 'EMERGENCY' ? 'bg-red-100 text-red-800' :
                      entry.ticket.priority === 'DISABLED' ? 'bg-purple-100 text-purple-800' :
                      entry.ticket.priority === 'PREGNANT' ? 'bg-pink-100 text-pink-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {entry.ticket.priority === 'EMERGENCY' ? '🚨' :
                       entry.ticket.priority === 'DISABLED' ? '♿' :
                       entry.ticket.priority === 'PREGNANT' ? '🤰' : '👴'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}