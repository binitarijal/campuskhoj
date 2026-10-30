import mongoose from 'mongoose'

const { Schema } = mongoose

const reportSchema = new Schema({
  review: { type: Schema.Types.ObjectId, ref: 'Review', required: true },
  reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true, enum: ['fake-review', 'spam', 'abusive-language', 'misleading-information', 'conflict-of-interest', 'other', 'harassment', 'personal-information', 'false-information'] },
  details: { type: String, trim: true, maxlength: 2000 },
  status: { type: String, enum: ['open', 'resolved', 'dismissed'], default: 'open', required: true },
  resolution: {
    reason: { type: String, trim: true, maxlength: 1000 },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
  },
}, { timestamps: true, strict: 'throw' })

reportSchema.index({ review: 1, reporter: 1 }, { unique: true })
reportSchema.index({ status: 1, createdAt: -1 })

export default mongoose.models.Report || mongoose.model('Report', reportSchema)
