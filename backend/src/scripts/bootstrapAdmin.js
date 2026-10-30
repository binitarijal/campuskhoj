import mongoose from 'mongoose'
import { env } from '../config/env.js'
import { User, ModerationLog } from '../models/index.js'

if (!env.INITIAL_ADMIN_EMAIL) {
  throw new Error('Set INITIAL_ADMIN_EMAIL in backend/.env to the Google account that should receive the initial administrator role.')
}

await mongoose.connect(env.MONGODB_URI)
const session = await mongoose.startSession()

try {
  await session.withTransaction(async () => {
    const user = await User.findOne({ email: env.INITIAL_ADMIN_EMAIL.toLowerCase() }).session(session)
    if (!user || user.status !== 'active') {
      throw new Error('The configured administrator account must first sign in with Google and be active.')
    }
    if (user.role === 'admin') return

    user.role = 'admin'
    await user.save({ session })
    await ModerationLog.create([{
      entityType: 'user',
      entityId: user._id,
      action: 'bootstrap-admin',
      actor: user._id,
      reason: 'Explicit server-side initial administrator provisioning.',
      before: { role: 'user' },
      after: { role: 'admin' },
    }], { session })
  })
  console.info('[admin-bootstrap] Configured active account verified; administrator provisioning complete.')
} finally {
  await session.endSession()
  await mongoose.disconnect()
}
