const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Inscription
router.post('/register', async (req, res) => {
  const { username, password, role } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword, role });
    await newUser.save();
    res.status(201).json({ message: 'Utilisateur créé avec succès' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de l\'inscription', error: err });
  }
});

// Connexion
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'Utilisateur non trouvé' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Mot de passe incorrect' });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'secretkey', // Fallback à 'secretkey' pour compatibilité
      { expiresIn: '1h' }
    );

    res.json({ token, role: user.role });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la connexion', error: err });
  }
});

// Nouvelle route : Liste des utilisateurs (accessible seulement aux managers)
router.get('/users', (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token manquant' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey'); // Fallback à 'secretkey'
    req.user = decoded;
    if (req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Accès réservé aux managers' });
    }
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token invalide' });
  }
}, async (req, res) => {
  try {
    const users = await User.find({}, '_id username role'); // Retourne ID, username et role
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs', error: err });
  }
});

module.exports = router;