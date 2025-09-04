import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { restoreSession } from '../store/slices/authSlice';
import { fetchTasks, createTask, updateTask, deleteTask, setFilter, fetchUsers } from '../store/slices/taskSlice';
import TaskForm from '../components/TaskForm';

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { tasks, isLoading, error, filter } = useSelector((state) => state.tasks);
  
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    
    dispatch(restoreSession());
    dispatch(fetchTasks());

    if (user?.role === 'manager') {
      dispatch(fetchUsers());
    }
  }, [dispatch, isAuthenticated, navigate, user]);

  const handleStatusChange = (taskId, newStatus) => {
    dispatch(updateTask({ taskId, taskData: { status: newStatus } }));
  };

  const handleDeleteTask = (taskId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      dispatch(deleteTask(taskId));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'à faire': return 'var(--danger)';
      case 'en cours': return 'var(--warning)';
      case 'terminée': return 'var(--success)';
      default: return 'var(--text-muted)';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'à faire': return 'À faire';
      case 'en cours': return 'En cours';
      case 'terminée': return 'Terminée';
      default: return status;
    }
  };

  const getAssignedText = (task) => {
    if (task.type === 'générale') return 'Tous les utilisateurs';
    if (task.assignedTo && task.assignedTo.length > 0) {
      return task.assignedTo.map(u => u.username).join(', ');
    }
    return 'Non assigné';
  };

  const getPriorityFromStatus = (status) => {
    switch (status) {
      case 'à faire': return 'high';
      case 'en cours': return 'medium';
      case 'terminée': return 'low';
      default: return 'medium';
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  const taskStats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'à faire').length,
    in_progress: tasks.filter(t => t.status === 'en cours').length,
    completed: tasks.filter(t => t.status === 'terminée').length,
  };

  const completionRate = tasks.length > 0 ? Math.round((taskStats.completed / tasks.length) * 100) : 0;

  const priorityTasks = tasks
    .filter(task => task.status !== 'terminée')
    .slice(0, 5);

  if (!isAuthenticated) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh' }}>
        <div className="card">
          <div className="loading">⏳ Redirection...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      {/* Header moderne */}
      <div className="page-header">
        <div className="flex-between">
          <div>
            <h1 className="page-title">📋 TeamTask Dashboard</h1>
            <div className="breadcrumb">
              Catalyze &gt; Gestion d'équipe &gt; Tableau de bord • 
              Bienvenue, <strong>{user?.username}</strong> 
              <span style={{ color: 'var(--primary-yellow)', marginLeft: '8px' }}>
                ({user?.role === 'manager' ? '👑 Manager' : '👤 Utilisateur'})
              </span>
            </div>
          </div>
          <div className="flex" style={{ alignItems: 'center', gap: '12px' }}>
            <div className="member-avatar">
              {user?.username?.slice(0, 2).toUpperCase() || 'U'}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
                {user?.username || 'Utilisateur'}
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                {user?.role === 'manager' ? 'Manager' : 'Membre d\'équipe'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats modernes */}
      <div className="dashboard-grid">
        <div className="card stat-card animate-fade-in">
          <div className="stat-icon">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
          </div>
          <div className="stat-number">{taskStats.total}</div>
          <div className="stat-label">Total Tâches</div>
        </div>
        <div className="card stat-card animate-fade-in">
          <div className="stat-icon">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <div className="stat-number">{taskStats.todo}</div>
          <div className="stat-label">À faire</div>
        </div>
        <div className="card stat-card animate-fade-in">
          <div className="stat-icon">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div className="stat-number">{completionRate}%</div>
          <div className="stat-label">Taux de completion</div>
        </div>
        <div className="card stat-card animate-fade-in">
          <div className="stat-icon">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7.4-6.3-4.6-6.3 4.6 2.3-7.4-6-4.6h7.6z"/>
            </svg>
          </div>
          <div className="stat-number">{taskStats.in_progress}</div>
          <div className="stat-label">En cours</div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">⚡ Actions rapides</h2>
        </div>
        <div className="card">
          <div className="quick-actions-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {user?.role === 'manager' && (
              <button 
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="btn quick-action-btn"
                style={{ flex: '0 1 auto', minWidth: '150px' }}
              >
                <svg fill="currentColor" viewBox="0 0 24 24" width="20" height="20">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                {showCreateForm ? 'Annuler' : '➕ Nouvelle tâche'}
              </button>
            )}
          </div>
          {user?.role === 'user' && (
            <div className="user-info-banner">
              <div className="badge badge-info">
                👤 Mode Utilisateur : Vous pouvez modifier le statut de vos tâches
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Formulaire de création */}
      {showCreateForm && user?.role === 'manager' && (
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">✨ Créer une nouvelle tâche</h2>
            <button 
              onClick={() => setShowCreateForm(false)}
              className="btn btn-secondary"
            >
              Fermer
            </button>
          </div>
          <div className="card create-form-container">
            <TaskForm />
          </div>
        </div>
      )}

      {/* Filtres et actions */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">📝 Gestion des tâches ({filteredTasks.length})</h2>
          <div className="filters-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <span className="filter-label">Filtrer :</span>
            {[
              { value: 'all', label: 'Toutes', icon: '📋' },
              { value: 'à faire', label: 'À faire', icon: '🔴' },
              { value: 'en cours', label: 'En cours', icon: '🟡' },
              { value: 'terminée', label: 'Terminées', icon: '🟢' }
            ].map(filterOption => (
              <button
                key={filterOption.value}
                onClick={() => dispatch(setFilter(filterOption.value))}
                className={`btn ${filter === filterOption.value ? '' : 'btn-secondary'} btn-small`}
                style={{ flex: '0 1 auto', minWidth: '100px' }}
              >
                {filterOption.icon} {filterOption.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="card error-card">
            <div className="error-content">
              <svg fill="currentColor" viewBox="0 0 24 24" width="24" height="24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              <span>❌ {error}</span>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="card">
            <div className="loading-content">
              <div className="loading-spinner"></div>
              <span>⏳ Chargement des tâches...</span>
            </div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="card empty-state">
            <div className="empty-content">
              <svg fill="currentColor" viewBox="0 0 24 24" width="48" height="48">
                <path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
              </svg>
              <h3 className="empty-title">📭 Aucune tâche trouvée</h3>
              <p className="empty-text">
                {filter !== 'all' 
                  ? `Aucune tâche "${getStatusText(filter)}" pour le moment.`
                  : 'Aucune tâche créée pour le moment.'
                }
              </p>
              {user?.role === 'manager' && filter === 'all' && (
                <button 
                  onClick={() => setShowCreateForm(true)}
                  className="btn"
                >
                  ➕ Créer votre première tâche
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="tasks-grid">
            {filteredTasks.map((task, index) => (
              <div 
                key={task._id} 
                className={`card task-card priority-${getPriorityFromStatus(task.status)} animate-fade-in`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="task-header">
                  <h4 className="task-title">{task.title}</h4>
                  <div className="task-actions">
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task._id, e.target.value)}
                      className="status-select"
                      style={{ backgroundColor: getStatusColor(task.status), color: 'white' }}
                    >
                      <option value="à faire">À faire</option>
                      <option value="en cours">En cours</option>
                      <option value="terminée">Terminée</option>
                    </select>
                    {user?.role === 'manager' && (
                      <button
                        onClick={() => handleDeleteTask(task._id)}
                        className="delete-btn"
                        title="Supprimer la tâche"
                      >
                        <svg fill="currentColor" viewBox="0 0 24 24" width="16" height="16">
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                {task.description && (
                  <p className="task-description">{task.description}</p>
                )}
                <div className="task-footer">
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(task.status) }}
                  >
                    {getStatusText(task.status)}
                  </span>
                  <div className="task-meta-info">
                    <span className="assigned-to">👤 {getAssignedText(task)}</span>
                    <span className="task-type">📌 {task.type === 'générale' ? 'Générale' : 'Spécifique'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {priorityTasks.length > 0 && (
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">🎯 Tâches Prioritaires</h2>
            <button 
              onClick={() => navigate('/task-history')}
              className="btn btn-secondary"
            >
              Voir tout
            </button>
          </div>
          <div className="card task-list">
            {priorityTasks.map(task => (
              <div 
                key={task._id} 
                className={`task-item priority-${getPriorityFromStatus(task.status)}`}
              >
                <div 
                  className={`task-checkbox ${task.status === 'terminée' ? 'checked' : ''}`}
                  onClick={() => handleStatusChange(task._id, task.status === 'terminée' ? 'à faire' : 'terminée')}
                ></div>
                <div className="task-content">
                  <div className="task-title">{task.title}</div>
                  <div className="task-meta">
                    <span>Assigné à: {getAssignedText(task)}</span>
                    <span className={`priority-badge priority-${getPriorityFromStatus(task.status)}`}>
                      {getStatusText(task.status)}
                    </span>
                    <span>Type: {task.type === 'générale' ? 'Générale' : 'Spécifique'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;