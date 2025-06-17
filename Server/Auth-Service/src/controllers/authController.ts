import { RequestHandler ,Request, Response, NextFunction } from 'express';
import db from '../../models'; 
import { signToken } from '../utils/jwtUtils'; 
import bcrypt from 'bcryptjs'; 

const User = (db as any).User;

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<any>;
// Utility function to send token response (ensure JWT_SECRET is in your .env)
const createSendToken = (user: any, statusCode: number, res: Response) => {
  // Ensure user.id exists and is a number before signing
  if (typeof user.id !== 'number') {
      console.error('User ID is missing or not a number for token signing:', user);
      return res.status(500).json({ status: 'error', message: 'Internal server error: Cannot sign token.' });
  }
  const token = signToken(user.id);

  // Basic cookie options (consider making more secure for production)
  const cookieOptions = {
    expires: new Date(
      Date.now() + (parseInt(process.env.JWT_COOKIE_EXPIRES_IN || '90', 10) * 24 * 60 * 60 * 1000) // Default 90 days
    ),
    httpOnly: true, // Prevent XSS attacks
    sameSite: 'lax' as const, // <-- Add this for cross-origin cookie support
    secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
    path: '/', // Ensure cookie is valid for all routes
  };

  // Remove password from output
  const userOutput = { ...user.toJSON() }; // Clone user data
  delete userOutput.password;

  return res.cookie('jwt', token, cookieOptions).status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: userOutput,
    },
  });
};

// Register User Controller
export const register:AsyncHandler = async (req,res,next)  => {
  try {
    const { name, email, password } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ status: 'fail', message: 'Please provide name, email, and password' });
    }
    if (password.length < 8) {
      return res.status(400).json({ status: 'fail', message: 'Password must be at least 8 characters long' });
    }

    // Create new user (password hashing is handled by the model hook)
    const newUser = await User.create({
      name,
      email,
      password, // Pass the plain password, the hook will hash it
    });

    // Send JWT token
    createSendToken(newUser, 201, res);

  } catch (error: any) {
    // Handle potential errors (like duplicate email)
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ status: 'fail', message: 'Email address already in use.' });
    }
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map((err: any) => err.message);
      return res.status(400).json({ status: 'fail', message: messages.join(', ') });
    }
    console.error("Registration Error:", error);
    return res.status(500).json({ status: 'error', message: 'An error occurred during registration.' });
  }
};

// Login User Controller
export const login:AsyncHandler = async (req,res,next) => {
  try {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({ status: 'fail', message: 'Please provide email and password' });
    }

    // 2) Check if user exists
    // Use the 'withPassword' scope to include the password field for comparison
    const user = await User.scope('withPassword').findOne({ where: { email } });

    // 3) Check user existence and password validity using bcrypt.compare
    if (!user || !(await bcrypt.compare(password, user.password))) { // Compare plain text password with hash
      return res.status(401).json({ status: 'fail', message: 'Incorrect email or password' });
    }

    // 4) If everything ok, send token to client
    createSendToken(user, 200, res);

  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ status: 'error', message: 'An error occurred during login.' });
  }
};

// ... existing code ...

// Get current user profile
export const getMe: AsyncHandler = async (req, res, next) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(404).json({ status: 'fail', message: 'User not found' });
    }
    const userOutput = { ...user.toJSON() };
    delete userOutput.password;
    res.status(200).json({
      status: 'success',
      data: { user: userOutput },
    });
  };
  
  // Update current user profile (except password)
  // ... existing code ...

export const updateMe: AsyncHandler = async (req, res, next) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(404).json({ status: 'fail', message: 'User not found' });
      }
  
      // List of fields that can be updated
      const updatableFields = [
        'name',
        'email',
        'storeName',
        'businessType',
        'gstNumber',
        'address',
        'description',
        'phoneNumber',
        'establishedYear',
        'avgMonthlyRevenue'
      ];
  
      let updated = false;
      updatableFields.forEach(field => {
        if (req.body[field] !== undefined) {
          user[field] = req.body[field];
          updated = true;
        }
      });
  
      if (!updated) {
        return res.status(400).json({ status: 'fail', message: 'No valid fields provided for update.' });
      }
  
      await user.save();
  
      const userOutput = { ...user.toJSON() };
      delete userOutput.password;
  
      res.status(200).json({
        status: 'success',
        data: { user: userOutput },
      });
    } catch (error) {
      console.error("Update Profile Error:", error);
      res.status(500).json({ status: 'error', message: 'An error occurred while updating profile.' });
    }
  };
  // ... existing code ...
  
  // Logout user (clear cookie)
  export const logout: AsyncHandler = async (req, res, next) => {
    res.clearCookie('jwt', { path: '/' }); // Ensure path matches cookie set
    res.status(200).json({ status: 'success', message: 'Logged out successfully' });
  };
  
