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
  if (!user) return null;

  const serialized = {
    _id: user._id.toString(),
    clerkId: user.clerkId,
    email: user.email,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    photo: user.photo,
    bio: user.bio,
    about: user.about,
    followers: user.followers?.map((id: any) => id.toString()) || [],
    following: user.following?.map((id: any) => id.toString()) || [],
    savedPosts: user.savedPosts?.map((id: any) => id.toString()) || [],
    createdAt: user.createdAt?.toISOString(),
    updatedAt: user.updatedAt?.toISOString()
  };

  return serialized;
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

    // If it's a Clerk ID, use getUserByClerkId instead
    if (userId.startsWith('user_')) {
      return getUserByClerkId(userId, options);
    }

    if (!isValidObjectId(userId)) {
      throw new UserActionError('Invalid user ID', 'INVALID_ID');
    }

    let query = User.findById(userId);

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

    // Validate about length if provided
    if (updateData.about && updateData.about.length > 500) {
      throw new UserActionError(
        'About must not exceed 500 characters',
        'INVALID_ABOUT'
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

    if (!updatedUser) {
      throw new UserActionError('User not found', 'USER_NOT_FOUND');
    }

    // Check if the about field was actually updated in the database
    if (updateData.about && updatedUser.about !== updateData.about) {
      throw new UserActionError('Failed to update about section', 'UPDATE_ABOUT_ERROR');
    }

    revalidatePath('/profile');
    revalidatePath(`/profile/${updatedUser._id}`);

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

    // Find users by clerkId
    const [currentUser, userToFollow] = await Promise.all([
      User.findOne({ clerkId: currentUserId }),
      User.findOne({ clerkId: userToFollowId })
    ]);

    if (!currentUser || !userToFollow) {
      throw new UserActionError('User not found', 'USER_NOT_FOUND');
    }

    // Check if already following
    if (currentUser.following.includes(userToFollow._id)) {
      throw new UserActionError('Already following this user', 'ALREADY_FOLLOWING');
    }

    // Update both users
    await Promise.all([
      User.findByIdAndUpdate(currentUser._id,
        { $addToSet: { following: userToFollow._id } }
      ),
      User.findByIdAndUpdate(userToFollow._id,
        { $addToSet: { followers: currentUser._id } }
      )
    ]);

    // Revalidate paths
    revalidatePath('/');
    revalidatePath('/profile');
    revalidatePath(`/profile/${currentUserId}`);
    revalidatePath(`/profile/${userToFollowId}`);

    return { success: true };
  } catch (error) {
    console.error("Error following user:", error);
    if (error instanceof UserActionError) throw error;
    throw new UserActionError('Failed to follow user', 'FOLLOW_ERROR');
  }
}

export async function unfollowUser(currentUserId: string, userToUnfollowId: string) {
  try {
    await connectDB();

    // Find users by clerkId
    const [currentUser, userToUnfollow] = await Promise.all([
      User.findOne({ clerkId: currentUserId }),
      User.findOne({ clerkId: userToUnfollowId })
    ]);

    if (!currentUser || !userToUnfollow) {
      throw new UserActionError('User not found', 'USER_NOT_FOUND');
    }

    // Check if not following
    if (!currentUser.following.includes(userToUnfollow._id)) {
      throw new UserActionError('Not following this user', 'NOT_FOLLOWING');
    }

    // Update both users
    await Promise.all([
      User.findByIdAndUpdate(currentUser._id,
        { $pull: { following: userToUnfollow._id } }
      ),
      User.findByIdAndUpdate(userToUnfollow._id,
        { $pull: { followers: currentUser._id } }
      )
    ]);

    // Revalidate paths
    revalidatePath('/');
    revalidatePath('/profile');
    revalidatePath(`/profile/${currentUserId}`);
    revalidatePath(`/profile/${userToUnfollowId}`);

    return { success: true };
  } catch (error) {
    console.error("Error unfollowing user:", error);
    if (error instanceof UserActionError) throw error;
    throw new UserActionError('Failed to unfollow user', 'UNFOLLOW_ERROR');
  }
}

export async function getUpdatedUserData(userId: string) {
  try {
    await connectDB();
    const user = await User.findOne({ clerkId: userId }).lean();
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  } catch (error) {
    console.error("Error getting updated user data:", error);
    throw error;
  }
}




export async function getAllUsers(options: {
  page?: number;
  limit?: number;
  search?: string;
  excludeUserId?: string;
  currentUserId?: string;
} = {}) {
  try {
    await connectDB();
    const {
      page = 1,
      limit = 10,
      search = '',

      currentUserId
    } = options;

    const query: any = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } },
      ];
    }
    // ... existing code ...
    let excludeUserId; // Change from const to let
    if (options.excludeUserId) {
      excludeUserId = options.excludeUserId; // Assign the value from options
      if (!Types.ObjectId.isValid(excludeUserId)) {
        console.warn(`Invalid excludeUserId provided: ${excludeUserId}. It will be ignored.`);
        excludeUserId = undefined; // Ignore the invalid excludeUserId
      } else {
        query._id = { $ne: new Types.ObjectId(excludeUserId) };
      }
    }
    // ... existing code ...
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean() as unknown[];

    let currentUser: IUser | null = null;
    if (currentUserId) {
      currentUser = await User.findOne({ clerkId: currentUserId }).lean() as IUser | null;
    }

    const usersWithFollowStatus = users.map((user: any) => ({
      ...serializeUser(user),
      isFollowing: currentUser ? currentUser.following.some(
        (id: any) => id.toString() === user._id.toString()
      ) : false
    }));

    return {
      users: usersWithFollowStatus,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    if (error instanceof UserActionError) throw error;
    throw new UserActionError('Failed to fetch users', 'FETCH_USERS_ERROR');
  }
}

export async function getCurrentUser(clerkId: string): Promise<IUser | null> {
  try {
    await connectDB();
    const user = await User.findOne({ clerkId }).lean() as IUser | null;
    return user;
  } catch (error) {
    console.error("Error fetching current user:", error);
    throw new UserActionError('Failed to fetch current user', 'FETCH_CURRENT_USER_ERROR');
  }
}