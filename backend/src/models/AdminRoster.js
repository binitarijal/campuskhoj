import mongoose from 'mongoose'

const adminRosterSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, enum: ['admin-roster'] },
  revision: { type: Number, min: 0, default: 0 },
}, { timestamps: true, strict: 'throw' })

export default mongoose.models.AdminRoster || mongoose.model('AdminRoster', adminRosterSchema)
