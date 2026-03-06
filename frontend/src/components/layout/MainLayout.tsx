import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui';
import {
  Eye,
  Home,
  Users,
  Ticket,
  TestTube,
  Stethoscope,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Calendar,
  Scissors,
  DoorOpen,
  ExternalLink,
  ShoppingCart,
} from 'lucide-react';
import { UserRole } from '../../types';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  {
    label: 'Tableau de bord',
    path: '/',
    icon: <Home className="w-5 h-5" />,
    roles: ['ACCUEIL', 'TEST_VUE', 'MEDECIN', 'LUNETTES', 'MEDICAMENTS', 'ADMIN'],
  },
  {
    label: 'Accueil / Tickets',
    path: '/accueil',
    icon: <Ticket className="w-5 h-5" />,
    roles: ['ACCUEIL', 'ADMIN'],
  },
  {
    label: 'Rendez-vous',
    path: '/rendez-vous',
    icon: <Calendar className="w-5 h-5" />,
    roles: ['ACCUEIL', 'ADMIN'],
  },
  {
    label: 'Patients',
    path: '/patients',
    icon: <Users className="w-5 h-5" />,
    roles: ['ACCUEIL', 'TEST_VUE', 'MEDECIN', 'LUNETTES', 'MEDICAMENTS', 'ADMIN'],
  },
  {
    label: 'Test de vue',
    path: '/test-vue',
    icon: <TestTube className="w-5 h-5" />,
    roles: ['TEST_VUE', 'ADMIN'],
  },
  {
    label: 'Consultation',
    path: '/consultation',
    icon: <Stethoscope className="w-5 h-5" />,
    roles: ['MEDECIN', 'ADMIN'],
  },
  {
    label: 'Lunettes',
    path: '/lunettes',
    icon: <Eye className="w-5 h-5" />,
    roles: ['LUNETTES', 'ADMIN'],
  },
  {
    label: 'Médicaments',
    path: '/medicaments',
    icon: <TestTube className="w-5 h-5" />,
    roles: ['MEDICAMENTS', 'ADMIN'],
  },
  {
    label: 'Bloc Opératoire',
    path: '/bloc-operatoire',
    icon: <Scissors className="w-5 h-5" />,
    roles: ['MEDECIN', 'BLOC', 'ADMIN'],
  },
  {
    label: 'Porte d\'entrée',
    path: '/porte',
    icon: <DoorOpen className="w-5 h-5" />,
    roles: ['PORTE', 'ACCUEIL', 'ADMIN'],
  },
  {
    label: 'Orientations',
    path: '/orientations',
    icon: <ExternalLink className="w-5 h-5" />,
    roles: ['MEDECIN', 'ADMIN'],
  },
  {
    label: 'Commandes',
    path: '/commandes',
    icon: <ShoppingCart className="w-5 h-5" />,
    roles: ['LUNETTES', 'MEDICAMENTS', 'BLOC', 'ADMIN'],
  },
  {
    label: 'Statistiques',
    path: '/stats',
    icon: <BarChart3 className="w-5 h-5" />,
    roles: ['ADMIN'],
  },
  {
    label: 'Rapports',
    path: '/reports',
    icon: <BarChart3 className="w-5 h-5" />,
    roles: ['ADMIN'],
  },
  {
    label: 'Paramètres',
    path: '/settings',
    icon: <Settings className="w-5 h-5" />,
    roles: ['ADMIN'],
  },
];

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const filteredNavItems = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  const getRoleBadge = (role: UserRole) => {
    const badges: Record<UserRole, { label: string; color: string }> = {
      ADMIN: { label: 'Admin', color: 'bg-red-100 text-red-800' },
      MEDECIN: { label: 'Médecin', color: 'bg-blue-100 text-blue-800' },
      TEST_VUE: { label: 'Test Vue', color: 'bg-green-100 text-green-800' },
      LUNETTES: { label: 'Lunettes', color: 'bg-purple-100 text-purple-800' },
      MEDICAMENTS: { label: 'Médicaments', color: 'bg-teal-100 text-teal-800' },
      BLOC: { label: 'Bloc Op.', color: 'bg-orange-100 text-orange-800' },
      PORTE: { label: 'Porte', color: 'bg-cyan-100 text-cyan-800' },
      ACCUEIL: { label: 'Accueil', color: 'bg-yellow-100 text-yellow-800' },
    };
    return badges[role];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo - Fixed at top */}
        <div className="flex items-center justify-between h-16 px-4 border-b flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Eye className="w-8 h-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">CAMG-BOPP</span>
          </div>
          <button
            className="lg:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto min-h-0">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center px-4 py-2.5 rounded-lg transition-colors text-sm ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              {item.icon}
              <span className="ml-3">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User info - Fixed at bottom */}
        <div className="p-4 border-t flex-shrink-0 bg-white">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-primary-700 font-semibold">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              {user && (
                <span
                  className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                    getRoleBadge(user.role).color
                  }`}
                >
                  {getRoleBadge(user.role).label}
                </span>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:bg-red-50"
            onClick={handleLogout}
            leftIcon={<LogOut className="w-5 h-5" />}
          >
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-white shadow-sm flex items-center px-4">
          <button
            className="lg:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex-1" />
          <div className="text-xs sm:text-sm text-gray-500 hidden sm:block">
            {new Date().toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
          <div className="text-xs text-gray-500 sm:hidden">
            {new Date().toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
            })}
          </div>
        </header>

        {/* Page content */}
        <main className="p-3 sm:p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
