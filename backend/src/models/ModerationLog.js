import mongoose from 'mongoose'

const { Schema } = mongoose

const moderationLogSchema = new Schema({
  entityType: { type: String, required: true, enum: ['review', 'institution', 'user', 'report', 'category'] },
  entityId: { type: Schema.Types.ObjectId, required: true },
  action: { type: String, required: true, enum: ['approve', 'reject', 'flag', 'hide-review', 'remove-review', 'publish', 'unpublish', 'archive', 'create-institution', 'delete-institution', 'suspend-user', 'activate-user', 'deactivate-user', 'change-role', 'resolve-report', 'dismiss-report', 'create-category', 'update-category', 'delete-category', 'bootstrap-admin', 'edit'] },
  actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, trim: true, maxlength: 1000 },
  before: { type: Schema.Types.Mixed, select: false },
  after: { type: Schema.Types.Mixed, select: false },
}, { timestamps: { createdAt: true, updatedAt: false }, strict: 'throw' })

moderationLogSchema.index({ entityType: 1, entityId: 1, createdAt: 1 })
moderationLogSchema.index({ actor: 1, createdAt: -1 })
moderationLogSchema.pre('save', function preventResave() {
  if (!this.isNew) throw new Error('Moderation log entries are immutable.')
})

for (const operation of ['updateOne', 'updateMany', 'findOneAndUpdate', 'deleteOne', 'deleteMany', 'findOneAndDelete', 'replaceOne']) {
  moderationLogSchema.pre(operation, function preventMutation() {
    throw new Error('Moderation log entries are insert-only.')
  })
}

export default mongoose.models.ModerationLog || mongoose.model('ModerationLog', moderationLogSchema)
