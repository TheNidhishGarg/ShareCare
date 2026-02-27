function validate(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                data: null,
                error: 'Validation failed',
                meta: {
                    errors: result.error.issues.map((i) => ({
                        field: i.path.join('.'),
                        message: i.message,
                    })),
                },
            });
        }
        req.validatedBody = result.data;
        next();
    };
}

function validateQuery(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.query);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                data: null,
                error: 'Invalid query parameters',
                meta: {
                    errors: result.error.issues.map((i) => ({
                        field: i.path.join('.'),
                        message: i.message,
                    })),
                },
            });
        }
        req.validatedQuery = result.data;
        next();
    };
}

module.exports = { validate, validateQuery };
