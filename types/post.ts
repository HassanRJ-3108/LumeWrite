import { Types } from 'mongoose';
import { IUser } from './user';

// Interface for serialized post data (what gets sent to the client)
export interface ISerializedPost {
  _id: string;
  author: IUser | string;
  title: string;
  content: string;
  image?: string;
  likes: string[];
  comments: ISerializedComment[];
  createdAt: string;
  updatedAt: string;
}

// Interface for serialized comment data
export interface ISerializedComment {
  _id: string;
  user: IUser | string;
  content: string;
  createdAt: string;
}

// Original interfaces for Mongoose models
export interface IPost {
  _id: Types.ObjectId;
  author: Types.ObjectId | IUser;
  title: string;
  content: string;
  image?: string;
  likes: Types.ObjectId[];
  comments: IComment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IComment {
  _id: Types.ObjectId;
  user: Types.ObjectId | IUser;
  content: string;
  createdAt: Date;
}

export type PostCreateData = Pick<IPost, 'title' | 'content' | 'image'>;
