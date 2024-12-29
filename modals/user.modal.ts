import { Schema, model, models } from "mongoose";
import { IUser } from "@/types/user";

const UserSchema = new Schema<IUser>({
  clerkId: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  photo: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  bio: {
    type: String,
    default: "",
  },
  about: {
    type: String,
    default: "",
  },
  followers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  savedPosts: [{
    type: Schema.Types.ObjectId,
    ref: 'Post'
  }],
}, {
  timestamps: true
});

const User = models?.User || model<IUser>("User", UserSchema);

export default User;

