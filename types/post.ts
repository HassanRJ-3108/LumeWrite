import { Types } from 'mongoose';
import { IUser } from './user';

export interface IPost {
  _id: Types.ObjectId;
  author: Types.ObjectId | IUser;
  title: string;
  content: string;
  image?: string; // Add this line
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
