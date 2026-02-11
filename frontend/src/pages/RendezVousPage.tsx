import { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Search, Check, X, AlertCircle, User } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, Input } from '../components/ui';
import { patientService, Patient } from '../services/patient.service';
import { api } from '../services/api';

interface Appointment {
  id: string;
  patientId: string;
  scheduledDate: string;
  scheduledTime: string;
  reason: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
  notes?: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
}

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Programmé',
  CONFIRMED: 'Confirmé',
  CANCELLED: 'Annulé',
  COMPLETED: 'Effectué',
  NO_SHOW: 'Absent',
};

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  NO_SHOW: 'bg-orange-100 text-orange-800',
};

export default function RendezVousPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [viewMode, setViewMode] = useState<'upcoming' | 'date'>('upcoming');
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState({
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: '09:00',
    reason: '',
    notes: '',
  });

  // Charger les rendez-vous
  const loadAppointments = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (viewMode === 'upcoming') params.upcoming = 'true';
      else if (selectedDate) params.date = selectedDate;

      const response = await api.get('/appointments', { params });
      if (response.data.success) {
        setAppointments(response.data.data || []);
      }
    } catch (err) {
      console.error('Erreur chargement rendez-vous:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [selectedDate, viewMode]);

  // Recherche de patients
  useEffect(() => {
    const search = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      try {
        const results = await patientService.quickSearch(searchQuery);
        setSearchResults(results);
      } catch (err) {
        console.error('Erreur recherche:', err);
      }
    };
    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  // Créer un rendez-vous
  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    try {
      const response = await api.post('/appointments', {
        patientId: selectedPatient.id,
        ...formData,
      });

      if (response.data.success) {
        setShowCreateModal(false);
        setSelectedPatient(null);
        setSearchQuery('');
        setFormData({
          scheduledDate: new Date().toISOString().split('T')[0],
          scheduledTime: '09:00',
          reason: '',
          notes: '',
        });
        loadAppointments();
      }
    } catch (err) {
      console.error('Erreur création rendez-vous:', err);
    }
  };

  // Mettre à jour le statut
  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/appointments/${id}`, { status });
      loadAppointments();
    } catch (err) {
      console.error('Erreur mise à jour:', err);
    }
  };

  // Convertir en ticket (patient arrivé)
  const convertToTicket = async (appointment: Appointment) => {
    try {
      const response = await api.post('/tickets', {
        patientId: appointment.patientId,
      });

      if (response.data.success) {
        // Marquer le rendez-vous comme effectué
        await updateStatus(appointment.id, 'COMPLETED');
        alert(`Ticket créé pour ${appointment.patient.firstName} ${appointment.patient.lastName}`);
      }
    } catch (err) {
      console.error('Erreur conversion:', err);
    }
  };

  // Statistiques du jour
  const stats = {
    total: appointments.length,
    scheduled: appointments.filter(a => a.status === 'SCHEDULED').length,
    confirmed: appointments.filter(a => a.status === 'CONFIRMED').length,
    completed: appointments.filter(a => a.status === 'COMPLETED').length,
    noShow: appointments.filter(a => a.status === 'NO_SHOW').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rendez-vous</h1>
          <p className="text-gray-600">Gestion des rendez-vous patients</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau rendez-vous
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-500">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.scheduled}</div>
            <div className="text-sm text-gray-500">Programmés</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-green-600">{stats.confirmed}</div>
            <div className="text-sm text-gray-500">Confirmés</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-gray-600">{stats.completed}</div>
            <div className="text-sm text-gray-500">Effectués</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-orange-600">{stats.noShow}</div>
            <div className="text-sm text-gray-500">Absents</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('upcoming')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'upcoming'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                À venir
              </button>
              <button
                onClick={() => {
                  setViewMode('date');
                  if (!selectedDate) {
                    setSelectedDate(new Date().toISOString().split('T')[0]);
                  }
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'date'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Par date
              </button>
            </div>
            {viewMode === 'date' && (
              <>
                <Calendar className="w-5 h-5 text-gray-500" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-48"
                />
                <span className="text-gray-600">
                  {selectedDate && new Date(selectedDate).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Liste des rendez-vous */}
      <Card>
        <CardHeader>
          <CardTitle>
            {viewMode === 'upcoming' ? 'Rendez-vous à venir' : 'Rendez-vous du jour'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Chargement...</div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>{viewMode === 'upcoming' ? 'Aucun rendez-vous à venir' : 'Aucun rendez-vous pour cette date'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments
                .sort((a, b) => {
                  // Trier par date puis par heure
                  const dateCompare = a.scheduledDate.localeCompare(b.scheduledDate);
                  if (dateCompare !== 0) return dateCompare;
                  return a.scheduledTime.localeCompare(b.scheduledTime);
                })
                .map((appointment) => {
                  const aptDate = new Date(appointment.scheduledDate);
                  const dateStr = aptDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
                  return (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center bg-white p-2 rounded-lg shadow-sm min-w-[80px]">
                        {viewMode === 'upcoming' && (
                          <div className="text-xs text-primary-600 font-medium mb-1">{dateStr}</div>
                        )}
                        <Clock className="w-4 h-4 mx-auto text-gray-400 mb-1" />
                        <div className="font-bold text-lg">{appointment.scheduledTime}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {appointment.patient.firstName} {appointment.patient.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {appointment.reason || 'Consultation'}
                        </div>
                        {appointment.patient.phone && (
                          <div className="text-sm text-gray-400">{appointment.patient.phone}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[appointment.status]}`}>
                        {STATUS_LABELS[appointment.status]}
                      </span>

                      {appointment.status === 'SCHEDULED' && (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => updateStatus(appointment.id, 'CONFIRMED')}
                            title="Confirmer"
                          >
                            <Check className="w-4 h-4 text-green-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => updateStatus(appointment.id, 'CANCELLED')}
                            title="Annuler"
                          >
                            <X className="w-4 h-4 text-red-600" />
                          </Button>
                        </>
                      )}

                      {(appointment.status === 'SCHEDULED' || appointment.status === 'CONFIRMED') && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => convertToTicket(appointment)}
                            title="Patient arrivé - Créer ticket"
                          >
                            <User className="w-4 h-4 mr-1" />
                            Arrivé
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => updateStatus(appointment.id, 'NO_SHOW')}
                            title="Marquer absent"
                          >
                            <AlertCircle className="w-4 h-4 text-orange-600" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal création rendez-vous */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Nouveau rendez-vous</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4">
              {/* Recherche patient */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                {selectedPatient ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="font-medium">
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedPatient(null)}
                      className="text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Rechercher un patient..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                    {searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto z-10">
                        {searchResults.map((patient) => (
                          <button
                            key={patient.id}
                            type="button"
                            onClick={() => {
                              setSelectedPatient(patient);
                              setSearchQuery('');
                              setSearchResults([]);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50"
                          >
                            {patient.firstName} {patient.lastName}
                            {patient.phone && <span className="text-gray-400 ml-2">{patient.phone}</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Date et heure */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <Input
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Heure</label>
                  <Input
                    type="time"
                    value={formData.scheduledTime}
                    onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Motif */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motif</label>
                <Input
                  placeholder="Ex: Contrôle annuel, Renouvellement lunettes..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Notes supplémentaires..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowCreateModal(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" className="flex-1" disabled={!selectedPatient}>
                  Créer le rendez-vous
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
