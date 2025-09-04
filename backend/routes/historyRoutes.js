const express = require('express');
const TaskHistory = require('../models/TaskHistory');
const Task = require('../models/Task');
const User = require('../models/User');

const router = express.Router();

// Middleware d'authentification (optionnel - ajustez selon vos besoins)
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token manquant' });

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token invalide' });
  }
};

// GET /api/history - Récupérer tout l'historique
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Récupération de l\'historique...');
    
    const history = await TaskHistory.find()
      .populate('taskId', 'title status')
      .populate('userId', 'username')
      .sort({ createdAt: -1 })
      .limit(100); // Limite à 100 entrées pour éviter la surcharge
    
    console.log(`✅ ${history.length} entrées d'historique trouvées`);
    
    res.json({
      success: true,
      data: history,
      count: history.length
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de l\'historique:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de l'historique",
      error: error.message
    });
  }
});

// GET /api/history/task/:taskId - Historique d'une tâche spécifique
router.get('/task/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    console.log(`📊 Récupération de l'historique pour la tâche ${taskId}...`);
    
    const history = await TaskHistory.find({ taskId })
      .populate('userId', 'username')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: history,
      count: history.length
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de l\'historique de la tâche:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de l'historique de la tâche",
      error: error.message
    });
  }
});

// GET /api/history/stats - Statistiques d'historique
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 Calcul des statistiques d\'historique...');
    
    const stats = await TaskHistory.aggregate([
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    const totalEntries = await TaskHistory.countDocuments();
    
    res.json({
      success: true,
      data: {
        totalEntries,
        actionStats: stats
      }
    });
  } catch (error) {
    console.error('❌ Erreur lors du calcul des statistiques:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du calcul des statistiques",
      error: error.message
    });
  }
});

// POST /api/history - Ajouter une entrée d'historique (pour les tests)
router.post('/', async (req, res) => {
  try {
    const { taskId, action, description, userId } = req.body;
    
    const historyEntry = new TaskHistory({
      taskId,
      action,
      description,
      userId
    });
    
    await historyEntry.save();
    
    res.json({
      success: true,
      data: historyEntry,
      message: 'Entrée d\'historique créée avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'entrée d\'historique:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création de l'entrée d'historique",
      error: error.message
    });
  }
});

module.exports = router;