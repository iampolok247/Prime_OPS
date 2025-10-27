import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, default: '' }, // optional, UI থেকে আসতে পারে
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    deadline: { type: Date, required: true },
    status: { type: String, enum: ['InProgress', 'Completed'], default: 'InProgress' },
    completedAt: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.model('Task', TaskSchema);
