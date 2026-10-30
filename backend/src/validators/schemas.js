import { z } from 'zod'

const slug = z.string().trim().min(2).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
const boundedText = (max) => z.string().trim().max(max)
const nullableText = (max) => boundedText(max).optional().nullable()
const asset = z.object({
  publicId: z.string().trim().min(1).max(255),
  secureUrl: z.string().url().max(2048),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  alt: boundedText(200).optional(),
  category: boundedText(60).optional(),
  order: z.number().int().min(0).max(1000).optional(),
}).strict()

const course = z.object({
  name: z.string().trim().min(1).max(120),
  category: nullableText(100), qualification: nullableText(120), level: nullableText(80),
  duration: nullableText(80), department: nullableText(120), eligibility: nullableText(1000),
  admissionRequirements: nullableText(2000), description: nullableText(2000),
  tuitionFee: z.number().min(0).optional(), availableSeats: z.number().int().min(0).max(100000).optional(),
  isPublic: z.boolean().optional(),
}).strict()

const facility = z.object({
  code: z.string().trim().toLowerCase().min(2).max(60).regex(/^[a-z0-9-]+$/),
  label: z.string().trim().min(1).max(100), description: nullableText(500),
  images: z.array(asset).max(8).optional(),
}).strict()

const faculty = z.object({
  name: z.string().trim().min(1).max(140), designation: nullableText(120), department: nullableText(120),
  qualification: nullableText(200), experienceYears: z.number().min(0).max(80).optional(),
  photo: asset.optional().nullable(), biography: nullableText(2000),
}).strict()

const fee = z.object({
  label: z.string().trim().min(1).max(100), amount: z.number().min(0).optional(),
  currency: z.string().trim().toUpperCase().length(3).optional(), period: nullableText(50),
  source: z.enum(['institution-provided', 'unverified']).optional(), notes: nullableText(500),
}).strict()

const location = z.object({
  country: z.string().trim().min(1).max(100), stateProvince: nullableText(100),
  city: z.string().trim().min(1).max(100), address: nullableText(500),
  coordinates: z.object({ type: z.literal('Point'), coordinates: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]) }).optional(),
}).strict()

const contact = z.object({
  phone: nullableText(40), email: z.union([z.string().email().max(254), z.literal('')]).optional(),
  officialWebsite: z.union([z.string().url().max(2048), z.literal('')]).optional(), address: nullableText(500),
}).strict()

const admissions = z.object({
  procedure: nullableText(4000), applicationDeadline: z.string().datetime().optional().nullable(),
  scholarships: z.array(z.object({ name: z.string().trim().min(1).max(140), description: nullableText(1000), eligibility: nullableText(1000), amount: z.number().min(0).optional() }).strict()).max(100).optional(),
  financialAid: nullableText(3000), contactName: nullableText(140),
  contactEmail: z.union([z.string().email().max(254), z.literal('')]).optional(), contactPhone: nullableText(40),
}).strict()

export const institutionShape = {
  name: z.string().trim().min(2).max(180), slug, type: z.enum(['School', 'College', 'University']),
  verificationStatus: z.enum(['unverified', 'pending', 'verified', 'rejected']).optional(),
  establishedYear: z.number().int().min(1000).max(new Date().getFullYear()).optional().nullable(),
  accreditation: z.array(boundedText(160)).max(50).optional(), description: nullableText(4000), history: nullableText(4000),
  location, logo: asset.optional().nullable(), coverImage: asset.optional().nullable(),
  gallery: z.array(asset).max(20).optional(), courses: z.array(course).max(500).optional(),
  departments: z.array(boundedText(120)).max(200).optional(), faculties: z.array(boundedText(120)).max(200).optional(),
  facultyProfiles: z.array(faculty).max(250).optional(), facilities: z.array(facility).max(100).refine((items) => new Set(items.map((item) => item.code)).size === items.length, 'Facility codes must be unique.').optional(),
  fees: z.array(fee).max(100).optional(), admission: nullableText(4000), admissions: admissions.optional(),
  contacts: contact.optional(),
}

export const createInstitutionSchema = z.object(institutionShape).strict()
export const updateInstitutionSchema = z.object(institutionShape).partial().strict()

const ratingKeys = ['academicQuality', 'faculty', 'infrastructure', 'library', 'hostel', 'campusEnvironment', 'placement', 'valueForMoney']
export const reviewSchema = z.object({
  institutionId: z.string().regex(/^[a-f\d]{24}$/i),
  overallRating: z.number().int().min(1).max(5),
  categoryRatings: z.record(z.string(), z.number().int().min(1).max(5)).refine((value) => Object.keys(value).every((key) => ratingKeys.includes(key)), 'Choose a supported rating category.').optional(),
  title: z.string().trim().min(3).max(120), body: z.string().trim().min(40).max(4000),
  pros: nullableText(1500), cons: nullableText(1500), attendancePeriod: nullableText(80),
}).strict()

export const reportSchema = z.object({
  reviewId: z.string().regex(/^[a-f\d]{24}$/i),
  reason: z.enum(['fake-review', 'spam', 'abusive-language', 'misleading-information', 'conflict-of-interest', 'other']),
  details: nullableText(2000),
}).strict()

export const reviewActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'flag', 'hide', 'remove']),
  note: boundedText(2000).optional(), reason: boundedText(500).optional(),
}).strict().refine((value) => value.action === 'approve' || Boolean(value.reason?.trim() || value.note?.trim()), {
  message: 'Add a moderation reason for this action.', path: ['reason'],
})

export const reportResolutionSchema = z.object({
  action: z.enum(['resolve', 'dismiss', 'remove-review']),
  reason: z.string().trim().min(3).max(1000),
}).strict()

export const userStatusSchema = z.object({ status: z.enum(['active', 'suspended', 'deactivated']) }).strict()
export const userRoleSchema = z.object({ role: z.enum(['user', 'admin']) }).strict()
export const categorySchema = z.object({
  name: z.string().trim().min(2).max(100), slug,
  kind: z.enum(['institution', 'course']), description: nullableText(500), active: z.boolean().optional(),
}).strict()
