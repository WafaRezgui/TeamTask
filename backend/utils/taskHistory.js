// utils/taskHistory.js
const TaskHistory = require('../models/TaskHistory');

/**
 * Enregistrer une entrée dans l'historique des tâches
 */
const recordTaskHistory = async ({
  taskId,
  userId,
  action,
  field = null,
  oldValue = null,
  newValue = null,
  description
}) => {
  try {
    if (!TaskHistory || typeof TaskHistory.find !== 'function') {
      throw new Error('Modèle TaskHistory non valide');
    }
    const historyEntry = new TaskHistory({
      taskId,
      userId,
      action,
      field,
      oldValue,
      newValue,
      description
    });

    await historyEntry.save();
    console.log(`📝 Historique enregistré: ${description}`);
    return historyEntry;
  } catch (error) {
    console.error('❌ Erreur enregistrement historique:', error);
    throw error;
  }
};

/**
 * Créer une description lisible pour l'historique
 */
const createDescription = (action, field, oldValue, newValue, userName) => {
  switch (action) {
    case 'created':
      return `${userName} a créé la tâche`;
    
    case 'status_changed':
      return `${userName} a changé le statut de "${oldValue}" à "${newValue}"`;
    
    case 'assigned':
      return `${userName} a assigné la tâche à ${newValue}`;
    
    case 'reassigned':
      return `${userName} a réassigné la tâche de ${oldValue} à ${newValue}`;
    
    case 'updated':
      if (field === 'title') {
        return `${userName} a modifié le titre`;
      } else if (field === 'description') {
        return `${userName} a modifié la description`;
      }
      return `${userName} a modifié la tâche`;
    
    case 'deleted':
      return `${userName} a supprimé la tâche`;
    
    default:
      return `${userName} a effectué une action sur la tâche`;
  }
};

/**
 * Récupérer l'historique d'une tâche
 */
const getTaskHistory = async (taskId) => {
  try {
    if (!TaskHistory || typeof TaskHistory.find !== 'function') {
      throw new Error('Modèle TaskHistory non valide');
    }
    const history = await TaskHistory.find({ taskId })
      .populate('userId', 'username')
      .sort({ createdAt: -1 });
    
    return history;
  } catch (error) {
    console.error('❌ Erreur récupération historique:', error);
    throw error;
  }
};

/**
 * Comparer les anciennes et nouvelles valeurs d'une tâche
 */
const compareTaskValues = (oldTask, newTask, userId, userName) => {
  const changes = [];
  
  // Vérifier le statut
  if (oldTask.status !== newTask.status) {
    changes.push({
      taskId: oldTask._id,
      userId,
      action: 'status_changed',
      field: 'status',
      oldValue: oldTask.status,
      newValue: newTask.status,
      description: createDescription('status_changed', 'status', oldTask.status, newTask.status, userName)
    });
  }
  
  // Vérifier l'assignation
  const oldAssigned = oldTask.assignedUserId?.toString();
  const newAssigned = newTask.assignedUserId?.toString();
  
  if (oldAssigned !== newAssigned) {
    const action = oldAssigned ? 'reassigned' : 'assigned';
    changes.push({
      taskId: oldTask._id,
      userId,
      action,
      field: 'assignedUserId',
      oldValue: oldTask.assignedTo || 'Non assigné',
      newValue: newTask.assignedTo || 'Non assigné',
      description: createDescription(action, 'assignedUserId', oldTask.assignedTo, newTask.assignedTo, userName)
    });
  }
  
  // Vérifier le titre
  if (oldTask.title !== newTask.title) {
    changes.push({
      taskId: oldTask._id,
      userId,
      action: 'updated',
      field: 'title',
      oldValue: oldTask.title,
      newValue: newTask.title,
      description: createDescription('updated', 'title', null, null, userName)
    });
  }
  
  // Vérifier la description
  if (oldTask.description !== newTask.description) {
    changes.push({
      taskId: oldTask._id,
      userId,
      action: 'updated',
      field: 'description',
      oldValue: oldTask.description,
      newValue: newTask.description,
      description: createDescription('updated', 'description', null, null, userName)
    });
  }
  
  return changes;
};

module.exports = {
  recordTaskHistory,
  createDescription,
  getTaskHistory,
  compareTaskValues
};