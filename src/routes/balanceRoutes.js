import express from 'express';
import { body, param } from 'express-validator';
import { getGroupBalances, getUserBalances, settleDebt } from '../controllers/balanceController.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/groups/:groupId/balances
 * @desc    Get balance summary for a group
 * @access  Private
 */
router.get(
  '/:groupId/balances',
  [
    param('groupId').isMongoId().withMessage('Invalid group ID')
  ],
  validateRequest,
  getGroupBalances
);

/**
 * @route   POST /api/groups/:groupId/settle
 * @desc    Settle debt with another user
 * @access  Private
 */
router.post(
  '/:groupId/settle',
  [
    param('groupId').isMongoId().withMessage('Invalid group ID'),
    body('creditorId')
      .notEmpty().withMessage('Creditor ID is required')
      .isMongoId().withMessage('Invalid creditor ID'),
    body('amount')
      .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0')
  ],
  validateRequest,
  settleDebt
);

/**
 * @route   GET /api/users/me/balances
 * @desc    Get user's overall balance across all groups
 * @access  Private
 */
router.get('/users/me/balances', getUserBalances);

export default router;
