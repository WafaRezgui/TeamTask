// src/pages/LoginPage.js
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser, clearError } from '../store/slices/authSlice';

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated } = useSelector((state) => state.auth);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Redirection si déjà connecté
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Nettoyer les erreurs quand on quitte la page
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    dispatch(loginUser({ username: username.trim(), password }));
  };

  return (
    <div className="login-container">
      {/* Contenu principal centré */}
      <div className="login-content">
        {/* Logo grand à côté du titre */}
        <div className="login-header">
          <div className="logo-large">C</div>
          <div className="title-section">
            <h1 className="login-title">Catalyze</h1>
            <h2 className="login-subtitle">Connexion TeamTask</h2>
          </div>
        </div>

        {/* Formulaire de connexion */}
        <div className="login-form-container">
          <form onSubmit={handleSubmit} className="login-form">
            {/* Champ nom d'utilisateur */}
            <div className="form-group">
              <label className="form-label">Nom d'utilisateur</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input"
                placeholder="Entrez votre nom d'utilisateur"
                disabled={isLoading}
                autoComplete="username"
              />
            </div>

            {/* Champ mot de passe */}
            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="Entrez votre mot de passe"
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {/* Bouton de connexion */}
            <button 
              type="submit" 
              className={`btn btn-large w-full ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="btn-spinner"></div>
                  Connexion en cours...
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          {/* Lien vers inscription */}
          <div className="login-footer">
            <p className="login-footer-text">
              Pas encore de compte ?{' '}
              <Link to="/register" className="auth-link">
                Créer un compte
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Footer entreprise en bas */}
      <footer className="company-footer">
        <div className="social-icons">
          <a href="#" className="social-link" aria-label="Facebook">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </a>
          <a href="#" className="social-link" aria-label="Instagram">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </a>
        </div>
        <p className="company-name">© Copyright 2025 SK TECH All Rights Reserved</p>
      </footer>
    </div>
  );
};

export default LoginPage;