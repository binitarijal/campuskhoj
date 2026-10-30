import mongoose from 'mongoose'

const favoriteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
}, { timestamps: true, strict: 'throw' })

favoriteSchema.index({ user: 1, institution: 1 }, { unique: true })
favoriteSchema.index({ user: 1, createdAt: -1 })

export default mongoose.models.Favorite || mongoose.model('Favorite', favoriteSchema)
