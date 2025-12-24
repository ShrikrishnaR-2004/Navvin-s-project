import Balance from '../models/Balance.js';
import Group from '../models/Group.js';
import mongoose from 'mongoose';

/**
 * Balance Service
 * Handles atomic balance updates and settlement
 */
class BalanceService {
  /**
   * Update balances for an expense (within a transaction)
   * This is the core innovation - atomic balance updates
   */
  async updateBalancesForExpense(groupId, paidBy, splits, session) {
    const updatePromises = [];

    for (const split of splits) {
      const { userId, amount } = split;

      // Skip if user paid for themselves
      if (userId.toString() === paidBy.toString()) {
        continue;
      }

      // Update balance: userId owes paidBy
      updatePromises.push(
        Balance.findOneAndUpdate(
          {
            groupId,
            debtorId: userId,
            creditorId: paidBy
          },
          {
            $inc: { amount },
            $set: { updatedAt: new Date() }
          },
          {
            upsert: true,
            new: true,
            session
          }
        )
      );

      // Update reverse balance: paidBy is owed by userId
      updatePromises.push(
        Balance.findOneAndUpdate(
          {
            groupId,
            debtorId: paidBy,
            creditorId: userId
          },
          {
            $inc: { amount: -amount },
            $set: { updatedAt: new Date() }
          },
          {
            upsert: true,
            new: true,
            session
          }
        )
      );
    }

    await Promise.all(updatePromises);
  }

  /**
   * Get simplified balance view for a group
   * Returns "you owe" and "owes you" lists
   */
  async getGroupBalances(userId, groupId) {
    // Verify user is a member
    const group = await Group.findById(groupId);
    if (!group) {
      const error = new Error('Group not found');
      error.statusCode = 404;
      throw error;
    }

    if (!group.isMember(userId)) {
      const error = new Error('You are not a member of this group');
      error.statusCode = 403;
      throw error;
    }

    // Get all balances involving this user
    const balances = await Balance.find({
      groupId,
      $or: [
        { debtorId: userId },
        { creditorId: userId }
      ],
      amount: { $ne: 0 }
    })
    .populate('debtorId', 'name email')
    .populate('creditorId', 'name email');

    // Separate into "you owe" and "owes you"
    const youOwe = [];
    const owesYou = [];

    for (const balance of balances) {
      if (balance.debtorId._id.toString() === userId.toString() && balance.amount > 0) {
        youOwe.push({
          user: balance.creditorId,
          amount: balance.amount
        });
      } else if (balance.creditorId._id.toString() === userId.toString() && balance.amount < 0) {
        owesYou.push({
          user: balance.debtorId,
          amount: Math.abs(balance.amount)
        });
      }
    }

    return {
      youOwe,
      owesYou,
      totalYouOwe: youOwe.reduce((sum, b) => sum + b.amount, 0),
      totalOwesYou: owesYou.reduce((sum, b) => sum + b.amount, 0)
    };
  }

  /**
   * Get user's overall balance across all groups
   */
  async getUserOverallBalances(userId) {
    // Get all groups user is a member of
    const groups = await Group.find({ members: userId });
    const groupIds = groups.map(g => g._id);

    // Get all balances
    const balances = await Balance.find({
      groupId: { $in: groupIds },
      $or: [
        { debtorId: userId },
        { creditorId: userId }
      ],
      amount: { $ne: 0 }
    })
    .populate('groupId', 'name')
    .populate('debtorId', 'name email')
    .populate('creditorId', 'name email');

    // Group by group
    const balancesByGroup = {};

    for (const balance of balances) {
      const groupId = balance.groupId._id.toString();
      
      if (!balancesByGroup[groupId]) {
        balancesByGroup[groupId] = {
          group: balance.groupId,
          youOwe: [],
          owesYou: []
        };
      }

      if (balance.debtorId._id.toString() === userId.toString() && balance.amount > 0) {
        balancesByGroup[groupId].youOwe.push({
          user: balance.creditorId,
          amount: balance.amount
        });
      } else if (balance.creditorId._id.toString() === userId.toString() && balance.amount < 0) {
        balancesByGroup[groupId].owesYou.push({
          user: balance.debtorId,
          amount: Math.abs(balance.amount)
        });
      }
    }

    return Object.values(balancesByGroup);
  }

  /**
   * Settle debt between two users
   */
  async settleDebt(userId, groupId, creditorId, amount) {
    // Verify group membership
    const group = await Group.findById(groupId);
    if (!group) {
      const error = new Error('Group not found');
      error.statusCode = 404;
      throw error;
    }

    if (!group.isMember(userId) || !group.isMember(creditorId)) {
      const error = new Error('Both users must be members of the group');
      error.statusCode = 403;
      throw error;
    }

    // Update balances atomically
    await Balance.findOneAndUpdate(
      {
        groupId,
        debtorId: userId,
        creditorId
      },
      {
        $inc: { amount: -amount },
        $set: { updatedAt: new Date() }
      },
      { upsert: true }
    );

    await Balance.findOneAndUpdate(
      {
        groupId,
        debtorId: creditorId,
        creditorId: userId
      },
      {
        $inc: { amount },
        $set: { updatedAt: new Date() }
      },
      { upsert: true }
    );

    return {
      message: 'Debt settled successfully',
      amount,
      from: userId,
      to: creditorId
    };
  }
}

export default new BalanceService();
