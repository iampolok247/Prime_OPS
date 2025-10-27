import mongoose from 'mongoose';

const LeadSchema = new mongoose.Schema(
  {
    leadId: { type: String, required: true, unique: true, index: true }, // e.g., LEAD-2025-0001
    entryDate: { type: Date, default: Date.now },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, index: true },
    email: { type: String, trim: true, lowercase: true, index: true },
    interestedCourse: { type: String, default: '' }, // (Phase 5+ can ref Course)
    source: {
      type: String,
      enum: ['Meta Lead', 'LinkedIn Lead', 'Manually Generated Lead', 'Others'],
      default: 'Manually Generated Lead'
    },

    status: {
      type: String,
      enum: ['Assigned', 'Counseling', 'In Follow Up', 'Admitted', 'Not Admitted', 'Interested'],
      default: 'Assigned'
    },

    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Admission member
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // DM user
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

export default mongoose.model('Lead', LeadSchema);
