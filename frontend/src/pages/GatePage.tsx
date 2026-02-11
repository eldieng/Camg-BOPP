import { useState, useEffect } from 'react';
import { CheckCircle, UserX, ArrowRight, Plus, X, RefreshCw, Clock, Users } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Alert } from '../components/ui';
import {
  gateService,
  GateEntry,
  GateStats,
  gateStatusLabels,
  gateStatusColors,
  priorityLabels,
  priorityColors,
  priorityIcons,
} from '../services/gate.service';

export default function GatePage() {
  const [entries, setEntries] = useState<GateEntry[]>([]);
  const [stats, setStats] = useState<GateStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showWalkInForm, setShowWalkInForm] = useState(false);
  const [walkInForm, setWalkInForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    priority: 'NORMAL' as GateEntry['priority'],
    notes: '',
  });
  const [filter, setFilter] = useState<'all' | 'expected' | 'arrived'>('all');

  const loadList = async () => {
    try {
      const data = await gateService.getTodayList();
      setEntries(data.entries);
      setStats(data.stats);
    } catch (err) {
      console.error('Erreur chargement liste:', err);
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    }
  };

  useEffect(() => {
    loadList();
    const interval = setInterval(loadList, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(''), 4000); return () => clearTimeout(t); }
  }, [success]);
  useEffect(() => {
    if (error) { const t = setTimeout(() => setError(''), 6000); return () => clearTimeout(t); }
  }, [error]);

  const handleMarkArrived = async (entry: GateEntry) => {
    try {
      await gateService.markArrived(entry.id);
      setSuccess(`${entry.lastName} ${entry.firstName} - Arrivé ✓`);
      loadList();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const handleSendToAccueil = async (entry: GateEntry) => {
    try {
      await gateService.sendToAccueil(entry.id);
      setSuccess(`${entry.lastName} ${entry.firstName} - Envoyé à l'accueil`);
      loadList();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const handleMarkNoShow = async (entry: GateEntry) => {
    try {
      await gateService.markNoShow(entry.id);
      setSuccess(`${entry.lastName} ${entry.firstName} - Marqué absent`);
      loadList();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const handleAddWalkIn = async () => {
    if (!walkInForm.firstName || !walkInForm.lastName) {
      setError('Nom et prénom obligatoires');
      return;
    }
    setIsLoading(true);
    try {
      await gateService.addWalkIn({
        firstName: walkInForm.firstName,
        lastName: walkInForm.lastName,
        phone: walkInForm.phone || undefined,
        priority: walkInForm.priority,
        notes: walkInForm.notes || undefined,
      });
      setSuccess(`${walkInForm.lastName} ${walkInForm.firstName} ajouté (sans RDV)`);
      setShowWalkInForm(false);
      setWalkInForm({ firstName: '', lastName: '', phone: '', priority: 'NORMAL', notes: '' });
      loadList();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrer les entrées
  const filteredEntries = entries.filter(e => {
    if (filter === 'expected') return e.status === 'EXPECTED';
    if (filter === 'arrived') return e.status === 'ARRIVED' || e.status === 'SENT_TO_ACCUEIL';
    return e.status !== 'REGISTERED'; // all sauf déjà enregistrés
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Porte d'entrée - Pointage</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowWalkInForm(!showWalkInForm)} leftIcon={<Plus className="w-4 h-4" />} size="sm">
            Sans RDV
          </Button>
          <Button onClick={loadList} variant="secondary" leftIcon={<RefreshCw className="w-4 h-4" />} size="sm">
            Actualiser
          </Button>
        </div>
      </div>

      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          <div className="bg-white p-3 rounded-lg shadow-sm border text-center">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg border text-center">
            <p className="text-xs text-gray-500">Attendus</p>
            <p className="text-xl font-bold text-gray-600">{stats.expected}</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg border border-green-200 text-center">
            <p className="text-xs text-green-600">Arrivés</p>
            <p className="text-xl font-bold text-green-700">{stats.arrived}</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-center">
            <p className="text-xs text-blue-600">→ Accueil</p>
            <p className="text-xl font-bold text-blue-700">{stats.sentToAccueil}</p>
          </div>
          <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200 text-center">
            <p className="text-xs text-indigo-600">Enregistrés</p>
            <p className="text-xl font-bold text-indigo-700">{stats.registered}</p>
          </div>
          <div className="bg-red-50 p-3 rounded-lg border border-red-200 text-center">
            <p className="text-xs text-red-600">Absents</p>
            <p className="text-xl font-bold text-red-700">{stats.noShow}</p>
          </div>
        </div>
      )}

      {/* Walk-in form */}
      {showWalkInForm && (
        <Card className="border-2 border-primary-300">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Ajouter un patient sans RDV</CardTitle>
              <button onClick={() => setShowWalkInForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Prénom *" value={walkInForm.firstName} onChange={(e) => setWalkInForm({ ...walkInForm, firstName: e.target.value })} />
              <Input label="Nom *" value={walkInForm.lastName} onChange={(e) => setWalkInForm({ ...walkInForm, lastName: e.target.value })} />
            </div>
            <Input label="Téléphone" value={walkInForm.phone} onChange={(e) => setWalkInForm({ ...walkInForm, phone: e.target.value })} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                {(['NORMAL', 'ELDERLY', 'PREGNANT', 'DISABLED', 'EMERGENCY'] as const).map((p) => (
                  <label key={p} className={`flex items-center justify-center p-2 rounded border cursor-pointer text-sm ${
                    walkInForm.priority === p ? (priorityColors[p] || 'bg-primary-50 border-primary-300') : 'hover:bg-gray-50'
                  }`}>
                    <input type="radio" name="priority" checked={walkInForm.priority === p} onChange={() => setWalkInForm({ ...walkInForm, priority: p })} className="sr-only" />
                    {priorityIcons[p] && <span className="mr-1">{priorityIcons[p]}</span>}
                    {priorityLabels[p]}
                  </label>
                ))}
              </div>
            </div>
            <Button onClick={handleAddWalkIn} isLoading={isLoading} className="w-full">
              Ajouter et marquer arrivé
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 bg-white p-1 rounded-lg shadow-sm border">
        {([
          { key: 'all', label: 'Tous', icon: <Users className="w-4 h-4" /> },
          { key: 'expected', label: 'Attendus', icon: <Clock className="w-4 h-4" /> },
          { key: 'arrived', label: 'Arrivés', icon: <CheckCircle className="w-4 h-4" /> },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === tab.key ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Patient list */}
      <div className="space-y-2">
        {filteredEntries.map((entry) => (
          <Card key={entry.id} className={entry.status === 'ARRIVED' ? 'border-l-4 border-l-green-500' : entry.status === 'SENT_TO_ACCUEIL' ? 'border-l-4 border-l-blue-500' : ''}>
            <CardContent className="p-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-base">{entry.lastName} {entry.firstName}</p>
                    {entry.priority !== 'NORMAL' && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[entry.priority]}`}>
                        {priorityIcons[entry.priority]} {priorityLabels[entry.priority]}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-xs ${gateStatusColors[entry.status]}`}>
                      {gateStatusLabels[entry.status]}
                    </span>
                    {entry.isWalkIn && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700">Sans RDV</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    {entry.phone && <span>{entry.phone}</span>}
                    {entry.appointment && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {entry.appointment.scheduledTime} - {entry.appointment.reason || 'RDV'}
                      </span>
                    )}
                    {entry.arrivedAt && (
                      <span className="text-green-600">
                        Arrivé à {new Date(entry.arrivedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-1.5 flex-shrink-0">
                  {entry.status === 'EXPECTED' && (
                    <>
                      <Button size="sm" onClick={() => handleMarkArrived(entry)} leftIcon={<CheckCircle className="w-4 h-4" />}>
                        Arrivé
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleMarkNoShow(entry)} leftIcon={<UserX className="w-4 h-4" />}>
                        Absent
                      </Button>
                    </>
                  )}
                  {entry.status === 'ARRIVED' && (
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => handleSendToAccueil(entry)} leftIcon={<ArrowRight className="w-4 h-4" />}>
                      Envoyer à l'accueil
                    </Button>
                  )}
                  {entry.status === 'SENT_TO_ACCUEIL' && (
                    <span className="text-sm text-blue-600 font-medium px-2 py-1">En attente d'enregistrement...</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredEntries.length === 0 && (
          <p className="text-center text-gray-500 py-12">
            {filter === 'expected' ? 'Aucun patient attendu' :
             filter === 'arrived' ? 'Aucun patient arrivé' :
             'Aucun patient pour aujourd\'hui'}
          </p>
        )}
      </div>
    </div>
  );
}
