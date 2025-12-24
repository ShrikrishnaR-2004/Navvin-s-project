import expenseService from '../services/expenseService.js';

/**
 * Expense Controllers
 */

/**
 * @route   POST /api/groups/:groupId/expenses
 * @desc    Create a new expense
 * @access  Private
 */
export const createExpense = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { description, amount, splitType, splits } = req.body;
    const userId = req.user.userId;

    const expense = await expenseService.createExpense(userId, {
      groupId,
      description,
      amount,
      splitType,
      splits
    });

    res.status(201).json({
      success: true,
      data: expense
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/groups/:groupId/expenses
 * @desc    Get expenses for a group
 * @access  Private
 */
export const getGroupExpenses = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await expenseService.getGroupExpenses(userId, groupId, page, limit);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};
