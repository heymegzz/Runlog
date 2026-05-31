import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import WorkspaceMember from '../models/WorkspaceMember.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../services/auth.service.js';
import { success, error } from '../utils/apiResponse.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return error(res, 'VALIDATION_ERROR', 'Name, email, and password are required');
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return error(res, 'EMAIL_IN_USE', 'Email is already registered');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ name, email, passwordHash });
    await user.save();

    // Create a default workspace for the new user
    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
    const workspace = new Workspace({
      name: `${name}'s Workspace`,
      slug,
      owner: user._id,
    });
    await workspace.save();

    // Add user as owner of their workspace
    const member = new WorkspaceMember({
      workspace: workspace._id,
      user: user._id,
      role: 'owner',
    });
    await member.save();

    // Update user's active workspace
    user.activeWorkspace = workspace._id;
    
    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save();

    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      activeWorkspace: user.activeWorkspace,
    };

    return success(res, { user: userData, accessToken, refreshToken }, 201);
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return error(res, 'VALIDATION_ERROR', 'Email and password are required');
    }

    const user = await User.findOne({ email });
    if (!user) {
      return error(res, 'INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return error(res, 'INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      activeWorkspace: user.activeWorkspace,
    };

    return success(res, { user: userData, accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return error(res, 'NO_TOKEN', 'Refresh token is required', 401);
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      return error(res, 'INVALID_TOKEN', 'Invalid or expired refresh token', 401);
    }

    const user = await User.findById(decoded.userId);
    if (!user || user.refreshToken !== refreshToken) {
      return error(res, 'INVALID_TOKEN', 'Invalid refresh token', 401);
    }

    const newAccessToken = generateAccessToken(user._id);
    // Optionally rotate the refresh token as well, but for now just returning new access token
    
    return success(res, { accessToken: newAccessToken });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
    return success(res, { message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

export const me = async (req, res, next) => {
  try {
    // req.user is attached by authenticate middleware
    const userData = {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      activeWorkspace: req.user.activeWorkspace,
    };
    return success(res, userData);
  } catch (err) {
    next(err);
  }
};
