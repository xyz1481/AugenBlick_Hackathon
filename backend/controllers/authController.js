const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { PROFESSION_OPTIONS } = require('../models/User');

const SALT_ROUNDS = 10;

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.warn('[Auth] ⚠️  JWT_SECRET is missing in .env. Using insecure fallback for dev only.');
  }
  return secret || 'dev_insecure_jwt_secret_change_me';
}

function sanitizeUser(user) {
  return {
    id: user._id,
    email: user.email,
    phone: user.phone,
    country: user.country,
    profession: user.profession,
    createdAt: user.createdAt,
  };
}

exports.signup = async (req, res) => {
  try {
    const { email, password, phone, country, profession } = req.body || {};

    if (!email || !password || !phone || !country || !profession) {
      return res.status(400).json({ error: 'email, password, phone, country, profession are required' });
    }

    if (!PROFESSION_OPTIONS.includes(profession)) {
      return res.status(400).json({ error: 'Invalid profession option' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail }).lean();
    if (existing) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(String(password), SALT_ROUNDS);

    await User.create({
      email: normalizedEmail,
      password: hashedPassword,
      phone: String(phone).trim(),
      country: String(country).trim(),
      profession,
    });

    return res.json({ message: 'Signup successful' });
  } catch (err) {
    console.error('[Auth][signup] Error:', err);
    // Mongo duplicate key safety net
    if (err && err.code === 11000) return res.status(409).json({ error: 'Email already exists' });
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, phone, identifier, password } = req.body || {};

    const loginId = identifier || email || phone;
    if (!loginId || !password) {
      return res.status(400).json({ error: 'email or phone (or identifier) and password are required' });
    }

    const query =
      String(loginId).includes('@')
        ? { email: String(loginId).trim().toLowerCase() }
        : { phone: String(loginId).trim() };

    const user = await User.findOne(query);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(String(password), user.password);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { sub: String(user._id), email: user.email },
      getJwtSecret(),
      { expiresIn: '7d' },
    );

    return res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error('[Auth][login] Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

