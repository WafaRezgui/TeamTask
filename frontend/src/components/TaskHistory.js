import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const TaskHistory = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    taskId: '',
    action: '',
    startDate: '',
    endDate: ''
  });

  // Vérifier l'authentification
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    fetchTaskHistory();
  }, [isAuthenticated, navigate]);

  const fetchTaskHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/history', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Réponse serveur (erreur):', errorText);
        throw new Error(`Erreur HTTP ${response.status}: ${errorText || 'Aucune réponse détaillée'}`);
      }

      const result = await response.json();
      if (result.success) {
        setHistory(result.data);
      } else {
        throw new Error(result.message || 'Erreur lors du chargement');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching task history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const applyFilters = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value);
        }
      });

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/history?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Réponse serveur (erreur):', errorText);
        throw new Error(`Erreur HTTP ${response.status}: ${errorText || 'Aucune réponse détaillée'}`);
      }

      const result = await response.json();
      if (result.success) {
        setHistory(result.data);
      } else {
        throw new Error(result.message || 'Erreur lors du filtrage');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error filtering task history:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      taskId: '',
      action: '',
      startDate: '',
      endDate: ''
    });
    fetchTaskHistory();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionBadgeStyle = (action) => {
    const baseStyle = {
      padding: '0.5rem 1rem',
      borderRadius: '20px',
      fontSize: '0.9rem',
      color: 'white',
      fontWeight: 500,
      textTransform: 'capitalize',
    };

    const colors = {
      'created': '#52c41a',
      'status_changed': '#f3d563',
      'updated': '#1890ff',
      'assigned': '#1a224d',
      'reassigned': '#722ed1',
      'deleted': '#ff4d4f',
      'créée': '#52c41a',
      'modifiée': '#f3d563',
      'supprimée': '#ff4d4f',
      'assignée': '#1a224d',
      'terminée': '#722ed1'
    };

    return {
      ...baseStyle,
      backgroundColor: colors[action] || '#5a6b7c',
      color: (action === 'modifiée' || action === 'status_changed') ? '#1a224d' : 'white'
    };
  };

  const goBackToDashboard = () => {
    navigate('/dashboard');
  };

  if (!isAuthenticated) {
    return <div>Redirection...</div>;
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>⏳ Chargement de l'historique...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <h3 style={styles.errorTitle}>❌ Erreur</h3>
          <p style={styles.errorMessage}>{error}</p>
          <button onClick={fetchTaskHistory} style={styles.retryButton}>
            🔄 Réessayer
          </button>
          <button onClick={goBackToDashboard} style={styles.backButton}>
            ← Retour au Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>📜 Historique des Tâches</h1>
          <p style={styles.subtitle}>
            Consultez l'historique complet des modifications - <strong>{user?.username}</strong>
          </p>
        </div>
        <button onClick={goBackToDashboard} style={styles.backButton}>
          ← Dashboard
        </button>
      </header>

      {/* Filtres */}
      <div style={styles.filtersContainer}>
        <h3 style={styles.filtersTitle}>🔍 Filtres de recherche</h3>
        
        <div style={styles.filtersGrid}>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>ID de la tâche :</label>
            <input
              type="text"
              name="taskId"
              value={filters.taskId}
              onChange={handleFilterChange}
              placeholder="Rechercher par ID..."
              style={styles.filterInput}
            />
          </div>
          
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Action :</label>
            <select
              name="action"
              value={filters.action}
              onChange={handleFilterChange}
              style={styles.filterSelect}
            >
              <option value="">Toutes les actions</option>
              <option value="created">Créée</option>
              <option value="status_changed">Statut modifié</option>
              <option value="updated">Modifiée</option>
              <option value="assigned">Assignée</option>
              <option value="reassigned">Réassignée</option>
              <option value="deleted">Supprimée</option>
            </select>
          </div>
          
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Date de début :</label>
            <input
              type="datetime-local"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              style={styles.filterInput}
            />
          </div>
          
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Date de fin :</label>
            <input
              type="datetime-local"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              style={styles.filterInput}
            />
          </div>
        </div>
        
        <div style={styles.filterActions}>
          <button onClick={applyFilters} style={styles.applyButton}>
            🔍 Appliquer les filtres
          </button>
          <button onClick={clearFilters} style={styles.clearButton}>
            🗑️ Effacer les filtres
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div style={styles.statsContainer}>
        <div style={styles.statCard}>
          <h3 style={styles.statNumber}>{history.length}</h3>
          <p style={styles.statLabel}>Total des entrées</p>
        </div>
      </div>

      {/* Liste de l'historique */}
      <div style={styles.historyContainer}>
        <h2 style={styles.historyTitle}>
          📝 Historique ({history.length} entrée{history.length > 1 ? 's' : ''})
        </h2>

        {history.length === 0 ? (
          <div style={styles.noHistory}>
            <h3 style={styles.noHistoryTitle}>📭 Aucun historique trouvé</h3>
            <p style={styles.noHistoryText}>
              Aucune modification de tâche ne correspond à vos critères.
            </p>
          </div>
        ) : (
          <div style={styles.historyList}>
            {history.map((entry) => (
              <div key={entry._id} style={styles.historyCard}>
                <div style={styles.historyCardHeader}>
                  <div style={styles.taskInfo}>
                    <h4 style={styles.historyTaskTitle}>
                      📋 Tâche #{entry.taskId?._id || entry.taskId}
                    </h4>
                    {entry.taskId?.title && (
                      <p style={styles.taskTitleText}>{entry.taskId.title}</p>
                    )}
                  </div>
                  
                  <div style={styles.actionInfo}>
                    <span style={getActionBadgeStyle(entry.action)}>
                      {entry.action}
                    </span>
                    <span style={styles.timestamp}>
                      🕐 {formatDate(entry.createdAt || entry.timestamp)}
                    </span>
                  </div>
                </div>
                
                <div style={styles.historyCardBody}>
                  {/* Description de l'action */}
                  {entry.description && (
                    <div style={styles.descriptionSection}>
                      <p style={styles.descriptionText}>📝 {entry.description}</p>
                    </div>
                  )}
                  
                  {/* Détails des changements */}
                  {(entry.field || entry.oldValue || entry.newValue) && (
                    <div style={styles.changesSection}>
                      <h5 style={styles.changesTitle}>🔄 Détails de la modification :</h5>
                      <div style={styles.changesList}>
                        <div style={styles.changeItem}>
                          {entry.field && (
                            <span style={styles.fieldName}>Champ : {entry.field}</span>
                          )}
                          <div style={styles.changeValues}>
                            {entry.oldValue && (
                              <div style={styles.oldValue}>
                                <span style={styles.changeLabel}>Avant :</span>
                                <span style={styles.changeContent}>
                                  {typeof entry.oldValue === 'object' ? JSON.stringify(entry.oldValue) : String(entry.oldValue)}
                                </span>
                              </div>
                            )}
                            {entry.newValue && (
                              <div style={styles.newValue}>
                                <span style={styles.changeLabel}>Après :</span>
                                <span style={styles.changeContent}>
                                  {typeof entry.newValue === 'object' ? JSON.stringify(entry.newValue) : String(entry.newValue)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {entry.userId && (
                    <div style={styles.userInfo}>
                      <span style={styles.modifiedBy}>
                        👤 Par : <strong>{entry.userId.username || entry.userId.email || 'Utilisateur inconnu'}</strong>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Styles adaptés à votre design system
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f4f7fa',
    padding: '2rem',
    fontFamily: "'Montserrat', sans-serif",
    maxWidth: '1200px',
    margin: '0 auto',
  },

  // Loading
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '50vh',
  },
  spinner: {
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #1a224d',
    borderRadius: '50%',
    width: '50px',
    height: '50px',
    animation: 'spin 1s linear infinite',
    marginBottom: '15px',
  },
  loadingText: {
    color: '#1a224d',
    fontSize: '1.2rem',
    fontWeight: 600,
  },

  // Error
  errorContainer: {
    textAlign: 'center',
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
    borderLeft: '6px solid #ff4d4f',
  },
  errorTitle: {
    color: '#ff4d4f',
    marginBottom: '1rem',
  },
  errorMessage: {
    color: '#5a6b7c',
    marginBottom: '1.5rem',
  },
  retryButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#ff4d4f',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600,
    marginRight: '1rem',
    transition: 'background-color 0.3s ease',
  },

  // Header
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: '1.5rem 2rem',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
    marginBottom: '2rem',
    borderLeft: '6px solid #f3d563',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    margin: 0,
    color: '#1a224d',
    fontSize: '1.8rem',
    fontWeight: 600,
  },
  subtitle: {
    margin: '0.5rem 0 0 0',
    color: '#5a6b7c',
    fontSize: '1rem',
  },
  backButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#1a224d',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600,
    transition: 'background-color 0.3s ease',
  },

  // Filters
  filtersContainer: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
    marginBottom: '2rem',
    borderLeft: '6px solid #f3d563',
  },
  filtersTitle: {
    color: '#1a224d',
    marginBottom: '1.5rem',
    fontSize: '1.3rem',
    fontWeight: 600,
  },
  filtersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  filterLabel: {
    fontWeight: 600,
    color: '#1a224d',
    marginBottom: '0.5rem',
    fontSize: '0.9rem',
  },
  filterInput: {
    padding: '0.75rem',
    border: '2px solid #1a224d',
    borderRadius: '8px',
    fontSize: '1rem',
    fontFamily: "'Montserrat', sans-serif",
    transition: 'border-color 0.3s ease',
  },
  filterSelect: {
    padding: '0.75rem',
    border: '2px solid #1a224d',
    borderRadius: '8px',
    fontSize: '1rem',
    fontFamily: "'Montserrat', sans-serif",
    backgroundColor: 'white',
    cursor: 'pointer',
  },
  filterActions: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  applyButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#f3d563',
    color: '#1a224d',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600,
    transition: 'background-color 0.3s ease',
  },
  clearButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#5a6b7c',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600,
    transition: 'background-color 0.3s ease',
  },

  // Stats
  statsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  statCard: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    textAlign: 'center',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
    borderLeft: '6px solid #f3d563',
  },
  statNumber: {
    fontSize: '2.2rem',
    margin: 0,
    color: '#1a224d',
    fontWeight: 700,
  },
  statLabel: {
    margin: '0.5rem 0 0 0',
    color: '#5a6b7c',
    fontSize: '1rem',
    fontWeight: 600,
  },

  // History
  historyContainer: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
    borderLeft: '6px solid #f3d563',
  },
  historyTitle: {
    margin: '0 0 1.5rem 0',
    color: '#1a224d',
    fontSize: '1.5rem',
    fontWeight: 600,
  },
  noHistory: {
    textAlign: 'center',
    padding: '3rem 2rem',
  },
  noHistoryTitle: {
    color: '#5a6b7c',
    marginBottom: '1rem',
  },
  noHistoryText: {
    color: '#5a6b7c',
    fontSize: '1.1rem',
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  historyCard: {
    border: '1px solid #ddd',
    borderLeft: '6px solid #f3d563',
    borderRadius: '8px',
    backgroundColor: 'white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    transition: 'box-shadow 0.3s ease',
  },
  historyCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '1.5rem 1.5rem 1rem',
    borderBottom: '1px solid #f1f3f4',
  },
  taskInfo: {
    flex: 1,
  },
  historyTaskTitle: {
    margin: 0,
    color: '#1a224d',
    fontSize: '1.1rem',
    fontWeight: 600,
  },
  taskTitleText: {
    margin: '0.5rem 0 0 0',
    color: '#5a6b7c',
    fontSize: '0.9rem',
    fontStyle: 'italic',
  },
  actionInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '0.5rem',
  },
  timestamp: {
    fontSize: '0.85rem',
    color: '#5a6b7c',
  },
  historyCardBody: {
    padding: '1.5rem',
  },
  descriptionSection: {
    marginBottom: '1rem',
    padding: '1rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    borderLeft: '3px solid #1a224d',
  },
  descriptionText: {
    margin: 0,
    color: '#1a224d',
    fontWeight: 500,
  },
  changesSection: {
    marginBottom: '1.5rem',
  },
  changesTitle: {
    color: '#1a224d',
    marginBottom: '1rem',
    fontSize: '1rem',
    fontWeight: 600,
  },
  changesList: {
    backgroundColor: '#f9f9fb',
    padding: '1rem',
    borderRadius: '8px',
    borderLeft: '4px solid #f3d563',
  },
  changeItem: {
    marginBottom: '1rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid #e9ecef',
  },
  fieldName: {
    fontWeight: 600,
    color: '#1a224d',
    display: 'block',
    marginBottom: '0.5rem',
  },
  changeValues: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  oldValue: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  newValue: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  changeLabel: {
    fontSize: '0.85rem',
    fontWeight: 600,
    minWidth: '60px',
  },
  changeContent: {
    fontSize: '0.85rem',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    fontFamily: "'Courier New', monospace",
  },
  userInfo: {
    borderTop: '1px solid #e9ecef',
    paddingTop: '1rem',
  },
  modifiedBy: {
    fontSize: '0.9rem',
    color: '#5a6b7c',
  },
};

// Animation CSS pour le spinner
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default TaskHistory;