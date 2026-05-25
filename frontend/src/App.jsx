import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import { LanguageProvider } from './context/LanguageContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import GoogleAuthSuccess from './pages/GoogleAuthSuccess';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard       from './pages/Dashboard';
import FluxEnDirect    from './pages/FluxEnDirect';
import Rapports        from './pages/Rapports';
import Previsions      from './pages/Previsions';
import AnomaliesPage   from './pages/AnomaliesPage';
import ZonesPage       from './pages/ZonesPage';
import Recommandations from './pages/Recommandations';
import Parametres      from './pages/Parametres';

export default function App() {
  return (
    <LanguageProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />
        <Route path="/dashboard" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index                    element={<Dashboard />} />
          <Route path="flux"              element={<FluxEnDirect />} />
          <Route path="rapports"          element={<Rapports />} />
          <Route path="previsions"        element={<Previsions />} />
          <Route path="anomalies"         element={<AnomaliesPage />} />
          <Route path="zones"             element={<ZonesPage />} />
          <Route path="recommandations"   element={<Recommandations />} />
          <Route path="parametres"        element={<Parametres />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </LanguageProvider>
  );
}

