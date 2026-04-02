const roleMiddleware = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ message: 'Access denied: No role defined' });
        }
        
        const lowerAllowed = allowedRoles.map(r => r.toLowerCase());
        if (!lowerAllowed.includes(req.user.role.toLowerCase())) {
            return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
        }
        next();
    };
};

module.exports = roleMiddleware;
