import ApiKey from '../models/ApiKey.js';
import { generateApiKey } from '../utils/hashApiKey.js';
import { success, error } from '../utils/apiResponse.js';

export const listApiKeys = async (req, res, next) => {
  try {
    const keys = await ApiKey.find({ workspace: req.workspace._id })
      .select('-keyHash')
      .sort({ createdAt: -1 });
    return success(res, keys);
  } catch (err) {
    next(err);
  }
};

export const createApiKey = async (req, res, next) => {
  try {
    const { name, expiresAt } = req.body;
    if (!name) return error(res, 'VALIDATION_ERROR', 'API key name is required');

    const { rawKey, keyHash, keyPrefix } = await generateApiKey();

    const apiKey = new ApiKey({
      workspace: req.workspace._id,
      createdBy: req.user._id,
      name,
      keyHash,
      keyPrefix,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });

    await apiKey.save();

    // Return the raw key ONCE — it will never be retrievable again
    return success(
      res,
      {
        _id: apiKey._id,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt,
        rawKey, // shown only on creation
      },
      201
    );
  } catch (err) {
    next(err);
  }
};

export const revokeApiKey = async (req, res, next) => {
  try {
    const key = await ApiKey.findOneAndDelete({
      _id: req.params.id,
      workspace: req.workspace._id,
    });

    if (!key) return error(res, 'NOT_FOUND', 'API key not found', 404);

    return success(res, { message: 'API key revoked successfully' });
  } catch (err) {
    next(err);
  }
};
