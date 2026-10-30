import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  googleSub: { type: String, required: true, unique: true, immutable: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  avatarUrl: { type: String, trim: true, maxlength: 2048 },
  role: { type: String, enum: ['user', 'admin'], default: 'user', required: true },
  status: { type: String, enum: ['active', 'suspended', 'deactivated'], default: 'active', required: true },
  lastLoginAt: { type: Date },
  lastSeenAt: { type: Date },
  deactivatedAt: { type: Date },
  sessionVersion: { type: Number, min: 0, default: 0, required: true },
}, { timestamps: true, strict: 'throw' })

userSchema.index({ role:  1, status: 1 })

export default mongoose.models.User || mongoose.model('User', userSchema)
