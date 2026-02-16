const ApiError = require('../utils/ApiError');

const validate = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error.constructor.name === 'ZodError' || error.issues) {
        const errors = (error.errors || error.issues || []).map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        const firstError = errors[0];
        const message = firstError
          ? `${firstError.field || 'field'}: ${firstError.message}`
          : 'Invalid data';
        return next(new ApiError(400, message, errors));
      }
      next(error);
    }
  };
};

module.exports = validate;
