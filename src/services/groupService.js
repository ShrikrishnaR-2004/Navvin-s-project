import Group from '../models/Group.js';
import User from '../models/User.js';

/**
 * Group Service
 * Handles group CRUD operations and member management
 */
class GroupService {
  /**
   * Create a new group
   */
  async createGroup(userId, groupData) {
    const { name, memberEmails = [] } = groupData;

    // Find members by email
    const memberUsers = await User.find({ 
      email: { $in: memberEmails } 
    });

    // Create members array with creator and found users
    const memberIds = [userId, ...memberUsers.map(u => u._id)];
    
    // Remove duplicates
    const uniqueMemberIds = [...new Set(memberIds.map(id => id.toString()))];

    const group = await Group.create({
      name,
      creatorId: userId,
      members: uniqueMemberIds
    });

    return await group.toPopulatedJSON();
  }

  /**
   * Get all groups for a user
   */
  async getUserGroups(userId) {
    const groups = await Group.find({
      members: userId
    })
    .populate('creatorId', 'name email')
    .populate('members', 'name email')
    .sort({ createdAt: -1 });

    return groups;
  }

  /**
   * Get group by ID with membership validation
   */
  async getGroupById(groupId, userId) {
    const group = await Group.findById(groupId)
      .populate('creatorId', 'name email')
      .populate('members', 'name email');

    if (!group) {
      const error = new Error('Group not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if user is a member
    if (!group.isMember(userId)) {
      const error = new Error('You are not a member of this group');
      error.statusCode = 403;
      throw error;
    }

    return group;
  }

  /**
   * Add members to a group
   */
  async addMembers(groupId, userId, memberEmails) {
    const group = await Group.findById(groupId);

    if (!group) {
      const error = new Error('Group not found');
      error.statusCode = 404;
      throw error;
    }

    // Only creator can add members
    if (group.creatorId.toString() !== userId.toString()) {
      const error = new Error('Only group creator can add members');
      error.statusCode = 403;
      throw error;
    }

    // Find users by email
    const newMembers = await User.find({
      email: { $in: memberEmails }
    });

    if (newMembers.length === 0) {
      const error = new Error('No valid users found with provided emails');
      error.statusCode = 400;
      throw error;
    }

    // Add new members (avoid duplicates)
    const newMemberIds = newMembers.map(u => u._id.toString());
    const existingMemberIds = group.members.map(id => id.toString());
    
    const membersToAdd = newMemberIds.filter(id => !existingMemberIds.includes(id));

    if (membersToAdd.length === 0) {
      const error = new Error('All users are already members');
      error.statusCode = 400;
      throw error;
    }

    group.members.push(...membersToAdd);
    await group.save();

    return await group.toPopulatedJSON();
  }

  /**
   * Remove a member from a group
   */
  async removeMember(groupId, userId, memberIdToRemove) {
    const group = await Group.findById(groupId);

    if (!group) {
      const error = new Error('Group not found');
      error.statusCode = 404;
      throw error;
    }

    // Only creator can remove members
    if (group.creatorId.toString() !== userId.toString()) {
      const error = new Error('Only group creator can remove members');
      error.statusCode = 403;
      throw error;
    }

    // Cannot remove creator
    if (memberIdToRemove === group.creatorId.toString()) {
      const error = new Error('Cannot remove group creator');
      error.statusCode = 400;
      throw error;
    }

    // Remove member
    group.members = group.members.filter(
      id => id.toString() !== memberIdToRemove
    );

    await group.save();

    return await group.toPopulatedJSON();
  }
}

export default new GroupService();
