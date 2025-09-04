// middlewares/authorizeRole.js
const jwt = require('jsonwebtoken');

function authorizeRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès refusé : rôle insuffisant' });
    }
    next();
  };
}

// AJOUT: Middleware d'authentification simple pour l'historique
const authenticate = (req, res, next) => {
  const authHeader = req.header('Authorization');
  const xAuthToken = req.header('x-auth-token');
  const token = authHeader?.replace('Bearer ', '') || xAuthToken;

  console.log('En-tête Authorization:', authHeader);
  console.log('En-tête x-auth-token:', xAuthToken);
  console.log('Token extrait:', token);

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Token manquant, accès refusé' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token décodé:', decoded); // Ajoute ce log
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Erreur de vérification du token:', error.message);
    res.status(401).json({ 
      success: false,
      message: 'Token invalide' 
    });
  }
};

module.exports = authorizeRole;
module.exports.authenticate = authenticate; // AJOUT de l'export