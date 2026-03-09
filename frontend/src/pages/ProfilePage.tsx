import { useState } from 'react';
import { User, Save, Lock, Eye, EyeOff } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Alert } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info');

  // Formulaire informations
  const [infoForm, setInfoForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });

  // Formulaire mot de passe
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const roleLabels: Record<string, string> = {
    ADMIN: 'Administrateur',
    MEDECIN: 'Médecin',
    ACCUEIL: 'Accueil',
    TEST_VUE: 'Test de Vue',
    LUNETTES: 'Lunettes',
    MEDICAMENTS: 'Médicaments',
    BLOC: 'Bloc Opératoire',
    PORTE: 'Porte d\'entrée',
  };

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await api.put<ApiResponse<unknown>>('/auth/profile', {
        firstName: infoForm.firstName,
        lastName: infoForm.lastName,
      });

      if (response.data.success) {
        setSuccess('Informations mises à jour avec succès');
        if (refreshUser) refreshUser();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError('Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.put<ApiResponse<unknown>>('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      if (response.data.success) {
        setSuccess('Mot de passe modifié avec succès');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mot de passe actuel incorrect');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
        <User className="w-6 h-6 text-primary-600" />
        Mon Profil
      </h1>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {/* Info utilisateur */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-600">
                {user.firstName[0]}{user.lastName[0]}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-semibold">{user.firstName} {user.lastName}</h2>
              <p className="text-gray-600">{user.email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 bg-primary-100 text-primary-800 rounded text-sm">
                {roleLabels[user.role] || user.role}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Onglets */}
      <div className="flex gap-2 border-b">
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'info' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('info')}
        >
          Informations
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'password' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('password')}
        >
          Mot de passe
        </button>
      </div>

      {/* Formulaire Informations */}
      {activeTab === 'info' && (
        <Card>
          <CardHeader>
            <CardTitle>Modifier mes informations</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateInfo} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Prénom"
                  value={infoForm.firstName}
                  onChange={(e) => setInfoForm({ ...infoForm, firstName: e.target.value })}
                  required
                />
                <Input
                  label="Nom"
                  value={infoForm.lastName}
                  onChange={(e) => setInfoForm({ ...infoForm, lastName: e.target.value })}
                  required
                />
              </div>
              <Input
                label="Email"
                type="email"
                value={infoForm.email}
                disabled
                className="bg-gray-100"
              />
              <p className="text-xs text-gray-500">L'email ne peut pas être modifié. Contactez un administrateur si nécessaire.</p>
              <Button type="submit" isLoading={isLoading} leftIcon={<Save className="w-4 h-4" />}>
                Enregistrer
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Formulaire Mot de passe */}
      {activeTab === 'password' && (
        <Card>
          <CardHeader>
            <CardTitle>Changer mon mot de passe</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="relative">
                <Input
                  label="Mot de passe actuel"
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-8 text-gray-500"
                  onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                >
                  {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="relative">
                <Input
                  label="Nouveau mot de passe"
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-8 text-gray-500"
                  onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                >
                  {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="relative">
                <Input
                  label="Confirmer le nouveau mot de passe"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-8 text-gray-500"
                  onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                >
                  {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Button type="submit" isLoading={isLoading} leftIcon={<Lock className="w-4 h-4" />}>
                Changer le mot de passe
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
