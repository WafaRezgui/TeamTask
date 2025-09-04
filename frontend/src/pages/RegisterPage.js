// src/pages/RegisterPage.js
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../store/slices/authSlice';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'user'
  });
  const [errors, setErrors] = useState({});

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state) => state.auth);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Le nom d\'utilisateur est requis';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Le nom d\'utilisateur doit contenir au moins 3 caractères';
    }

    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Veuillez confirmer votre mot de passe';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await dispatch(registerUser({
        username: formData.username,
        password: formData.password,
        role: formData.role
      })).unwrap();

      alert('Inscription réussie ! Vous pouvez maintenant vous connecter.');
      navigate('/login');
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
    }
  };

  return (
    <div className="register-container">
      {/* Contenu principal centré */}
      <div className="register-content">
        {/* Logo grand à côté du titre */}
        <div className="register-header">
          <div className="logo-large">C</div>
          <div className="title-section">
            <h1 className="register-title">Catalyze</h1>
            <h2 className="register-subtitle">Rejoindre TeamTask</h2>
            <p className="register-description">
              Créez votre compte pour collaborer efficacement
            </p>
          </div>
        </div>

        {/* Formulaire d'inscription */}
        <div className="register-form-container">
          <form onSubmit={handleSubmit} className="register-form">
            {/* Erreur globale */}
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {/* Nom d'utilisateur */}
            <div className="form-group">
              <label className="form-label">Nom d'utilisateur *</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Choisissez votre nom d'utilisateur"
                className={`input ${errors.username ? 'input-error' : ''}`}
                disabled={isLoading}
              />
              {errors.username && (
                <span className="field-error">{errors.username}</span>
              )}
            </div>

            {/* Sélection du rôle */}
            <div className="form-group">
              <label className="form-label">Rôle dans l'équipe</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="select"
                disabled={isLoading}
              >
                <option value="user">Utilisateur - Gestion de mes tâches</option>
                <option value="manager">Manager - Gestion complète des tâches</option>
              </select>
            </div>

            {/* Mot de passe */}
            <div className="form-group">
              <label className="form-label">Mot de passe *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Créez un mot de passe sécurisé"
                className={`input ${errors.password ? 'input-error' : ''}`}
                disabled={isLoading}
              />
              {errors.password && (
                <span className="field-error">{errors.password}</span>
              )}
            </div>

            {/* Confirmation mot de passe */}
            <div className="form-group">
              <label className="form-label">Confirmer le mot de passe *</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirmez votre mot de passe"
                className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <span className="field-error">{errors.confirmPassword}</span>
              )}
            </div>

            {/* Bouton de soumission */}
            <button
              type="submit"
              disabled={isLoading}
              className={`btn btn-large w-full ${isLoading ? 'loading' : ''}`}
            >
              {isLoading ? (
                <>
                  <div className="btn-spinner"></div>
                  Création...
                </>
              ) : (
                'Créer mon compte'
              )}
            </button>
          </form>

          {/* Lien vers connexion */}
          <div className="register-footer">
            <p className="register-footer-text">
              Vous avez déjà un compte ?{' '}
              <Link to="/login" className="auth-link">
                Se connecter
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

export default RegisterPage;