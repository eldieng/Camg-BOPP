import { useState, useEffect } from 'react';
import { ExternalLink, Plus, RefreshCw, Search, Phone, Calendar, User, Building2, AlertCircle, CheckCircle, Clock, X } from 'lucide-react';
import { Button, Card, CardContent, Input, Alert } from '../components/ui';
import { referralService, Referral, ReferralStatus, ReferralReason, CreateReferralDto, referralReasonLabels, referralStatusLabels, referralStatusColors } from '../services/referral.service';
import { patientService, Patient } from '../services/patient.service';

export default function OrientationsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [filterStatus, setFilterStatus] = useState<ReferralStatus | ''>('');
  
  // Recherche patient
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Formulaire création
  const [formData, setFormData] = useState<Partial<CreateReferralDto>>({
    reason: 'SERVICE_UNAVAILABLE',
    serviceNeeded: '',
    externalClinic: '',
    externalDoctor: '',
    externalPhone: '',
    diagnosis: '',
    notes: '',
  });

  const loadReferrals = async () => {
    try {
      setIsLoading(true);
      setError('');
      const filters: any = {};
      if (filterStatus) filters.status = filterStatus;
      const data = await referralService.getAll(filters);
      setReferrals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReferrals();
  }, [filterStatus]);

  // Recherche patient
  useEffect(() => {
    const search = async () => {
      if (patientSearch.length < 2) {
        setPatientResults([]);
        return;
      }
      try {
        const results = await patientService.quickSearch(patientSearch);
        setPatientResults(results);
      } catch (err) {
        console.error('Erreur recherche patient:', err);
      }
    };
    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [patientSearch]);

  const handleCreate = async () => {
    if (!selectedPatient) {
      setError('Veuillez sélectionner un patient');
      return;
    }
    if (!formData.serviceNeeded || !formData.externalClinic) {
      setError('Service requis et structure externe sont obligatoires');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      await referralService.create({
        patientId: selectedPatient.id,
        reason: formData.reason as ReferralReason,
        serviceNeeded: formData.serviceNeeded!,
        externalClinic: formData.externalClinic!,
        externalDoctor: formData.externalDoctor,
        externalPhone: formData.externalPhone,
        diagnosis: formData.diagnosis,
        notes: formData.notes,
      });
      setSuccess('Orientation créée avec succès');
      setShowCreateModal(false);
      resetForm();
      loadReferrals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: ReferralStatus) => {
    try {
      setIsLoading(true);
      await referralService.updateStatus(id, status);
      setSuccess('Statut mis à jour');
      loadReferrals();
      setSelectedReferral(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      reason: 'SERVICE_UNAVAILABLE',
      serviceNeeded: '',
      externalClinic: '',
      externalDoctor: '',
      externalPhone: '',
      diagnosis: '',
      notes: '',
    });
    setSelectedPatient(null);
    setPatientSearch('');
    setPatientResults([]);
  };

  const getStatusIcon = (status: ReferralStatus) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-4 h-4" />;
      case 'IN_PROGRESS': return <RefreshCw className="w-4 h-4" />;
      case 'COMPLETED': return <CheckCircle className="w-4 h-4" />;
      case 'CANCELLED': return <X className="w-4 h-4" />;
      case 'LOST': return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ExternalLink className="w-6 h-6 text-orange-600" />
          Orientations Patients
        </h1>
        <div className="flex gap-2">
          <Button onClick={loadReferrals} variant="secondary" leftIcon={<RefreshCw className="w-4 h-4" />} size="sm" isLoading={isLoading}>
            Actualiser
          </Button>
          <Button onClick={() => setShowCreateModal(true)} leftIcon={<Plus className="w-4 h-4" />} size="sm">
            Nouvelle orientation
          </Button>
        </div>
      </div>

      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Filtres */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4 items-center">
            <span className="text-sm font-medium text-gray-700">Filtrer par statut:</span>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterStatus('')}
                className={`px-3 py-1 text-sm rounded-full transition ${!filterStatus ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                Tous
              </button>
              {(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'LOST'] as ReferralStatus[]).map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1 text-sm rounded-full transition ${filterStatus === status ? referralStatusColors[status] : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  {referralStatusLabels[status]}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des orientations */}
      <div className="grid gap-4">
        {referrals.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              Aucune orientation trouvée
            </CardContent>
          </Card>
        ) : (
          referrals.map(referral => (
            <Card key={referral.id} className="hover:shadow-md transition cursor-pointer" onClick={() => setSelectedReferral(referral)}>
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="w-5 h-5 text-gray-400" />
                      <span className="font-semibold text-lg">{referral.patient.lastName} {referral.patient.firstName}</span>
                      <span className="text-xs text-gray-500 font-mono">{referral.patient.registrationNumber}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 ${referralStatusColors[referral.status]}`}>
                        {getStatusIcon(referral.status)}
                        {referralStatusLabels[referral.status]}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                        <span><strong>Service:</strong> {referral.serviceNeeded}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-500" />
                        <span><strong>Structure:</strong> {referral.externalClinic}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{new Date(referral.referralDate).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{referralReasonLabels[referral.reason]}</span>
                      </div>
                    </div>
                    {referral.diagnosis && (
                      <p className="mt-2 text-sm text-gray-700"><strong>Diagnostic:</strong> {referral.diagnosis}</p>
                    )}
                  </div>
                  {referral.patient.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Phone className="w-4 h-4" />
                      {referral.patient.phone}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal création */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Nouvelle Orientation</h2>
              <button onClick={() => { setShowCreateModal(false); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Recherche patient */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient *</label>
                {selectedPatient ? (
                  <div className="p-3 bg-primary-50 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-medium">{selectedPatient.lastName} {selectedPatient.firstName}</p>
                      <p className="text-sm text-gray-500">{selectedPatient.registrationNumber}</p>
                    </div>
                    <button onClick={() => setSelectedPatient(null)} className="text-red-500 hover:text-red-700">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Rechercher un patient..."
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                      />
                    </div>
                    {patientResults.length > 0 && (
                      <div className="mt-2 border rounded-lg divide-y max-h-40 overflow-y-auto">
                        {patientResults.map(p => (
                          <button
                            key={p.id}
                            onClick={() => { setSelectedPatient(p); setPatientResults([]); setPatientSearch(''); }}
                            className="w-full p-2 text-left hover:bg-gray-50"
                          >
                            <p className="font-medium">{p.lastName} {p.firstName}</p>
                            <p className="text-xs text-gray-500">{p.registrationNumber}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Raison */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Raison de l'orientation *</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value as ReferralReason })}
                >
                  {Object.entries(referralReasonLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Service requis */}
              <Input
                label="Service requis *"
                placeholder="Ex: Chirurgie rétine, IRM, Scanner..."
                value={formData.serviceNeeded || ''}
                onChange={(e) => setFormData({ ...formData, serviceNeeded: e.target.value })}
              />

              {/* Structure externe */}
              <Input
                label="Structure externe *"
                placeholder="Nom de l'hôpital/clinique"
                value={formData.externalClinic || ''}
                onChange={(e) => setFormData({ ...formData, externalClinic: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Médecin externe"
                  placeholder="Dr..."
                  value={formData.externalDoctor || ''}
                  onChange={(e) => setFormData({ ...formData, externalDoctor: e.target.value })}
                />
                <Input
                  label="Téléphone"
                  placeholder="Numéro de contact"
                  value={formData.externalPhone || ''}
                  onChange={(e) => setFormData({ ...formData, externalPhone: e.target.value })}
                />
              </div>

              <Input
                label="Diagnostic"
                placeholder="Diagnostic initial"
                value={formData.diagnosis || ''}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="Notes supplémentaires..."
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <Button variant="secondary" onClick={() => { setShowCreateModal(false); resetForm(); }}>Annuler</Button>
              <Button onClick={handleCreate} isLoading={isLoading}>Créer l'orientation</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal détail */}
      {selectedReferral && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Détail de l'orientation</h2>
              <button onClick={() => setSelectedReferral(null)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">{selectedReferral.patient.lastName} {selectedReferral.patient.firstName}</h3>
                <p className="text-sm text-gray-500">{selectedReferral.patient.registrationNumber}</p>
                {selectedReferral.patient.phone && (
                  <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                    <Phone className="w-4 h-4" /> {selectedReferral.patient.phone}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Statut</p>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${referralStatusColors[selectedReferral.status]}`}>
                    {getStatusIcon(selectedReferral.status)}
                    {referralStatusLabels[selectedReferral.status]}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date d'orientation</p>
                  <p className="font-medium">{new Date(selectedReferral.referralDate).toLocaleDateString('fr-FR')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Raison</p>
                  <p className="font-medium">{referralReasonLabels[selectedReferral.reason]}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Service requis</p>
                  <p className="font-medium">{selectedReferral.serviceNeeded}</p>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 flex items-center gap-2 mb-2">
                  <Building2 className="w-5 h-5" />
                  Structure externe
                </h4>
                <p className="font-medium">{selectedReferral.externalClinic}</p>
                {selectedReferral.externalDoctor && <p className="text-sm">Dr. {selectedReferral.externalDoctor}</p>}
                {selectedReferral.externalPhone && (
                  <p className="text-sm flex items-center gap-1 mt-1">
                    <Phone className="w-4 h-4" /> {selectedReferral.externalPhone}
                  </p>
                )}
              </div>

              {selectedReferral.diagnosis && (
                <div>
                  <p className="text-sm text-gray-500">Diagnostic</p>
                  <p className="font-medium">{selectedReferral.diagnosis}</p>
                </div>
              )}

              {selectedReferral.notes && (
                <div>
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="text-gray-700">{selectedReferral.notes}</p>
                </div>
              )}

              {/* Actions de changement de statut */}
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Changer le statut:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedReferral.status === 'PENDING' && (
                    <Button size="sm" onClick={() => handleUpdateStatus(selectedReferral.id, 'IN_PROGRESS')}>
                      Marquer en cours
                    </Button>
                  )}
                  {(selectedReferral.status === 'PENDING' || selectedReferral.status === 'IN_PROGRESS') && (
                    <>
                      <Button size="sm" variant="success" onClick={() => handleUpdateStatus(selectedReferral.id, 'COMPLETED')}>
                        Marquer terminé
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => handleUpdateStatus(selectedReferral.id, 'CANCELLED')}>
                        Annuler
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleUpdateStatus(selectedReferral.id, 'LOST')}>
                        Perdu de vue
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end">
              <Button variant="secondary" onClick={() => setSelectedReferral(null)}>Fermer</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
