"use server";

import User from "@/modals/user.modal";
import { connect } from "@/db";
import { revalidatePath } from "next/cache";
import { IUser, UserUpdateData } from "@/types/user";
import { Types } from "mongoose";
import { cache } from 'react'

// Error types for better error handling
class UserActionError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'UserActionError';
  }
}

// Cache the database connection
const connectDB = cache(async () => {
  try {
    await connect();
  } catch (error) {
    throw new UserActionError('Failed to connect to database', 'DB_CONNECTION_ERROR');
  }
});

// Validate MongoDB ObjectId
function isValidObjectId(id: string): boolean {
  return Types.ObjectId.isValid(id);
}

// Helper function to serialize user data
function serializeUser(user: any): IUser | null {
  return user ? JSON.parse(JSON.stringify(user)) : null;
}

// Create a new user
export async function createUser(userData: Partial<IUser>) {
  try {
    await connectDB();

    // Validate required fields
    if (!userData.clerkId || !userData.username) {
      throw new UserActionError('Missing required fields', 'VALIDATION_ERROR');
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { clerkId: userData.clerkId },
        { username: userData.username }
      ]
    });

    if (existingUser) {
      throw new UserActionError(
        'User with this clerk ID or username already exists',
        'DUPLICATE_USER'
      );
    }

    const newUser = await User.create(userData);
    return serializeUser(newUser);
  } catch (error) {
    console.error("Error creating user:", error);
    if (error instanceof UserActionError) throw error;
    throw new UserActionError('Failed to create user', 'CREATE_USER_ERROR');
  }
}

// Get user by ID with optional population
export async function getUserById(
  userId: string,
  options: {
    populateFollowers?: boolean;
    populateFollowing?: boolean;
  } = {}
): Promise<IUser | null> {
  try {
    await connectDB();

    if (!isValidObjectId(userId)) {
      throw new UserActionError('Invalid user ID', 'INVALID_ID');
    }

    let query = User.findById(new Types.ObjectId(userId));

    if (options.populateFollowers) {
      query = query.populate('followers');
    }
    if (options.populateFollowing) {
      query = query.populate('following');
    }

    const user = await query.exec();
    return serializeUser(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    if (error instanceof UserActionError) throw error;
    throw new UserActionError('Failed to fetch user', 'FETCH_USER_ERROR');
  }
}

// Get user by Clerk ID with optional population
export async function getUserByClerkId(
  clerkId: string,
  options: {
    populateFollowers?: boolean;
    populateFollowing?: boolean;
  } = {}
): Promise<IUser | null> {
  try {
    await connectDB();

    if (!clerkId) {
      throw new UserActionError('Clerk ID is required', 'INVALID_CLERK_ID');
    }

    let query = User.findOne({ clerkId });

    if (options.populateFollowers) {
      query = query.populate('followers');
    }
    if (options.populateFollowing) {
      query = query.populate('following');
    }

    const user = await query.exec();
    return serializeUser(user);
  } catch (error) {
    console.error("Error fetching user by Clerk ID:", error);
    if (error instanceof UserActionError) throw error;
    throw new UserActionError('Failed to fetch user', 'FETCH_USER_ERROR');
  }
}

// Update user with validation
export async function updateUser(
  clerkId: string,
  updateData: UserUpdateData
): Promise<IUser | null> {
  try {
    await connectDB();

    if (!clerkId) {
      throw new UserActionError('Clerk ID is required', 'INVALID_CLERK_ID');
    }

    // Validate username length if provided
    if (updateData.username && (updateData.username.length < 3 || updateData.username.length > 30)) {
      throw new UserActionError(
        'Username must be between 3 and 30 characters',
        'INVALID_USERNAME'
      );
    }

    // Validate bio length if provided
    if (updateData.bio && updateData.bio.length > 160) {
      throw new UserActionError(
        'Bio must not exceed 160 characters',
        'INVALID_BIO'
      );
    }

    const updatedUser = await User.findOneAndUpdate(
      { clerkId },
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).populate('followers').populate('following');

    revalidatePath('/profile');
    revalidatePath(`/profile/${updatedUser?._id}`);

    return serializeUser(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    if (error instanceof UserActionError) throw error;
    throw new UserActionError('Failed to update user', 'UPDATE_USER_ERROR');
  }
}

// ... (previous imports and setup)

export async function followUser(currentUserId: string, userToFollowId: string) {
  try {
    await connectDB();

    if (!isValidObjectId(currentUserId) || !isValidObjectId(userToFollowId)) {
      throw new UserActionError('Invalid user ID', 'INVALID_ID');
    }

    const currentUserObjectId = new Types.ObjectId(currentUserId);
    const userToFollowObjectId = new Types.ObjectId(userToFollowId);

    const [currentUser, userToFollow] = await Promise.all([
      User.findById(currentUserObjectId),
      User.findById(userToFollowObjectId)
    ]);

    if (!currentUser || !userToFollow) {
      throw new UserActionError('User not found', 'USER_NOT_FOUND');
    }

    if (currentUser.following.includes(userToFollowObjectId)) {
      throw new UserActionError('Already following this user', 'ALREADY_FOLLOWING');
    }

    await Promise.all([
      User.findByIdAndUpdate(currentUserObjectId,
        { $addToSet: { following: userToFollowObjectId } }
      ),
      User.findByIdAndUpdate(userToFollowObjectId,
        { $addToSet: { followers: currentUserObjectId } }
      )
    ]);

    revalidatePath('/');
    revalidatePath('/profile');
    revalidatePath(`/profile/${currentUserId}`);
    revalidatePath(`/profile/${userToFollowId}`);

  } catch (error) {
    console.error("Error following user:", error);
    if (error instanceof UserActionError) throw error;
    throw new UserActionError('Failed to follow user', 'FOLLOW_USER_ERROR');
  }
}

export async function unfollowUser(currentUserId: string, userToUnfollowId: string) {
  try {
    await connectDB();

    if (!isValidObjectId(currentUserId) || !isValidObjectId(userToUnfollowId)) {
      throw new UserActionError('Invalid user ID', 'INVALID_ID');
    }

    const currentUserObjectId = new Types.ObjectId(currentUserId);
    const userToUnfollowObjectId = new Types.ObjectId(userToUnfollowId);

    const [currentUser, userToUnfollow] = await Promise.all([
      User.findById(currentUserObjectId),
      User.findById(userToUnfollowObjectId)
    ]);

    if (!currentUser || !userToUnfollow) {
      throw new UserActionError('User not found', 'USER_NOT_FOUND');
    }

    if (!currentUser.following.includes(userToUnfollowObjectId)) {
      throw new UserActionError('Not following this user', 'NOT_FOLLOWING');
    }

    await Promise.all([
      User.findByIdAndUpdate(currentUserObjectId,
        { $pull: { following: userToUnfollowObjectId } }
      ),
      User.findByIdAndUpdate(userToUnfollowObjectId,
        { $pull: { followers: currentUserObjectId } }
      )
    ]);

    revalidatePath('/');
    revalidatePath('/profile');
    revalidatePath(`/profile/${currentUserId}`);
    revalidatePath(`/profile/${userToUnfollowId}`);

  } catch (error) {
    console.error("Error unfollowing user:", error);
    if (error instanceof UserActionError) throw error;
    throw new UserActionError('Failed to unfollow user', 'UNFOLLOW_USER_ERROR');
  }
}

// ... (rest of the file remains unchanged)



// Get all users with pagination and search
export async function getAllUsers(options: {
  page?: number;
  limit?: number;
  search?: string;
  excludeUserId?: string;
} = {}) {
  try {
    await connectDB();

    const {
      page = 1,
      limit = 10,
      search = '',
      excludeUserId
    } = options;

    let query: any = {};

    // Add search condition if search string is provided
    if (search) {
      query = {
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { bio: { $regex: search, $options: 'i' } }
        ]
      };
    }

    // Exclude specific user if provided
    if (excludeUserId && isValidObjectId(excludeUserId)) {
      query._id = { $ne: new Types.ObjectId(excludeUserId) };
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('followers')
        .populate('following'),
      User.countDocuments(query)
    ]);

    return {
      users: users.map(user => serializeUser(user)),
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    throw new UserActionError('Failed to fetch users', 'FETCH_USERS_ERROR');
  }
}

