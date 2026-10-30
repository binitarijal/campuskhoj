import { v2 as cloudinary } from 'cloudinary'

export function validImageBuffer(buffer, mimeType) {
  if (!Buffer.isBuffer(buffer) || !['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) return false
  if (mimeType === 'image/jpeg') return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
  if (mimeType === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  return buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP'
}

export function uploadImageBuffer(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'image', overwrite: false }, (error, result) => {
      if (error) return reject(error)
      if (!result?.public_id || !/^https:\/\/res\.cloudinary\.com\//i.test(result.secure_url || '') || !Number.isInteger(result.width) || !Number.isInteger(result.height)) {
        if (result?.public_id) void cloudinary.uploader.destroy(result.public_id, { resource_type: 'image' }).catch(() => undefined)
        return reject(new Error('Cloudinary returned incomplete image metadata.'))
      }
      return resolve(result)
    })
    stream.end(buffer)
  })
}

export async function deleteCloudinaryImage(publicId) {
  const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true })
  return result.result === 'ok' || result.result === 'not found'
}
