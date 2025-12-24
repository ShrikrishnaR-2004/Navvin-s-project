import express from 'express';
import { body, param } from 'express-validator';
import {
  createGroup,
  getUserGroups,
  getGroupById,
  addMembers,
  removeMember
} from '../controllers/groupController.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   POST /api/groups
 * @desc    Create a new group
 * @access  Private
 */
router.post(
  '/',
  [
    body('name')
      .trim()
      .notEmpty().withMessage('Group name is required')
      .isLength({ min: 2, max: 50 }).withMessage('Group name must be between 2 and 50 characters'),
    body('memberEmails')
      .optional()
      .isArray().withMessage('Member emails must be an array')
      .custom((emails) => {
        if (emails && emails.length > 0) {
          const emailRegex = /^\S+@\S+\.\S+$/;
          return emails.every(email => emailRegex.test(email));
        }
        return true;
      }).withMessage('All member emails must be valid')
  ],
  validateRequest,
  createGroup
);

/**
 * @route   GET /api/groups
 * @desc    Get all groups for current user
 * @access  Private
 */
router.get('/', getUserGroups);

/**
 * @route   GET /api/groups/:id
 * @desc    Get group by ID
 * @access  Private
 */
router.get(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid group ID')
  ],
  validateRequest,
  getGroupById
);

/**
 * @route   POST /api/groups/:id/members
 * @desc    Add members to a group
 * @access  Private
 */
router.post(
  '/:id/members',
  [
    param('id').isMongoId().withMessage('Invalid group ID'),
    body('emails')
      .isArray({ min: 1 }).withMessage('At least one email is required')
      .custom((emails) => {
        const emailRegex = /^\S+@\S+\.\S+$/;
        return emails.every(email => emailRegex.test(email));
      }).withMessage('All emails must be valid')
  ],
  validateRequest,
  addMembers
);

/**
 * @route   DELETE /api/groups/:id/members/:memberId
 * @desc    Remove a member from a group
 * @access  Private
 */
router.delete(
  '/:id/members/:memberId',
  [
    param('id').isMongoId().withMessage('Invalid group ID'),
    param('memberId').isMongoId().withMessage('Invalid member ID')
  ],
  validateRequest,
  removeMember
);

export default router;
