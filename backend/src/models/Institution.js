import mongoose from 'mongoose'

const { Schema } = mongoose

const courseSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  category: { type: String, trim: true, maxlength: 100 },
  qualification: { type: String, trim: true, maxlength: 120 },
  level: { type: String, trim: true, maxlength: 80 },
  duration: { type: String, trim: true, maxlength: 80 },
  department: { type: String, trim: true, maxlength: 120 },
  eligibility: { type: String, trim: true, maxlength: 1000 },
  admissionRequirements: { type: String, trim: true, maxlength: 2000 },
  description: { type: String, trim: true, maxlength: 2000 },
  tuitionFee: { type: Number, min: 0 },
  availableSeats: { type: Number, min: 0, max: 100000 },
  isPublic: { type: Boolean, default: true },
}, { _id: false })

const assetSchema = new Schema({
  publicId: { type: String, required: true, trim: true, maxlength: 255 },
  secureUrl: { type: String, required: true, trim: true, maxlength: 2048 },
  width: { type: Number, min: 1 },
  height: { type: Number, min: 1 },
  alt: { type: String, trim: true, maxlength: 200 },
  category: { type: String, trim: true, maxlength: 60 },
  order: { type: Number, min: 0, max: 1000, default: 0 },
}, { _id: false })

const facilitySchema = new Schema({
  code: { type: String, required: true, trim: true, lowercase: true, match: /^[a-z0-9-]{2,60}$/ },
  label: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 500 },
  images: { type: [assetSchema], default: [], validate: { validator: (items) => items.length <= 8, message: 'A facility can have at most eight images.' } },
}, { _id: false })

const facultySchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 140 },
  designation: { type: String, trim: true, maxlength: 120 },
  department: { type: String, trim: true, maxlength: 120 },
  qualification: { type: String, trim: true, maxlength: 200 },
  experienceYears: { type: Number, min: 0, max: 80 },
  photo: assetSchema,
  biography: { type: String, trim: true, maxlength: 2000 },
}, { _id: false })

const scholarshipSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 140 },
  description: { type: String, trim: true, maxlength: 1000 },
  eligibility: { type: String, trim: true, maxlength: 1000 },
  amount: { type: Number, min: 0 },
}, { _id: false })

const institutionSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 180 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, maxlength: 180 },
  type: { type: String, required: true, enum: ['School', 'College', 'University'] },
  establishedYear: { type: Number, min: 1000, max: 3000 },
  accreditation: { type: [{ type: String, trim: true, maxlength: 160 }], default: [] },
  description: { type: String, trim: true, maxlength: 4000 },
  history: { type: String, trim: true, maxlength: 4000 },
  location: {
    country: { type: String, required: true, trim: true, maxlength: 100 },
    stateProvince: { type: String, trim: true, maxlength: 100 },
    city: { type: String, required: true, trim: true, maxlength: 100 },
    address: { type: String, trim: true, maxlength: 500 },
    coordinates: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number], validate: { validator: (coords) => coords.length === 2 && coords[0] >= -180 && coords[0] <= 180 && coords[1] >= -90 && coords[1] <= 90, message: 'Coordinates must be [longitude, latitude].' } },
    },
  },
  logo: assetSchema,
  coverImage: assetSchema,
  gallery: { type: [assetSchema], default: [], validate: { validator: (items) => items.length <= 20, message: 'Gallery cannot contain more than 20 images.' } },
  courses: { type: [courseSchema], default: [] },
  departments: { type: [{ type: String, trim: true, maxlength: 120 }], default: [] },
  faculties: { type: [{ type: String, trim: true, maxlength: 120 }], default: [] },
  facultyProfiles: { type: [facultySchema], default: [], validate: { validator: (items) => items.length <= 250, message: 'An institution can have at most 250 faculty profiles.' } },
  facilities: { type: [facilitySchema], default: [], validate: { validator: (items) => new Set(items.map((item) => item.code)).size === items.length, message: 'Facility codes must be unique within an institution.' } },
  fees: [{
    label: { type: String, required: true, trim: true, maxlength: 100 },
    amount: { type: Number, min: 0 },
    currency: { type: String, uppercase: true, trim: true, minlength: 3, maxlength: 3 },
    period: { type: String, trim: true, maxlength: 50 },
    source: { type: String, enum: ['institution-provided', 'unverified'], default: 'unverified' },
    notes: { type: String, trim: true, maxlength: 500 },
  }],
  admission: { type: String, trim: true, maxlength: 4000 },
  admissions: {
    procedure: { type: String, trim: true, maxlength: 4000 },
    applicationDeadline: { type: Date },
    scholarships: { type: [scholarshipSchema], default: [] },
    financialAid: { type: String, trim: true, maxlength: 3000 },
    contactName: { type: String, trim: true, maxlength: 140 },
    contactEmail: { type: String, lowercase: true, trim: true, maxlength: 254 },
    contactPhone: { type: String, trim: true, maxlength: 40 },
  },
  contacts: {
    phone: { type: String, trim: true, maxlength: 40 },
    email: { type: String, lowercase: true, trim: true, maxlength: 254 },
    officialWebsite: { type: String, trim: true, maxlength: 2048 },
    address: { type: String, trim: true, maxlength: 500 },
  },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft', required: true },
  verificationStatus: { type: String, enum: ['unverified', 'pending', 'verified', 'rejected'], default: 'unverified', required: true },
  ratingAverage: { type: Number, min: 0, max: 5, default: 0 },
  ratingCount: { type: Number, min: 0, default: 0 },
  categoryAverages: { type: Map, of: { type: Number, min: 0, max: 5 }, default: {} },
}, { timestamps: true, strict: 'throw' })

institutionSchema.index({ status: 1, type: 1 })
institutionSchema.index({ 'location.country': 1, 'location.stateProvince': 1, 'location.city': 1 })
institutionSchema.index({ ratingAverage: -1 })
institutionSchema.index({ createdAt: -1 })
institutionSchema.index({ name: 'text', 'location.city': 'text', 'location.stateProvince': 'text', 'location.country': 'text', 'courses.name': 'text', departments: 'text' })
institutionSchema.index({ 'location.coordinates': '2dsphere' })

export default mongoose.models.Institution || mongoose.model('Institution', institutionSchema)
