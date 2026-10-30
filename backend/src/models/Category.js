import mongoose from 'mongoose'

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 120, match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/ },
  kind: { type: String, enum: ['institution', 'course'], required: true },
  description: { type: String, trim: true, maxlength: 500 },
  active: { type: Boolean, default: true, required: true },
}, { timestamps: true, strict: 'throw' })

categorySchema.index({ kind: 1, slug: 1 }, { unique: true })
categorySchema.index({ kind: 1, active: 1, name: 1 })

export default mongoose.models.Category || mongoose.model('Category', categorySchema)
