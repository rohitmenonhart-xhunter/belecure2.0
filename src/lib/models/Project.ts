import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema({
  projectId: {
    type: String,
    required: true,
    unique: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  blueprintData: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  furnitureData: {
    type: [mongoose.Schema.Types.Mixed],
    default: [],
  },
  lightingData: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  status: {
    type: String,
    enum: ['draft', 'blueprint_complete', 'furniture_complete', 'lighting_complete'],
    default: 'draft',
  },
  metadata: {
    wallCount: { type: Number, default: 0 },
    roomCount: { type: Number, default: 0 },
    furnitureCount: { type: Number, default: 0 },
    lightingCount: { type: Number, default: 0 },
    isCalibrated: { type: Boolean, default: false },
    canvasDimensions: {
      width: { type: Number, default: 1000 },
      height: { type: Number, default: 700 },
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
  },
});

// Update the updatedAt field on save
ProjectSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Prevent re-compilation in development
const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);

export default Project; 