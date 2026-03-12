const mongoose = require('mongoose');

const PROFESSION_OPTIONS = [
  'Investor',
  'Business Owner',
  'Supply Chain Manager',
  'Policy Analyst',
  'Student',
  'Journalist',
  'Citizen',
  'Other',
];

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    phone: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    profession: { type: String, required: true, enum: PROFESSION_OPTIONS },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

module.exports = mongoose.model('User', UserSchema);
module.exports.PROFESSION_OPTIONS = PROFESSION_OPTIONS;

