import { Types } from 'mongoose';

export interface IUser {
  _id: Types.ObjectId;
  clerkId: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  photo: string;
  bio?: string;
  about?: string;
  followers: Types.ObjectId[];
  following: Types.ObjectId[];
  savedPosts: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export type UserUpdateData = Partial<Pick<IUser, 'bio' | 'photo' | 'username' | 'about'>>;

