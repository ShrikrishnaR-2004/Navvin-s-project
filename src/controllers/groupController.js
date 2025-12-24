import groupService from '../services/groupService.js';

/**
 * Group Controllers
 */

/**
 * @route   POST /api/groups
 * @desc    Create a new group
 * @access  Private
 */
export const createGroup = async (req, res, next) => {
  try {
    const { name, memberEmails } = req.body;
    const userId = req.user.userId;

    const group = await groupService.createGroup(userId, { name, memberEmails });

    res.status(201).json({
      success: true,
      data: group
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/groups
 * @desc    Get all groups for current user
 * @access  Private
 */
export const getUserGroups = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const groups = await groupService.getUserGroups(userId);

    res.json({
      success: true,
      count: groups.length,
      data: groups
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/groups/:id
 * @desc    Get group by ID
 * @access  Private
 */
export const getGroupById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const group = await groupService.getGroupById(id, userId);

    res.json({
      success: true,
      data: group
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/groups/:id/members
 * @desc    Add members to a group
 * @access  Private
 */
export const addMembers = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { emails } = req.body;
    const userId = req.user.userId;

    const group = await groupService.addMembers(id, userId, emails);

    res.json({
      success: true,
      data: group
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/groups/:id/members/:memberId
 * @desc    Remove a member from a group
 * @access  Private
 */
export const removeMember = async (req, res, next) => {
  try {
    const { id, memberId } = req.params;
    const userId = req.user.userId;

    const group = await groupService.removeMember(id, userId, memberId);

    res.json({
      success: true,
      data: group
    });
  } catch (error) {
    next(error);
  }
};
