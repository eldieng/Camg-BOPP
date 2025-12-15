import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AccueilPage from './pages/AccueilPage';
import TestVuePage from './pages/TestVuePage';
import ConsultationPage from './pages/ConsultationPage';
import StatsPage from './pages/StatsPage';
import SettingsPage from './pages/SettingsPage';
import PatientsPage from './pages/PatientsPage';
import DisplayPage from './pages/DisplayPage';
import RendezVousPage from './pages/RendezVousPage';
import LunettesPage from './pages/LunettesPage';
import PatientHistoryPage from './pages/PatientHistoryPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Routes publiques */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/display" element={<DisplayPage />} />

          {/* Routes protégées */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            
            {/* Module Accueil */}
            <Route path="accueil" element={
              <ProtectedRoute allowedRoles={['ACCUEIL', 'ADMIN']}>
                <AccueilPage />
              </ProtectedRoute>
            } />
            
            {/* Module Test de Vue */}
            <Route path="test-vue" element={
              <ProtectedRoute allowedRoles={['TEST_VUE', 'ADMIN']}>
                <TestVuePage />
              </ProtectedRoute>
            } />
            
            {/* Module Consultation */}
            <Route path="consultation" element={
              <ProtectedRoute allowedRoles={['MEDECIN', 'ADMIN']}>
                <ConsultationPage />
              </ProtectedRoute>
            } />
            
            {/* Module Statistiques */}
            <Route path="stats" element={<StatsPage />} />
            
            {/* Module Administration */}
            <Route path="settings" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <SettingsPage />
              </ProtectedRoute>
            } />
            
            {/* Module Patients */}
            <Route path="patients" element={<PatientsPage />} />
            <Route path="patients/:id/history" element={<PatientHistoryPage />} />
            
            {/* Module Rendez-vous */}
            <Route path="rendez-vous" element={
              <ProtectedRoute allowedRoles={['ACCUEIL', 'ADMIN']}>
                <RendezVousPage />
              </ProtectedRoute>
            } />
            
            {/* Module Lunettes */}
            <Route path="lunettes" element={
              <ProtectedRoute allowedRoles={['MEDECIN', 'ADMIN']}>
                <LunettesPage />
              </ProtectedRoute>
            } />
          </Route>

          {/* Redirection par défaut */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
