// src/App.js
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { restoreSession } from './store/slices/authSlice';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import TaskHistory from './components/TaskHistory';
import './App.css';
import Navbar from './components/Navbar';

// Composant pour protéger les routes authentifiées
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

// Composant pour rediriger les utilisateurs déjà connectés
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

// Layout avec Navbar pour les pages authentifiées
const AuthenticatedLayout = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  
  return (
    <div className="app-layout">
      <Navbar user={user} />
      {children}
    </div>
  );
};

// Page 404 moderne
const NotFound = () => {
  return (
    <div className="not-found-container">
      <div className="card not-found-content">
        <div className="not-found-icon">
          <svg fill="currentColor" viewBox="0 0 24 24" width="80" height="80">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
        </div>
        <h1 className="not-found-title">404</h1>
        <h2 className="not-found-subtitle">Page non trouvée</h2>
        <p className="not-found-text">
          La page que vous recherchez n'existe pas dans TeamTask.
        </p>
        <div className="not-found-actions">
          <a href="/dashboard" className="btn">
            Retour au Dashboard
          </a>
        </div>
      </div>
    </div>
  );
};

// Composant principal de l'application
const AppContent = () => {
  const dispatch = useDispatch();

  // Restaurer la session au démarrage de l'app
  useEffect(() => {
    dispatch(restoreSession());
  }, [dispatch]);

  return (
    <Routes>
      {/* Routes publiques */}
      <Route 
        path="/" 
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } 
      />
      
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } 
      />
      
      <Route 
        path="/register" 
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        } 
      />

      {/* Routes protégées avec layout */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <Dashboard />
            </AuthenticatedLayout>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/task-history" 
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <div className="main-content">
                <div className="page-header">
                  <h1 className="page-title">Historique des Tâches</h1>
                  <div className="breadcrumb">Catalyze > TeamTask > Historique</div>
                </div>
                <TaskHistory />
              </div>
            </AuthenticatedLayout>
          </ProtectedRoute>
        } 
      />

      {/* Route 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <div className="App">
        <AppContent />
      </div>
    </Router>
  );
}

export default App;