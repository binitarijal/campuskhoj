import ModerationLog from '../models/ModerationLog.js'

export function recordAdminAction({ entityType, entityId, action, actor, reason, before, after, session }) {
  return ModerationLog.create([{
    entityType, entityId, action, actor, reason,
    ...(before === undefined ? {} : { before }),
    ...(after === undefined ? {} : { after }),
  }], session ? { session } : undefined).then((records) => records[0])
}
