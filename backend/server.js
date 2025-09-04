const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const User = require('./models/User');

// Charger les variables d'environnement
dotenv.config();

console.log('🔄 Démarrage TeamTask Backend...');

const app = express();

// ----- CORS -----
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin.startsWith('http://localhost') || origin.startsWith('https://localhost')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// ----- Middleware -----
app.use(express.json());

app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.path}`);
  console.log('📦 Body:', req.body);
  next();
});

// ----- Connexion MongoDB -----
const connectDB = async () => {
  try {
    console.log('🔄 Connexion à MongoDB...');
    
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      maxPoolSize: 10
    });
    
    console.log('✅ Connecté à MongoDB Atlas');
    return true;
    
  } catch (error) {
    console.error('❌ Erreur de connexion à MongoDB :', error.message);
    return false;
  }
};

// ----- Fonction pour charger les routes -----
const loadRoutes = async () => {
  try {
    console.log('🔄 Chargement des routes...');

    // IMPORTANT: Import TaskHistory APRÈS la connexion MongoDB
    const TaskHistory = require('./models/TaskHistory');
    console.log('✅ TaskHistory model chargé après connexion DB');

    // Vérifier que TaskHistory est bien un modèle Mongoose
    if (!TaskHistory || typeof TaskHistory.countDocuments !== 'function') {
      throw new Error('TaskHistory n\'est pas un modèle Mongoose valide');
    }

    // Import des routes et middlewares
    const authRoutes = require('./routes/authRoutes');
    console.log('✅ authRoutes chargé');

    const taskRoutes = require('./routes/taskRoutes');
    console.log('✅ taskRoutes chargé');

    const historyRoutes = require('./routes/historyRoutes');
    console.log('✅ historyRoutes chargé');

    const { getTaskHistory } = require('./utils/taskHistory');
    console.log('✅ taskHistory utils chargé');

    // Monter les routes principales
    app.use('/api/auth', authRoutes);
    app.use('/api/tasks', taskRoutes);
    app.use('/api/history', historyRoutes);
    console.log('✅ Routes montées sur /api/auth, /api/tasks, /api/history');

    // ----- Route utilisateurs -----
    app.get('/api/users', async (req, res) => {
      try {
        const users = await User.find();
        res.json({
          success: true,
          count: users.length,
          data: users
        });
      } catch (error) {
        console.error('❌ Erreur récupération utilisateurs:', error.message);
        res.status(500).json({ 
          success: false,
          message: 'Erreur lors de la récupération des utilisateurs',
          error: error.message
        });
      }
    });
    console.log('✅ Endpoint /api/users ajouté');

    // ----- Route de test TaskHistory direct -----
    app.get('/test-taskhistory-direct', async (req, res) => {
      try {
        console.log('=== DIAGNOSTIC TASKHISTORY ===');
        console.log('Type de TaskHistory:', typeof TaskHistory);
        console.log('Constructor:', TaskHistory.constructor.name);
        console.log('countDocuments:', typeof TaskHistory.countDocuments);
        console.log('État connexion MongoDB:', mongoose.connection.readyState);
        
        // Test direct de countDocuments
        const count = await TaskHistory.countDocuments();
        console.log('Count réussi:', count);
        
        // Test de création d'une entrée de test
        const testEntry = new TaskHistory({
          taskId: new mongoose.Types.ObjectId(),
          userId: new mongoose.Types.ObjectId(),
          action: 'created',
          description: 'Test de diagnostic'
        });
        
        res.json({
          success: true,
          taskHistoryType: typeof TaskHistory,
          constructor: TaskHistory.constructor.name,
          hasCountDocuments: typeof TaskHistory.countDocuments === 'function',
          mongooseConnection: mongoose.connection.readyState,
          actualCount: count,
          canCreateInstance: !!testEntry,
          message: '✅ Diagnostic TaskHistory réussi - Modèle fonctionnel'
        });
      } catch (error) {
        console.error('Erreur diagnostic TaskHistory:', error);
        res.status(500).json({
          success: false,
          error: error.message,
          stack: error.stack,
          message: '❌ Diagnostic TaskHistory échoué'
        });
      }
    });

    // ----- Route de test sans authentification pour l'historique -----
    app.get('/api/history-no-auth', async (req, res) => {
      try {
        console.log('📊 Test historique sans authentification...');
        
        // Vérifier d'abord que TaskHistory fonctionne
        if (typeof TaskHistory.countDocuments !== 'function') {
          throw new Error('TaskHistory.countDocuments is not a function');
        }
        
        const historyCount = await TaskHistory.countDocuments();
        console.log(`Nombre total d'entrées: ${historyCount}`);
        
        const history = await TaskHistory.find()
          .populate('userId', 'username')
          .populate('taskId', 'title')
          .sort({ createdAt: -1 })
          .limit(10);
        
        res.json({
          success: true,
          message: 'Test historique sans auth réussi',
          totalEntries: historyCount,
          data: history,
          count: history.length
        });
      } catch (error) {
        console.error('❌ Erreur test historique:', error);
        res.status(500).json({
          success: false,
          message: 'Erreur lors du test historique',
          error: error.message,
          details: {
            taskHistoryType: typeof TaskHistory,
            hasCountDocuments: TaskHistory && typeof TaskHistory.countDocuments === 'function'
          }
        });
      }
    });
    console.log('✅ Route test historique sans auth ajoutée');

    // ----- Routes de test et debug -----
    app.get('/', (req, res) => {
      res.json({
        message: 'Bienvenue sur TeamTask API 🚀',
        version: '1.0.0',
        status: 'active',
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
      });
    });

    app.get('/test', (req, res) => {
      res.json({ 
        message: 'TEST MARCHE !', 
        timestamp: new Date(),
        mongodb: mongoose.connection.readyState
      });
    });

    app.get('/debug-users', (req, res) => {
      res.json({ 
        message: 'Route debug fonctionne!', 
        timestamp: new Date(),
        mongodb: mongoose.connection.readyState
      });
    });

    // ----- Route debug historique corrigée -----
    app.get('/debug-history', async (req, res) => {
      try {
        console.log('=== DEBUG HISTORIQUE ===');
        console.log('Type de TaskHistory:', typeof TaskHistory);
        console.log('Constructor:', TaskHistory.constructor.name);
        console.log('countDocuments existe:', typeof TaskHistory.countDocuments);
        console.log('État MongoDB:', mongoose.connection.readyState);
        
        // Vérification des prérequis
        if (!TaskHistory) {
          return res.json({
            success: false,
            error: 'TaskHistory is undefined',
            debug: 'Le modèle TaskHistory n\'a pas été importé correctement'
          });
        }
        
        if (typeof TaskHistory.countDocuments !== 'function') {
          return res.json({
            success: false,
            error: 'TaskHistory.countDocuments is not a function',
            taskHistoryType: typeof TaskHistory,
            constructor: TaskHistory.constructor.name,
            mongooseState: mongoose.connection.readyState,
            debug: 'Le modèle TaskHistory n\'est pas correctement initialisé comme modèle Mongoose'
          });
        }

        // Tests fonctionnels
        const historyCount = await TaskHistory.countDocuments();
        console.log(`Total d'entrées: ${historyCount}`);
        
        const recentHistory = await TaskHistory.find()
          .sort({ createdAt: -1 })
          .limit(5);
        
        console.log(`Entrées récentes trouvées: ${recentHistory.length}`);
        
        res.json({
          success: true,
          message: '✅ Debug historique fonctionne parfaitement!',
          totalEntries: historyCount,
          recentEntries: recentHistory,
          modelInfo: {
            type: typeof TaskHistory,
            constructor: TaskHistory.constructor.name,
            hasMethods: typeof TaskHistory.countDocuments === 'function'
          },
          mongooseInfo: {
            connectionState: mongoose.connection.readyState,
            connectionName: mongoose.connection.name
          },
          timestamp: new Date()
        });
      } catch (error) {
        console.error('❌ Erreur debug historique:', error);
        res.status(500).json({
          success: false,
          message: 'Erreur debug historique',
          error: error.message,
          stack: error.stack,
          debug: 'Erreur lors de l\'exécution des requêtes MongoDB'
        });
      }
    });

    // ----- Route pour créer une entrée de test -----
    app.post('/api/history-test-create', async (req, res) => {
      try {
        const testEntry = new TaskHistory({
          taskId: new mongoose.Types.ObjectId(),
          userId: new mongoose.Types.ObjectId(), 
          action: 'created',
          description: `Test automatique - ${new Date().toISOString()}`
        });
        
        await testEntry.save();
        console.log('✅ Entrée de test créée:', testEntry._id);
        
        res.json({
          success: true,
          message: 'Entrée d\'historique de test créée avec succès',
          data: testEntry
        });
      } catch (error) {
        console.error('❌ Erreur création test:', error);
        res.status(500).json({
          success: false,
          message: 'Erreur lors de la création de l\'entrée de test',
          error: error.message
        });
      }
    });

    // ----- Gestion des erreurs -----
    app.use((err, req, res, next) => {
      console.error('❌ Erreur serveur:', err.message);
      res.status(500).json({ 
        success: false,
        message: 'Erreur interne serveur',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
      });
    });

    console.log('✅ Toutes les routes chargées avec succès');
    return true;

  } catch (error) {
    console.error('❌ Erreur lors du chargement des routes:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
};

// ----- Démarrage de l'application -----
const startServer = async () => {
  try {
    console.log('🚀 === DÉMARRAGE TEAMTASK BACKEND ===');
    
    // 1. Connexion à MongoDB D'ABORD
    console.log('🔄 Étape 1: Connexion à MongoDB...');
    const isConnected = await connectDB();
    if (!isConnected) {
      console.error('❌ Impossible de se connecter à MongoDB. Arrêt du serveur.');
      process.exit(1);
    }
    console.log('✅ Étape 1 terminée: MongoDB connecté');

    // 2. Chargement des routes APRÈS connexion DB réussie
    console.log('🔄 Étape 2: Chargement des routes et modèles...');
    const routesLoaded = await loadRoutes();
    if (!routesLoaded) {
      console.error('❌ Impossible de charger les routes. Arrêt du serveur.');
      process.exit(1);
    }
    console.log('✅ Étape 2 terminée: Routes et modèles chargés');

    // 3. Démarrage du serveur HTTP
    console.log('🔄 Étape 3: Démarrage du serveur HTTP...');
    const PORT = process.env.PORT || 5000;
    
    const server = app.listen(PORT, () => {
      console.log(`\n🎉 === TEAMTASK BACKEND DÉMARRÉ AVEC SUCCÈS ===`);
      console.log(`🚀 Serveur disponible sur: http://localhost:${PORT}`);
      console.log(`✅ MongoDB: ${mongoose.connection.readyState === 1 ? 'Connecté' : 'Déconnecté'}`);
      console.log(`✅ Base de données: ${mongoose.connection.name}`);
      
      console.log('\n📝 Routes API disponibles:');
      console.log('   🔐 Authentification:');
      console.log('      - POST /api/auth/register');
      console.log('      - POST /api/auth/login');
      console.log('   📋 Tâches:');
      console.log('      - GET/POST/PUT/DELETE /api/tasks/*');
      console.log('   📊 Historique:');
      console.log('      - GET /api/history (avec auth)');
      console.log('      - GET /api/history/task/:taskId');
      console.log('      - GET /api/history/stats');
      console.log('   👥 Utilisateurs:');
      console.log('      - GET /api/users');
      console.log('   🧪 Test/Debug:');
      console.log('      - GET /test');
      console.log('      - GET /debug-users');
      console.log('      - GET /debug-history');
      console.log('      - GET /test-taskhistory-direct');
      console.log('      - GET /api/history-no-auth');
      console.log('      - POST /api/history-test-create');
      
      console.log('\n🎯 Pour tester TaskHistory:');
      console.log(`   curl http://localhost:${PORT}/debug-history`);
      console.log(`   curl http://localhost:${PORT}/test-taskhistory-direct`);
      
      console.log('\n✅ TeamTask Backend est prêt et opérationnel !');
    });

    // Gestion propre de l'arrêt
    process.on('SIGINT', async () => {
      console.log('\n🛑 Arrêt du serveur...');
      server.close(async () => {
        await mongoose.connection.close();
        console.log('👋 Serveur arrêté proprement');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Erreur fatale lors du démarrage:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

// Gestion des erreurs globales
process.on('uncaughtException', (error) => {
  console.error('❌ Erreur non capturée:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejetée:', reason);
  console.error('Promise:', promise);
  process.exit(1);
});

// Démarrer l'application
startServer();