import Expense from '../models/Expense.js';
import Group from '../models/Group.js';
import balanceService from './balanceService.js';
import { withTransaction } from '../utils/dbTransaction.js';

/**
 * Expense Service
 * Handles expense creation with atomic balance updates
 */
class ExpenseService {
  /**
   * Create an expense with atomic balance updates
   */
  async createExpense(userId, expenseData) {
    const { groupId, description, amount, splitType, splits } = expenseData;

    // Verify user is a member of the group
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

    // Calculate shares based on split type
    const calculatedSplits = this.calculateShares(amount, splitType, splits, group.members);

    // Validate splits
    this.validateSplits(amount, splitType, calculatedSplits);

    // Create expense and update balances in a transaction
    const result = await withTransaction(async (session) => {
      // Create expense
      const expense = await Expense.create([{
        groupId,
        description,
        amount,
        paidBy: userId,
        splitType,
        splits: calculatedSplits
      }], { session });

      // Update balances for each split
      await balanceService.updateBalancesForExpense(
        groupId,
        userId,
        calculatedSplits,
        session
      );

      return expense[0];
    });

    // Populate and return
    await result.populate('paidBy', 'name email');
    await result.populate('splits.userId', 'name email');

    return result;
  }

  /**
   * Calculate shares based on split type
   */
  calculateShares(totalAmount, splitType, splits, groupMembers) {
    if (splitType === 'EQUAL') {
      // If no splits provided, split equally among all members
      const members = splits && splits.length > 0 
        ? splits.map(s => s.userId) 
        : groupMembers;
      
      const shareAmount = totalAmount / members.length;
      
      return members.map(userId => ({
        userId,
        amount: shareAmount
      }));
    }

    if (splitType === 'EXACT') {
      // Use provided amounts
      return splits.map(split => ({
        userId: split.userId,
        amount: split.amount
      }));
    }

    if (splitType === 'PERCENTAGE') {
      // Calculate amounts from percentages
      return splits.map(split => ({
        userId: split.userId,
        amount: (totalAmount * split.percentage) / 100,
        percentage: split.percentage
      }));
    }

    throw new Error('Invalid split type');
  }

  /**
   * Validate splits
   */
  validateSplits(totalAmount, splitType, splits) {
    if (!splits || splits.length === 0) {
      throw new Error('At least one split is required');
    }

    if (splitType === 'EXACT') {
      const splitSum = splits.reduce((sum, split) => sum + split.amount, 0);
      if (Math.abs(splitSum - totalAmount) > 0.01) {
        const error = new Error('Split amounts must sum to total amount');
        error.statusCode = 400;
        throw error;
      }
    }

    if (splitType === 'PERCENTAGE') {
      const percentageSum = splits.reduce((sum, split) => sum + (split.percentage || 0), 0);
      if (Math.abs(percentageSum - 100) > 0.01) {
        const error = new Error('Split percentages must sum to 100');
        error.statusCode = 400;
        throw error;
      }
    }

    // Ensure all amounts are positive
    const hasNegative = splits.some(split => split.amount < 0);
    if (hasNegative) {
      const error = new Error('Split amounts must be positive');
      error.statusCode = 400;
      throw error;
    }
  }

  /**
   * Get expenses for a group with pagination
   */
  async getGroupExpenses(userId, groupId, page = 1, limit = 20) {
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

    const skip = (page - 1) * limit;

    const [expenses, total] = await Promise.all([
      Expense.find({ groupId })
        .populate('paidBy', 'name email')
        .populate('splits.userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Expense.countDocuments({ groupId })
    ]);

    return {
      expenses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
}

export default new ExpenseService();
