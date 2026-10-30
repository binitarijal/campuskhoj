import mongoose from 'mongoose'
import Institution from '../models/Institution.js'
import Review from '../models/Review.js'
import { recordAdminAction } from '../services/auditLog.js'
import { deleteCloudinaryImage, uploadImageBuffer, validImageBuffer } from '../services/imageUpload.js'

async function deleteIfUnreferenced(publicId) {
  const [institutionReferences, reviewReferences] = await Promise.all([
    Institution.countDocuments({ $or: [
      { 'logo.publicId': publicId }, { 'coverImage.publicId': publicId }, { 'gallery.publicId': publicId },
      { 'facilities.images.publicId': publicId }, { 'facultyProfiles.photo.publicId': publicId },
    ] }),
    Review.countDocuments({ 'attachments.publicId': publicId }),
  ])
  if (institutionReferences + reviewReferences > 0) return { deleted: false, stillReferenced: true }
  return { deleted: await deleteCloudinaryImage(publicId), stillReferenced: false }
}

export async function uploadInstitutionImage(req, res, next) {
  let uploaded
  let cloudinaryRequest = false
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Institution ID is invalid.' } })
    const file = { buffer: req.body, mimetype: req.get('content-type')?.split(';')[0] }
    if (!validImageBuffer(file.buffer, file.mimetype)) return res.status(415).json({ error: { code: 'INVALID_IMAGE', message: 'Upload a valid JPEG, PNG, or WebP image.' } })
    const collection = req.query.collection
    if (!['logo', 'coverImage', 'gallery', 'facility', 'faculty'].includes(collection)) return res.status(400).json({ error: { code: 'INVALID_COLLECTION', message: 'Choose a supported image collection.' } })
    const existingInstitution = await Institution.findById(req.params.id).select('_id')
    if (!existingInstitution) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Institution not found.' } })
    cloudinaryRequest = true
    uploaded = await uploadImageBuffer(file.buffer, `campuscompass/institutions/${existingInstitution._id}`)
    cloudinaryRequest = false
    const asset = {
      publicId: uploaded.public_id,
      secureUrl: uploaded.secure_url,
      width: uploaded.width,
      height: uploaded.height,
      alt: String(req.query.alt || '').trim().slice(0, 200),
      category: String(req.query.category || collection).trim().slice(0, 60),
      order: 0,
    }
    const session = await mongoose.startSession()
    let replacedPublicId
    try {
      await session.withTransaction(async () => {
        const institution = await Institution.findById(existingInstitution._id).session(session)
        if (!institution) {
          const error = new Error('Institution not found.')
          error.status = 404
          throw error
        }
        if (collection === 'logo') {
          replacedPublicId = institution.logo?.publicId
          institution.logo = asset
        } else if (collection === 'coverImage') {
          replacedPublicId = institution.coverImage?.publicId
          institution.coverImage = asset
        } else if (collection === 'gallery') {
          if (institution.gallery.length >= 20) {
            const error = new Error('An institution gallery can have at most twenty images.')
            error.status = 409
            throw error
          }
          asset.order = institution.gallery.length
          institution.gallery.push(asset)
        } else if (collection === 'facility') {
          const facility = institution.facilities.find((item) => item.code === String(req.query.facilityCode || '').toLowerCase())
          if (!facility) {
            const error = new Error('Create the facility before uploading its images.')
            error.status = 404
            throw error
          }
          if (facility.images.length >= 8) {
            const error = new Error('A facility can have at most eight images.')
            error.status = 409
            throw error
          }
          facility.images.push(asset)
        } else {
          const facultyIndex = Number.parseInt(req.query.facultyIndex, 10)
          if (!Number.isInteger(facultyIndex) || facultyIndex < 0 || facultyIndex >= institution.facultyProfiles.length) {
            const error = new Error('Choose an existing faculty profile before uploading its photo.')
            error.status = 404
            throw error
          }
          replacedPublicId = institution.facultyProfiles[facultyIndex].photo?.publicId
          institution.facultyProfiles[facultyIndex].photo = asset
        }
        await institution.save({ session })
        await recordAdminAction({ entityType: 'institution', entityId: institution._id, action: 'edit', actor: req.authUser._id, reason: `Uploaded ${collection} media.`, session })
      })
    } finally {
      await session.endSession()
    }
    if (replacedPublicId) await deleteIfUnreferenced(replacedPublicId).catch(() => undefined)
    return res.status(201).json({ data: asset })
  } catch (error) {
    if (uploaded?.public_id) await deleteCloudinaryImage(uploaded.public_id).catch(() => undefined)
    if (cloudinaryRequest) {
      error.status = 502
      error.publicCode = 'IMAGE_SERVICE_UNAVAILABLE'
      error.publicMessage = 'Cloudinary could not store this image. Check the backend network and Cloudinary configuration, then try again.'
    }
    return next(error)
  }
}

export async function deleteInstitutionImage(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Institution ID is invalid.' } })
    const publicId = String(req.body?.publicId || '').trim()
    if (!publicId || publicId.length > 255) return res.status(400).json({ error: { code: 'INVALID_MEDIA_ID', message: 'A Cloudinary public ID is required.' } })
    const institution = await Institution.findById(req.params.id)
    if (!institution) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Institution not found.' } })

    let found = false
    if (institution.logo?.publicId === publicId) { institution.logo = undefined; found = true }
    if (institution.coverImage?.publicId === publicId) { institution.coverImage = undefined; found = true }
    const originalGalleryLength = institution.gallery.length
    institution.gallery = institution.gallery.filter((asset) => asset.publicId !== publicId)
    found ||= institution.gallery.length !== originalGalleryLength
    for (const facility of institution.facilities) {
      const length = facility.images.length
      facility.images = facility.images.filter((asset) => asset.publicId !== publicId)
      found ||= facility.images.length !== length
    }
    for (const faculty of institution.facultyProfiles) {
      if (faculty.photo?.publicId === publicId) { faculty.photo = undefined; found = true }
    }
    if (!found) return res.status(404).json({ error: { code: 'MEDIA_NOT_FOUND', message: 'That image is not attached to this institution.' } })
    const session = await mongoose.startSession()
    try {
      await session.withTransaction(async () => {
        await institution.save({ session })
        await recordAdminAction({ entityType: 'institution', entityId: institution._id, action: 'edit', actor: req.authUser._id, reason: 'Detached institution media.', session })
      })
    } finally { await session.endSession() }
    const cleanup = await deleteIfUnreferenced(publicId).catch(() => ({ deleted: false, stillReferenced: false }))
    return res.json({ data: { deleted: true, publicId, cloudinaryDeleted: cleanup.deleted, cloudinaryStillReferenced: cleanup.stillReferenced } })
  } catch (error) {
    return next(error)
  }
}
