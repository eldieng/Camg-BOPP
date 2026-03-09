import { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Key, Power, RefreshCw, X, Check, Monitor, ExternalLink } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, Input } from '../components/ui';
import { adminService, User, CreateUserDto, UserRole } from '../services/admin.service';

export default function SettingsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showResetPassword, setShowResetPassword] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const [formData, setFormData] = useState<CreateUserDto>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'ACCUEIL',
    assignedRoom: undefined,
  });

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getAllUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editingUser) {
        await adminService.updateUser(editingUser.id, {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
          assignedRoom: formData.assignedRoom,
        });
        setSuccess('Utilisateur mis à jour');
      } else {
        await adminService.createUser(formData);
        setSuccess('Utilisateur créé');
      }
      setShowForm(false);
      setEditingUser(null);
      setFormData({ email: '', password: '', firstName: '', lastName: '', role: 'ACCUEIL', assignedRoom: undefined });
      loadUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      assignedRoom: user.assignedRoom ?? undefined,
    });
    setShowForm(true);
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await adminService.toggleStatus(user.id);
      setSuccess(`Utilisateur ${user.isActive ? 'désactivé' : 'activé'}`);
      loadUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!newPassword || newPassword.length < 6) {
      setError('Mot de passe trop court (min 6 caractères)');
      return;
    }
    try {
      await adminService.resetPassword(userId, newPassword);
      setSuccess('Mot de passe réinitialisé');
      setShowResetPassword(null);
      setNewPassword('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Supprimer l'utilisateur ${user.firstName} ${user.lastName} ?`)) return;
    try {
      await adminService.deleteUser(user.id);
      setSuccess('Utilisateur supprimé');
      loadUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Administration</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button onClick={loadUsers} variant="secondary" leftIcon={<RefreshCw className="w-4 h-4" />} size="sm" className="w-full sm:w-auto">
            Actualiser
          </Button>
          <Button onClick={() => { setShowForm(true); setEditingUser(null); setFormData({ email: '', password: '', firstName: '', lastName: '', role: 'ACCUEIL' }); }} leftIcon={<Plus className="w-4 h-4" />} size="sm" className="w-full sm:w-auto">
            Nouvel utilisateur
          </Button>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}
      {success && <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">{success}</div>}

      {/* Formulaire */}
      {showForm && (
        <Card className="border-2 border-primary-500">
          <CardHeader>
            <CardTitle>{editingUser ? 'Modifier utilisateur' : 'Nouvel utilisateur'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Input label="Prénom" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required />
                <Input label="Nom" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required />
              </div>
              <Input type="email" label="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
              {!editingUser && (
                <Input type="password" label="Mot de passe" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}>
                    <option value="ACCUEIL">Accueil</option>
                    <option value="TEST_VUE">Test Vue</option>
                    <option value="MEDECIN">Médecin</option>
                    <option value="LUNETTES">Lunettes</option>
                    <option value="MEDICAMENTS">Médicaments</option>
                    <option value="BLOC">Bloc Opératoire</option>
                    <option value="PORTE">Porte d'entrée</option>
                    <option value="ADMIN">Administrateur</option>
                  </select>
                </div>
                {formData.role === 'MEDECIN' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Salle assignée</label>
                    <select 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg" 
                      value={formData.assignedRoom ?? ''} 
                      onChange={(e) => setFormData({ ...formData, assignedRoom: e.target.value ? parseInt(e.target.value) : undefined })}
                    >
                      <option value="">Non assignée</option>
                      <option value="1">Salle 1</option>
                      <option value="2">Salle 2</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button type="submit" leftIcon={<Check className="w-4 h-4" />} className="w-full sm:w-auto">
                  {editingUser ? 'Mettre à jour' : 'Créer'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setEditingUser(null); }} leftIcon={<X className="w-4 h-4" />} className="w-full sm:w-auto">
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Écran d'affichage public */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-purple-100 rounded-xl flex-shrink-0">
                <Monitor className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Écran d'affichage</h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Affiche les numéros appelés sur un écran/TV
                </p>
              </div>
            </div>
            <Button
              onClick={() => window.open('/display', '_blank')}
              leftIcon={<ExternalLink className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              Ouvrir l'écran
            </Button>
          </div>
          <div className="mt-4 p-3 bg-white/50 rounded-lg text-sm text-gray-600">
            <strong>💡 Conseil:</strong> Ouvrez cette page sur un écran dédié dans la salle d'attente. 
            Utilisez le mode plein écran (F11) pour une meilleure visibilité. 
            L'écran se met à jour automatiquement et annonce vocalement les patients appelés.
          </div>
        </CardContent>
      </Card>

      {/* Liste des utilisateurs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Utilisateurs ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3">Nom</th>
                    <th className="text-left py-3">Email</th>
                    <th className="text-center py-3">Rôle</th>
                    <th className="text-center py-3">Statut</th>
                    <th className="text-center py-3">Dernière connexion</th>
                    <th className="text-right py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 font-medium">{user.firstName} {user.lastName}</td>
                      <td className="py-3 text-gray-600">{user.email}</td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${adminService.getRoleColor(user.role)}`}>
                          {adminService.getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {user.isActive ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="py-3 text-center text-gray-500">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('fr-FR') : '-'}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex flex-wrap justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(user)} leftIcon={<Edit2 className="w-3 h-3" />} />
                          <Button size="sm" variant="ghost" onClick={() => setShowResetPassword(user.id)} leftIcon={<Key className="w-3 h-3" />} />
                          <Button size="sm" variant="ghost" onClick={() => handleToggleStatus(user)} leftIcon={<Power className="w-3 h-3" />} />
                          <Button size="sm" variant="danger" onClick={() => handleDelete(user)} leftIcon={<Trash2 className="w-3 h-3" />} />
                        </div>
                        {showResetPassword === user.id && (
                          <div className="mt-2 flex space-x-1">
                            <Input type="password" placeholder="Nouveau mot de passe" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                            <Button size="sm" onClick={() => handleResetPassword(user.id)}>OK</Button>
                            <Button size="sm" variant="secondary" onClick={() => setShowResetPassword(null)}>X</Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
