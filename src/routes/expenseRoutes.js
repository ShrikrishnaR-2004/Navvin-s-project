import express from 'express';
import { body, param, query } from 'express-validator';
import { createExpense, getGroupExpenses } from '../controllers/expenseController.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   POST /api/groups/:groupId/expenses
 * @desc    Create a new expense
 * @access  Private
 */
router.post(
  '/:groupId/expenses',
  [
    param('groupId').isMongoId().withMessage('Invalid group ID'),
    body('description')
      .trim()
      .notEmpty().withMessage('Description is required')
      .isLength({ max: 200 }).withMessage('Description cannot exceed 200 characters'),
    body('amount')
      .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('splitType')
      .isIn(['EQUAL', 'EXACT', 'PERCENTAGE']).withMessage('Split type must be EQUAL, EXACT, or PERCENTAGE'),
    body('splits')
      .optional()
      .isArray().withMessage('Splits must be an array'),
    body('splits.*.userId')
      .optional()
      .isMongoId().withMessage('Invalid user ID in splits'),
    body('splits.*.amount')
      .optional()
      .isFloat({ min: 0 }).withMessage('Split amount must be positive'),
    body('splits.*.percentage')
      .optional()
      .isFloat({ min: 0, max: 100 }).withMessage('Split percentage must be between 0 and 100')
  ],
  validateRequest,
  createExpense
);

/**
 * @route   GET /api/groups/:groupId/expenses
 * @desc    Get expenses for a group
 * @access  Private
 */
router.get(
  '/:groupId/expenses',
  [
    param('groupId').isMongoId().withMessage('Invalid group ID'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  validateRequest,
  getGroupExpenses
);

export default router;
