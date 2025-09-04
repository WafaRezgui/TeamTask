const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Task = require('../models/Task');
const User = require('../models/User');
const authorizeRole = require('../middlewares/authorizeRole');
const TaskHistory = require('../models/TaskHistory');
// NOUVEAU : Import des fonctions d'historique
const { recordTaskHistory, getTaskHistory, compareTaskValues, createDescription } = require('../utils/taskHistory');

// Middleware pour vérifier le token
function verifyToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token manquant' });

  try {
    const decoded = jwt.verify(token, 'secretkey');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token invalide' });
  }
}

// Alias auth pour compatibilité avec les nouvelles routes
const auth = verifyToken;

// NOUVELLE ROUTE : Récupérer l'historique d'une tâche spécifique
router.get('/:taskId/history', verifyToken, async (req, res) => {
  try {
    console.log(`📚 Récupération historique pour tâche ${req.params.taskId}`);
    
    const taskId = req.params.taskId;
    
    // Vérifier que la tâche existe
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tâche non trouvée' 
      });
    }
    
    // Vérifier les permissions
    if (req.user.role !== 'manager' && !task.assignedTo.includes(req.user.id)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Accès non autorisé à cette tâche' 
      });
    }
    
    const history = await getTaskHistory(taskId);
    
    res.json({
      success: true,
      data: history,
      count: history.length
    });
  } catch (error) {
    console.error('❌ Erreur récupération historique:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération de l\'historique' 
    });
  }
});

// NOUVELLE ROUTE : Récupérer l'historique général des tâches
router.get('/history', auth, async (req, res) => {
  try {
    console.log('📜 Récupération historique pour utilisateur:', req.user.username);
    
    const { taskId, action, startDate, endDate } = req.query;
    
    // Construire le filtre
    let filter = {};
    
    // Si utilisateur normal, ne voir que l'historique des tâches qui lui sont assignées
    // Les managers peuvent voir tout l'historique
    if (req.user.role !== 'manager') {
      // Récupérer d'abord les IDs des tâches assignées à l'utilisateur
      const userTasks = await Task.find({
        $or: [
          { assignedTo: req.user.id },
          { type: 'générale' }
        ]
      }).select('_id');
      
      const taskIds = userTasks.map(task => task._id);
      filter.taskId = { $in: taskIds };
    }
    
    // Filtres optionnels depuis le frontend
    if (taskId) {
      filter.taskId = taskId;
    }
    if (action) {
      filter.action = action;
    }
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    console.log('🔍 Filtre appliqué:', filter);

    // Récupérer l'historique
    const history = await TaskHistory.find(filter)
      .populate('taskId', 'title description type status assignedTo')
      .populate('userId', 'username email')
      .sort({ createdAt: -1 })
      .limit(200); // Limiter pour les performances

    console.log(`✅ ${history.length} entrées d'historique trouvées`);

    res.json({ 
      success: true, 
      data: history,
      total: history.length,
      message: `${history.length} entrée(s) d'historique récupérée(s)`
    });

  } catch (error) {
    console.error('❌ Erreur récupération historique:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la récupération de l\'historique',
      error: error.message
    });
  }
});

// NOUVELLE ROUTE : Historique d'une tâche spécifique (route alternative)
router.get('/history/task/:taskId', auth, async (req, res) => {
  try {
    const { taskId } = req.params;
    
    // Vérifier que l'utilisateur a accès à cette tâche
    const task = await Task.findById(taskId);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tâche non trouvée'
      });
    }
    
    // Vérifier les permissions
    if (req.user.role !== 'manager' && 
        !task.assignedTo.includes(req.user.id) && 
        task.type !== 'générale') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à cette tâche'
      });
    }
    
    const history = await TaskHistory.find({ taskId })
      .populate('userId', 'username email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: history,
      task: {
        id: task._id,
        title: task.title,
        status: task.status
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération historique tâche:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'historique de la tâche'
    });
  }
});

// NOUVELLE ROUTE : Supprimer une entrée d'historique (managers seulement)
router.delete('/history/:id', auth, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est manager
    if (req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Seuls les managers peuvent supprimer l\'historique'
      });
    }

    const historyEntry = await TaskHistory.findByIdAndDelete(req.params.id);
    
    if (!historyEntry) {
      return res.status(404).json({
        success: false,
        message: 'Entrée d\'historique non trouvée'
      });
    }

    console.log(`🗑️ Entrée historique supprimée par ${req.user.username}`);

    res.json({
      success: true,
      message: 'Entrée d\'historique supprimée avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur suppression historique:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression'
    });
  }
});

// ROUTE MODIFIÉE : Ajouter une tâche avec historique
router.post('/add', verifyToken, authorizeRole(['manager']), async (req, res) => {
  const { title, description, assignedUserId, type } = req.body;

  // Validation améliorée
  if (!title || !title.trim()) {
    return res.status(400).json({ message: 'Le titre est obligatoire' });
  }

  let assignedUsers = [];
  try {
    // Récupérer l'utilisateur qui crée la tâche (manager)
    const currentUser = await User.findById(req.user.id);
    
    if (type === 'générale') {
      // Assignation à tous les utilisateurs
      const users = await User.find({});
      assignedUsers = users.map(user => user._id);
    } else if (type === 'spécifique') {
      // Vérification pour une tâche spécifique
      if (!assignedUserId) {
        return res.status(400).json({ message: 'Veuillez sélectionner un utilisateur pour assigner la tâche' });
      }
      const assignedUser = await User.findById(assignedUserId);
      if (!assignedUser) {
        return res.status(400).json({ message: 'Utilisateur assigné introuvable' });
      }
      assignedUsers = [assignedUserId];
    } else {
      return res.status(400).json({ message: 'Type de tâche invalide' });
    }

    // Création de la tâche
    const newTask = new Task({
      title: title.trim(),
      description: description?.trim() || '',
      type: type,
      assignedTo: assignedUsers,
      createdBy: req.user.id
    });

    const savedTask = await newTask.save();
    console.log('✅ Tâche créée:', savedTask._id);

    // NOUVEAU : Enregistrer la création dans l'historique
    await recordTaskHistory({
      taskId: savedTask._id,
      userId: req.user.id,
      action: 'created',
      description: createDescription('created', null, null, null, currentUser?.username || 'Manager')
    });

    // NOUVEAU : Si la tâche est assignée, enregistrer l'assignation
    if (type === 'spécifique') {
      const assignedUser = await User.findById(assignedUserId);
      await recordTaskHistory({
        taskId: savedTask._id,
        userId: req.user.id,
        action: 'assigned',
        field: 'assignedTo',
        newValue: assignedUser.username,
        description: createDescription('assigned', 'assignedTo', null, assignedUser.username, currentUser?.username || 'Manager')
      });
    } else if (type === 'générale') {
      await recordTaskHistory({
        taskId: savedTask._id,
        userId: req.user.id,
        action: 'assigned',
        field: 'assignedTo',
        newValue: 'Tous les utilisateurs',
        description: createDescription('assigned', 'assignedTo', null, 'tous les utilisateurs', currentUser?.username || 'Manager')
      });
    }
    
    // Réponse améliorée avec infos utilisateur
    await savedTask.populate('assignedTo createdBy', 'username');
    
    res.status(201).json({ 
      message: `Tâche assignée avec succès à ${type === 'générale' ? 'tous les utilisateurs' : 'l\'utilisateur sélectionné'}`,
      task: savedTask
    });
  } catch (err) {
    console.error('❌ Erreur création tâche:', err);
    res.status(500).json({ message: 'Erreur lors de l\'ajout', error: err });
  }
});

// Récupérer les tâches (inchangé)
router.get('/', verifyToken, async (req, res) => {
  try {
    const { status, assignedUserId } = req.query;
    
    let tasks;

    if (req.user.role === 'manager') {
      let filter = {};
      
      if (assignedUserId) {
        filter.assignedTo = assignedUserId;
      } else {
        filter.$or = [
          { assignedTo: { $exists: true } },
          { type: 'générale' }
        ];
      }
      
      if (status && ['à faire', 'en cours', 'terminée'].includes(status)) {
        filter.status = status;
      }
      
      tasks = await Task.find(filter)
        .populate('assignedTo createdBy', 'username role')
        .sort({ createdAt: -1 });
    } else {
      let filter = { $or: [
        { assignedTo: req.user.id },
        { type: 'générale' }
      ] };
      
      if (status && ['à faire', 'en cours', 'terminée'].includes(status)) {
        filter.status = status;
      }
      
      tasks = await Task.find(filter)
        .populate('assignedTo createdBy', 'username role')
        .sort({ createdAt: -1 });
    }

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la récupération', error: err });
  }
});

// ROUTE MODIFIÉE : Modifier une tâche avec historique
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const taskId = req.params.id;
    const updates = req.body;
    
    // Récupérer l'ancienne version de la tâche
    const oldTask = await Task.findById(taskId).populate('assignedTo createdBy', 'username');
    if (!oldTask) {
      return res.status(404).json({ message: 'Tâche non trouvée' });
    }
    
    // Vérifier les permissions
    if (req.user.role !== 'manager' && !oldTask.assignedTo.some(user => user._id.toString() === req.user.id)) {
      return res.status(403).json({ message: 'Accès non autorisé à cette tâche' });
    }
    
    // Récupérer l'utilisateur qui fait la modification
    const currentUser = await User.findById(req.user.id);
    
    // Mettre à jour la tâche
    const updatedTask = await Task.findByIdAndUpdate(
      taskId, 
      updates, 
      { new: true }
    ).populate('assignedTo createdBy', 'username');
    
    console.log('✅ Tâche mise à jour:', taskId);
    
    // NOUVEAU : Enregistrer les changements dans l'historique
    
    // Vérifier changement de statut
    if (oldTask.status !== updatedTask.status) {
      await recordTaskHistory({
        taskId: taskId,
        userId: req.user.id,
        action: 'status_changed',
        field: 'status',
        oldValue: oldTask.status,
        newValue: updatedTask.status,
        description: createDescription('status_changed', 'status', oldTask.status, updatedTask.status, currentUser?.username || 'Utilisateur')
      });
    }
    
    // Vérifier changement de titre
    if (oldTask.title !== updatedTask.title) {
      await recordTaskHistory({
        taskId: taskId,
        userId: req.user.id,
        action: 'updated',
        field: 'title',
        oldValue: oldTask.title,
        newValue: updatedTask.title,
        description: createDescription('updated', 'title', null, null, currentUser?.username || 'Utilisateur')
      });
    }
    
    // Vérifier changement de description
    if (oldTask.description !== updatedTask.description) {
      await recordTaskHistory({
        taskId: taskId,
        userId: req.user.id,
        action: 'updated',
        field: 'description',
        oldValue: oldTask.description,
        newValue: updatedTask.description,
        description: createDescription('updated', 'description', null, null, currentUser?.username || 'Utilisateur')
      });
    }
    
    res.json({ 
      message: 'Tâche mise à jour avec succès', 
      task: updatedTask 
    });
    
  } catch (err) {
    console.error('❌ Erreur mise à jour tâche:', err);
    res.status(500).json({ message: 'Erreur lors de la modification', error: err });
  }
});

// ROUTE MODIFIÉE : Supprimer une tâche avec historique
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const taskId = req.params.id;
    
    // Récupérer la tâche avant suppression
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Tâche non trouvée' });
    }
    
    // Vérifier les permissions (seul le manager peut supprimer)
    if (req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Seul un manager peut supprimer une tâche' });
    }
    
    const currentUser = await User.findById(req.user.id);
    
    // NOUVEAU : Enregistrer la suppression dans l'historique AVANT de supprimer
    await recordTaskHistory({
      taskId: task._id,
      userId: req.user.id,
      action: 'deleted',
      description: createDescription('deleted', null, null, null, currentUser?.username || 'Manager')
    });
    
    // Supprimer la tâche
    await Task.findByIdAndDelete(taskId);
    console.log('🗑️ Tâche supprimée:', taskId);
    
    res.json({ message: 'Tâche supprimée avec succès' });
    
  } catch (err) {
    console.error('❌ Erreur suppression tâche:', err);
    res.status(500).json({ message: 'Erreur lors de la suppression', error: err });
  }
});

// Recherche par titre (inchangée)
router.get('/search/:title', verifyToken, async (req, res) => {
  try {
    const titleToSearch = req.params.title;
    let tasks;

    if (req.user.role === 'manager') {
      tasks = await Task.find({
        title: { $regex: titleToSearch, $options: 'i' }
      });
    } else {
      tasks = await Task.find({
        assignedTo: req.user.id,
        title: { $regex: titleToSearch, $options: 'i' }
      });
    }

    if (tasks.length === 0) {
      return res.status(404).json({ message: 'Tâche introuvable' });
    }

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la recherche', error: err });
  }
});

module.exports = router;