// models/TaskHistory.js
const mongoose = require('mongoose');

const taskHistorySchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  action: { type: String, required: true, enum: ['created', 'status_changed', 'updated', 'assigned', 'reassigned', 'deleted'] },
  description: String,
  field: String,
  oldValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('TaskHistory', taskHistorySchema);