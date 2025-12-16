import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Plus, Edit2, Trash2, Eye, RefreshCw, X, Check, Filter, History } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, Input } from '../components/ui';
import { patientService, Patient, CreatePatientDto } from '../services/patient.service';
import { useAuth } from '../contexts/AuthContext';

export default function PatientsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Seuls ACCUEIL et ADMIN peuvent créer/modifier/supprimer des patients
  const canEdit = user?.role === 'ACCUEIL' || user?.role === 'ADMIN';
  const canDelete = user?.role === 'ADMIN';
  const [patients, setPatients] = useState<Patient[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    gender: '',
    ageMin: '',
    ageMax: '',
    hasVisitToday: false,
    isPregnant: false,
    isDisabled: false,
  });

  const [formData, setFormData] = useState<CreatePatientDto>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'MALE',
    phone: '',
    address: '',
    emergencyContact: '',
    isPregnant: false,
    isDisabled: false,
    notes: '',
  });

  const loadPatients = async (page = 1) => {
    setIsLoading(true);
    try {
      const data = await patientService.getAll({ search: searchQuery, page, limit: 20 });
      setPatients(data.patients);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      loadPatients(1);
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editingPatient) {
        await patientService.update(editingPatient.id, formData);
        setSuccess('Patient mis à jour');
      } else {
        await patientService.create(formData);
        setSuccess('Patient créé');
      }
      setShowForm(false);
      setEditingPatient(null);
      resetForm();
      loadPatients();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '', lastName: '', dateOfBirth: '', gender: 'MALE',
      phone: '', address: '', emergencyContact: '',
      isPregnant: false, isDisabled: false, notes: '',
    });
  };

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setFormData({
      firstName: patient.firstName,
      lastName: patient.lastName,
      dateOfBirth: patient.dateOfBirth.split('T')[0],
      gender: patient.gender,
      phone: patient.phone || '',
      address: patient.address || '',
      emergencyContact: patient.emergencyContact || '',
      isPregnant: patient.isPregnant,
      isDisabled: patient.isDisabled,
      notes: patient.notes || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (patient: Patient) => {
    if (!confirm(`Supprimer le patient ${patient.firstName} ${patient.lastName} ?`)) return;
    try {
      await patientService.delete(patient.id);
      setSuccess('Patient supprimé');
      loadPatients();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const calculateAge = (dob: string) => {
    const today = new Date();
    const birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
    return age;
  };

  // Appliquer les filtres côté client
  const filteredPatients = patients.filter(patient => {
    // Filtre par genre
    if (filters.gender && patient.gender !== filters.gender) return false;
    
    // Filtre par âge
    const age = calculateAge(patient.dateOfBirth);
    if (filters.ageMin && age < parseInt(filters.ageMin)) return false;
    if (filters.ageMax && age > parseInt(filters.ageMax)) return false;
    
    // Filtre enceinte
    if (filters.isPregnant && !patient.isPregnant) return false;
    
    // Filtre handicapé
    if (filters.isDisabled && !patient.isDisabled) return false;
    
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Patients</h1>
        <div className="flex space-x-2">
          <Button onClick={() => loadPatients()} variant="secondary" leftIcon={<RefreshCw className="w-4 h-4" />}>
            Actualiser
          </Button>
          {canEdit && (
            <Button onClick={() => { setShowForm(true); setEditingPatient(null); resetForm(); }} leftIcon={<Plus className="w-4 h-4" />}>
              Nouveau patient
            </Button>
          )}
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}
      {success && <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">{success}</div>}

      {/* Barre de recherche et filtres */}
      <div className="space-y-4">
        <div className="flex space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher par nom, prénom ou téléphone..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button 
            variant={showFilters ? 'primary' : 'secondary'} 
            onClick={() => setShowFilters(!showFilters)}
            leftIcon={<Filter className="w-4 h-4" />}
          >
            Filtres
          </Button>
        </div>

        {/* Filtres avancés */}
        {showFilters && (
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    value={filters.gender}
                    onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                  >
                    <option value="">Tous</option>
                    <option value="MALE">Homme</option>
                    <option value="FEMALE">Femme</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Âge min</label>
                  <input 
                    type="number" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="0"
                    value={filters.ageMin}
                    onChange={(e) => setFilters({ ...filters, ageMin: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Âge max</label>
                  <input 
                    type="number" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="100"
                    value={filters.ageMax}
                    onChange={(e) => setFilters({ ...filters, ageMax: e.target.value })}
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm">
                    <input 
                      type="checkbox" 
                      checked={filters.isPregnant}
                      onChange={(e) => setFilters({ ...filters, isPregnant: e.target.checked })}
                      className="rounded"
                    />
                    Enceinte
                  </label>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm">
                    <input 
                      type="checkbox" 
                      checked={filters.isDisabled}
                      onChange={(e) => setFilters({ ...filters, isDisabled: e.target.checked })}
                      className="rounded"
                    />
                    Handicapé
                  </label>
                </div>
                <div className="flex items-end">
                  <Button 
                    size="sm" 
                    variant="secondary"
                    onClick={() => setFilters({ gender: '', ageMin: '', ageMax: '', hasVisitToday: false, isPregnant: false, isDisabled: false })}
                  >
                    Réinitialiser
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Formulaire */}
      {showForm && (
        <Card className="border-2 border-primary-500">
          <CardHeader>
            <CardTitle>{editingPatient ? 'Modifier patient' : 'Nouveau patient'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Input label="Prénom *" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required />
                <Input label="Nom *" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required />
                <Input type="date" label="Date de naissance *" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Genre *</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'MALE' | 'FEMALE' })}>
                    <option value="MALE">Homme</option>
                    <option value="FEMALE">Femme</option>
                  </select>
                </div>
                <Input label="Téléphone" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                <Input label="Contact d'urgence" value={formData.emergencyContact || ''} onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })} />
              </div>
              <Input label="Adresse" value={formData.address || ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
              <div className="flex space-x-6">
                <label className="flex items-center">
                  <input type="checkbox" checked={formData.isPregnant} onChange={(e) => setFormData({ ...formData, isPregnant: e.target.checked })} className="mr-2" />
                  Femme enceinte
                </label>
                <label className="flex items-center">
                  <input type="checkbox" checked={formData.isDisabled} onChange={(e) => setFormData({ ...formData, isDisabled: e.target.checked })} className="mr-2" />
                  Personne handicapée
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea className="w-full px-4 py-2 border border-gray-300 rounded-lg" rows={2} value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
              </div>
              <div className="flex space-x-2">
                <Button type="submit" leftIcon={<Check className="w-4 h-4" />}>
                  {editingPatient ? 'Mettre à jour' : 'Créer'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setEditingPatient(null); }} leftIcon={<X className="w-4 h-4" />}>
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Détail patient */}
      {viewingPatient && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Détail du patient</CardTitle>
              <Button variant="ghost" onClick={() => setViewingPatient(null)} leftIcon={<X className="w-4 h-4" />} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Nom complet</p>
                <p className="font-medium">{viewingPatient.lastName} {viewingPatient.firstName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date de naissance</p>
                <p className="font-medium">{new Date(viewingPatient.dateOfBirth).toLocaleDateString('fr-FR')} ({calculateAge(viewingPatient.dateOfBirth)} ans)</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Genre</p>
                <p className="font-medium">{viewingPatient.gender === 'MALE' ? 'Homme' : 'Femme'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Téléphone</p>
                <p className="font-medium">{viewingPatient.phone || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Contact d'urgence</p>
                <p className="font-medium">{viewingPatient.emergencyContact || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Adresse</p>
                <p className="font-medium">{viewingPatient.address || '-'}</p>
              </div>
              <div className="col-span-2 md:col-span-3">
                <p className="text-sm text-gray-500">Statut</p>
                <div className="flex space-x-2 mt-1">
                  {viewingPatient.isPregnant && <span className="px-2 py-1 bg-pink-100 text-pink-800 rounded-full text-xs">Femme enceinte</span>}
                  {viewingPatient.isDisabled && <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">Personne handicapée</span>}
                  {!viewingPatient.isPregnant && !viewingPatient.isDisabled && <span className="text-gray-500">-</span>}
                </div>
              </div>
              {viewingPatient.notes && (
                <div className="col-span-2 md:col-span-3">
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="font-medium">{viewingPatient.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des patients */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Patients ({filteredPatients.length}{filteredPatients.length !== pagination.total ? ` / ${pagination.total}` : ''})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : patients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Aucun patient trouvé</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3">Nom</th>
                      <th className="text-left py-3">Date de naissance</th>
                      <th className="text-center py-3">Âge</th>
                      <th className="text-center py-3">Genre</th>
                      <th className="text-left py-3">Téléphone</th>
                      <th className="text-center py-3">Statut</th>
                      <th className="text-right py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPatients.map((patient) => (
                      <tr key={patient.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 font-medium">{patient.lastName} {patient.firstName}</td>
                        <td className="py-3">{new Date(patient.dateOfBirth).toLocaleDateString('fr-FR')}</td>
                        <td className="py-3 text-center">{calculateAge(patient.dateOfBirth)} ans</td>
                        <td className="py-3 text-center">{patient.gender === 'MALE' ? 'H' : 'F'}</td>
                        <td className="py-3">{patient.phone || '-'}</td>
                        <td className="py-3 text-center">
                          <div className="flex justify-center space-x-1">
                            {patient.isPregnant && <span className="px-1.5 py-0.5 bg-pink-100 text-pink-800 rounded text-xs">E</span>}
                            {patient.isDisabled && <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded text-xs">H</span>}
                          </div>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex justify-end space-x-1">
                            <Button size="sm" variant="ghost" onClick={() => setViewingPatient(patient)} leftIcon={<Eye className="w-3 h-3" />} />
                            <Button size="sm" variant="ghost" onClick={() => navigate(`/patients/${patient.id}/history`)} leftIcon={<History className="w-3 h-3" />} />
                            {canEdit && (
                              <Button size="sm" variant="ghost" onClick={() => handleEdit(patient)} leftIcon={<Edit2 className="w-3 h-3" />} />
                            )}
                            {canDelete && (
                              <Button size="sm" variant="danger" onClick={() => handleDelete(patient)} leftIcon={<Trash2 className="w-3 h-3" />} />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-4">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={pagination.page === 1}
                    onClick={() => loadPatients(pagination.page - 1)}
                  >
                    Précédent
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {pagination.page} sur {pagination.totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => loadPatients(pagination.page + 1)}
                  >
                    Suivant
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
