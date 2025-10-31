import bcrypt from 'bcryptjs';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'fallback_secret_peligroso';

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (
  password: string,
  hash: string,
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateJwt = (
  userId: string,
  email: string,
  expiresIn: string = '1d',
): string => {
  const payload = { id: userId, email };
  const options: SignOptions = { expiresIn: expiresIn as SignOptions['expiresIn'] };

  return jwt.sign(payload, JWT_SECRET, options);
};
