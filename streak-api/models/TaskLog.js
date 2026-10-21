const mongoose = require('mongoose');

const taskLogSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
      index: true,
    },
    completed_at: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

taskLogSchema.index({ taskId: 1, completed_at: -1 });

module.exports = mongoose.models.TaskLog || mongoose.model('TaskLog', taskLogSchema);
