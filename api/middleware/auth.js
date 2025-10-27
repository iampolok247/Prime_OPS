import jwt from 'jsonwebtoken';

export const requireAuth = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Login required' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, email, name }
    return next();
  } catch (e) {
    return res.status(401).json({ code: 'INVALID_TOKEN', message: 'Invalid session' });
  }
};
