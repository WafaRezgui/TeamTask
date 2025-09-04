const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  status: { 
    type: String, 
    enum: ['à faire', 'en cours', 'terminée'], 
    default: 'à faire' 
  },
  type: { 
    type: String, 
    enum: ['spécifique', 'générale'], 
    default: 'spécifique' 
  },
  assignedTo: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }], // Tableau pour gérer plusieurs utilisateurs (générale ou spécifique)
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  } // Ajout pour tracker le créateur (manager)
});

module.exports = mongoose.model('Task', taskSchema);