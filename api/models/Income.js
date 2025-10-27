// api/models/Income.js
import mongoose from 'mongoose';

const IncomeSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    source: { type: String, required: true }, // e.g., "Admission Fee", "Other"
    amount: { type: Number, required: true },
    refType: { type: String, enum: ['AdmissionFee', 'Manual'], default: 'Manual' },
    refId: { type: mongoose.Schema.Types.ObjectId, default: null }, // link to AdmissionFee when applicable
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    note: { type: String, default: '' }
  },
  { timestamps: true }
);

export default mongoose.model('Income', IncomeSchema);
