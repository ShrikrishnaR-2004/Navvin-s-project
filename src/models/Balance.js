import mongoose from 'mongoose';

const balanceSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  debtorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  creditorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    default: 0
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound unique index for fast lookups and preventing duplicates
balanceSchema.index({ groupId: 1, debtorId: 1, creditorId: 1 }, { unique: true });

// Index for user balance queries
balanceSchema.index({ debtorId: 1 });
balanceSchema.index({ creditorId: 1 });

// Update timestamp on save
balanceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Balance = mongoose.model('Balance', balanceSchema);

export default Balance;
