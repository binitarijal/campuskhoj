import mongoose from 'mongoose'

const { Schema } = mongoose

const attachmentSchema = new Schema({
  publicId: { type: String, required: true, trim: true, maxlength: 255 },
  secureUrl: { type: String, required: true, trim: true, maxlength: 2048 },
  width: { type: Number, min: 1 },
  height: { type: Number, min: 1 },
  alt: { type: String, trim: true, maxlength: 200 },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', required: true },
}, { _id: false })

const reviewSchema = new Schema({
  institution: { type: Schema.Types.ObjectId, ref: 'Institution', required: true },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  overallRating: { type: Number, required: true, min: 1, max: 5, validate: Number.isInteger },
  categoryRatings: { type: Map, of: { type: Number, min: 1, max: 5, validate: Number.isInteger }, default: {} },
  title: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
  body: { type: String, required: true, trim: true, minlength: 40, maxlength: 4000 },
  pros: { type: String, trim: true, maxlength: 1500 },
  cons: { type: String, trim: true, maxlength: 1500 },
  attendancePeriod: { type: String, trim: true, maxlength: 80 },
  attachments: { type: [attachmentSchema], default: [], validate: { validator: (items) => items.length <= 4, message: 'A review can have at most four attachments.' } },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'flagged', 'hidden', 'removed'], default: 'pending', required: true, index: true },
  moderation: {
    note: { type: String, trim: true, maxlength: 2000, select: false },
    reason: { type: String, trim: true, maxlength: 500, select: false },
    moderatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    moderatedAt: { type: Date },
  },
  version: { type: Number, min: 1, default: 1 },
}, { timestamps: true, strict: 'throw' })

reviewSchema.index({ author: 1, institution: 1 }, { unique: true })
reviewSchema.index({ institution: 1, status: 1, createdAt: -1 })
reviewSchema.index({ author: 1, status: 1 })
reviewSchema.index({ status: 1, updatedAt: -1 })

export default mongoose.models.Review || mongoose.model('Review', reviewSchema)
