import balanceService from '../services/balanceService.js';

/**
 * Balance Controllers
 */

/**
 * @route   GET /api/groups/:groupId/balances
 * @desc    Get balance summary for a group
 * @access  Private
 */
export const getGroupBalances = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.userId;

    const balances = await balanceService.getGroupBalances(userId, groupId);

    res.json({
      success: true,
      data: balances
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/users/me/balances
 * @desc    Get user's overall balance across all groups
 * @access  Private
 */
export const getUserBalances = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const balances = await balanceService.getUserOverallBalances(userId);

    res.json({
      success: true,
      count: balances.length,
      data: balances
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/groups/:groupId/settle
 * @desc    Settle debt with another user
 * @access  Private
 */
export const settleDebt = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { creditorId, amount } = req.body;
    const userId = req.user.userId;

    const result = await balanceService.settleDebt(userId, groupId, creditorId, amount);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};
