import logger from "../utils/logger.js";

export const validate = (schema) => (req, res, next) => {
  try {
    // BODY
    if (schema.body) {
      const result = schema.body.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          errors: result.error.issues.map(e => ({
            field: e.path.join("."),
            message: e.message
          }))
        });
      }

      req.body = result.data;
    }

    // PARAMS
    if (schema.params) {
      const result = schema.params.safeParse(req.params);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          errors: result.error.issues.map(e => ({
            field: e.path.join("."),
            message: e.message
          }))
        });
      }

      req.params = result.data;
    }

    // QUERY 
    if (schema.query) {
      const result = schema.query.safeParse(req.query);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          errors: result.error.issues.map(e => ({
            field: e.path.join("."),
            message: e.message
          }))
        });
      }
      Object.assign(req.query, result.data);
    }

    // USER
    if (schema.user) {
      const result = schema.user.safeParse(req.user);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          errors: result.error.issues.map(e => ({
            field: e.path.join("."),
            message: e.message
          }))
        });
      }

      req.user = result.data;
    }

    next();

  } catch (err) {
    logger.error(`[VALIDATION] Runtime failure | Action: Schemata check | Error: ${err.message}`);

    return res.status(500).json({
      success: false,
      message: "Internal validation error"
    });
  }
};
