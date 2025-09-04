// src/components/TaskForm.js
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createTask, fetchUsers } from '../store/slices/taskSlice';

const TaskForm = ({ onClose }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { users, isLoading, error } = useSelector((state) => state.tasks);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'spécifique',
    assignedUserId: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Charge les utilisateurs si l'utilisateur est un manager
  useEffect(() => {
    if (user?.role === 'manager') {
      dispatch(fetchUsers());
    }
  }, [dispatch, user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Le titre est requis');
      return;
    }

    if (formData.type === 'spécifique' && !formData.assignedUserId) {
      alert('Sélectionnez un utilisateur pour une tâche spécifique');
      return;
    }

    setIsSubmitting(true);

    try {
      await dispatch(createTask(formData)).unwrap();
      
      // Réinitialiser le formulaire
      setFormData({ 
        title: '', 
        description: '', 
        type: 'spécifique', 
        assignedUserId: '' 
      });

      // Fermer le formulaire si fonction fournie
      if (onClose) {
        onClose();
      }

      // Message de succès
      alert('Tâche créée avec succès !');
    } catch (error) {
      console.error('Erreur lors de la création:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // N'affiche rien si l'utilisateur n'est pas manager
  if (user?.role !== 'manager') {
    return (
      <div className="card">
        <div className="empty-content">
          <svg fill="currentColor" viewBox="0 0 24 24" width="48" height="48">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <h3 className="empty-title">Accès restreint</h3>
          <p className="empty-text">
            Seuls les managers peuvent créer des tâches.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="task-form-container">
      <div className="card-header">
        <h3 className="card-title">✨ Créer une nouvelle tâche</h3>
        <p className="card-subtitle">Assignez des tâches à votre équipe</p>
      </div>

      {error && (
        <div className="error-card card">
          <div className="error-content">
            <svg fill="currentColor" viewBox="0 0 24 24" width="24" height="24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="task-form">
        {/* Titre */}
        <div className="form-group">
          <label className="form-label">
            <svg fill="currentColor" viewBox="0 0 24 24" width="16" height="16">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
            </svg>
            Titre de la tâche *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="input"
            placeholder="Ex: Finaliser le rapport mensuel"
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Description */}
        <div className="form-group">
          <label className="form-label">
            <svg fill="currentColor" viewBox="0 0 24 24" width="16" height="16">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            Description (optionnelle)
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="input textarea"
            placeholder="Décrivez les détails de la tâche..."
            rows="4"
            disabled={isSubmitting}
          />
        </div>

        {/* Type de tâche */}
        <div className="form-group">
          <label className="form-label">
            <svg fill="currentColor" viewBox="0 0 24 24" width="16" height="16">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            Type de tâche
          </label>
          <select 
            name="type" 
            value={formData.type} 
            onChange={handleChange}
            className="select"
            disabled={isSubmitting}
          >
            <option value="spécifique">🎯 Spécifique (à un utilisateur)</option>
            <option value="générale">🌐 Générale (à tous)</option>
          </select>
          
          <div className="type-info">
            {formData.type === 'spécifique' ? (
              <div className="info-card info-specific">
                <strong>Tâche Spécifique :</strong> Assignée à un membre précis de l'équipe
              </div>
            ) : (
              <div className="info-card info-general">
                <strong>Tâche Générale :</strong> Visible par tous les membres de l'équipe
              </div>
            )}
          </div>
        </div>

        {/* Attribution utilisateur */}
        {formData.type === 'spécifique' && (
          <div className="form-group">
            <label className="form-label">
              <svg fill="currentColor" viewBox="0 0 24 24" width="16" height="16">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Assigner à *
            </label>
            <select
              name="assignedUserId"
              value={formData.assignedUserId}
              onChange={handleChange}
              className="select"
              required
              disabled={isSubmitting}
            >
              <option value="">Sélectionnez un utilisateur</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  👤 {u.username} ({u.role === 'manager' ? 'Manager' : 'Utilisateur'})
                </option>
              ))}
            </select>

            {users.length === 0 && !isLoading && (
              <div className="warning-message">
                <svg fill="currentColor" viewBox="0 0 24 24" width="16" height="16">
                  <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                </svg>
                Aucun utilisateur disponible
              </div>
            )}
          </div>
        )}

        {/* Boutons d'action */}
        <div className="form-actions">
          <button
            type="submit"
            className={`btn ${isSubmitting ? 'loading' : ''}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="btn-spinner"></div>
                Création...
              </>
            ) : (
              <>
                <svg fill="currentColor" viewBox="0 0 24 24" width="16" height="16">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                Créer la tâche
              </>
            )}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Annuler
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default TaskForm;