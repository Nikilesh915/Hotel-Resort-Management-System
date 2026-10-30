import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    audit_id: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    user_id: {
      type: String,
      required: true,
      index: true
    },
    action: {
      type: String,
      required: true,
      index: true
    },
    entity_type: {
      type: String,
      required: true,
      index: true
    },
    entity_id: {
      type: String,
      required: true,
      index: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    created_at: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  { timestamps: false }
);

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
