import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
    index: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  splitType: {
    type: String,
    enum: ['EQUAL', 'EXACT', 'PERCENTAGE'],
    required: true
  },
  splits: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      min: 0
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
expenseSchema.index({ groupId: 1, createdAt: -1 });

// Validation: Ensure splits match split type
expenseSchema.pre('save', function(next) {
  if (this.splitType === 'EXACT') {
    // Verify all splits have amount
    const hasAllAmounts = this.splits.every(split => split.amount != null);
    if (!hasAllAmounts) {
      return next(new Error('All splits must have amount for EXACT split type'));
    }
    
    // Verify amounts sum to total
    const splitSum = this.splits.reduce((sum, split) => sum + split.amount, 0);
    if (Math.abs(splitSum - this.amount) > 0.01) {
      return next(new Error('Split amounts must sum to total amount'));
    }
  }
  
  if (this.splitType === 'PERCENTAGE') {
    // Verify all splits have percentage
    const hasAllPercentages = this.splits.every(split => split.percentage != null);
    if (!hasAllPercentages) {
      return next(new Error('All splits must have percentage for PERCENTAGE split type'));
    }
    
    // Verify percentages sum to 100
    const percentageSum = this.splits.reduce((sum, split) => sum + split.percentage, 0);
    if (Math.abs(percentageSum - 100) > 0.01) {
      return next(new Error('Split percentages must sum to 100'));
    }
  }
  
  next();
});

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;
