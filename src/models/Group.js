import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true,
    minlength: [2, 'Group name must be at least 2 characters'],
    maxlength: [50, 'Group name cannot exceed 50 characters']
  },
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster member lookups
groupSchema.index({ members: 1 });
groupSchema.index({ creatorId: 1 });

// Method to check if user is a member
groupSchema.methods.isMember = function(userId) {
  return this.members.some(memberId => memberId.toString() === userId.toString());
};

// Method to get group with populated members
groupSchema.methods.toPopulatedJSON = async function() {
  await this.populate('members', 'name email');
  await this.populate('creatorId', 'name email');
  
  return {
    id: this._id,
    name: this.name,
    creator: this.creatorId,
    members: this.members,
    createdAt: this.createdAt
  };
};

const Group = mongoose.model('Group', groupSchema);

export default Group;
