'use server'

import { connect } from "@/db";
import Post from "@/modals/post.modal";
import User from "@/modals/user.modal";
import { revalidatePath } from "next/cache";
import { IPost, ISerializedPost, PostCreateData } from "@/types/post";

// Add this helper function at the top
function serializePost(post: any) {
  return {
    _id: post._id.toString(),
    title: post.title,
    content: post.content,
    image: post.image,
    author: typeof post.author === 'object' ? {
      _id: post.author._id.toString(),
      clerkId: post.author.clerkId,
      email: post.author.email,
      username: post.author.username,
      firstName: post.author.firstName,
      lastName: post.author.lastName,
      photo: post.author.photo,
      bio: post.author.bio,
      followers: post.author.followers?.map((id: any) => id.toString()) || [],
      following: post.author.following?.map((id: any) => id.toString()) || [],
      createdAt: post.author.createdAt?.toISOString(),
      updatedAt: post.author.updatedAt?.toISOString()
    } : post.author.toString(),
    likes: post.likes?.map((id: any) => id.toString()) || [],
    comments: post.comments?.map((comment: any) => ({
      _id: comment._id.toString(),
      content: comment.content,
      user: typeof comment.user === 'object' ? {
        _id: comment.user._id.toString(),
        username: comment.user.username,
        photo: comment.user.photo,
        // Add other user fields as needed
      } : comment.user.toString(),
      createdAt: comment.createdAt?.toISOString()
    })) || [],
    createdAt: post.createdAt?.toISOString(),
    updatedAt: post.updatedAt?.toISOString()
  };
}

export async function updatePost(postId: string, userId: string, updateData: Partial<PostCreateData>): Promise<IPost | null> {
  try {
    await connect();
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error("Post not found");
    }
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      throw new Error("User not found");
    }
    if (post.author.toString() !== user._id.toString()) {
      throw new Error("Unauthorized to update this post");
    }
    const updatedPost = await Post.findByIdAndUpdate(postId, updateData, { new: true })
      .populate({
        path: 'author',
        model: User,
        select: 'username photo bio clerkId followers following'
      });
    revalidatePath('/');
    revalidatePath(`/post/${postId}`);
    return JSON.parse(JSON.stringify(updatedPost));
  } catch (error) {
    console.error("Error updating post:", error);
    throw error;
  }
}

export async function deletePost(postId: string, userId: string): Promise<void> {
  try {
    await connect();
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error("Post not found");
    }
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      throw new Error("User not found");
    }
    if (post.author.toString() !== user._id.toString()) {
      throw new Error("Unauthorized to delete this post");
    }
    await Post.findByIdAndDelete(postId);
    revalidatePath('/');
    revalidatePath(`/profile/${user._id}`);
  } catch (error) {
    console.error("Error deleting post:", error);
    throw error;
  }
}

// ... (keep other existing functions)



export async function getPostsByUser(userId: string): Promise<IPost[]> {
  try {
    await connect();
    const posts = await Post.find({ author: userId })
      .sort({ createdAt: -1 })
      .populate({
        path: 'author',
        model: User,
        select: 'username photo bio clerkId followers following'
      })
      .populate('likes', 'username')
      .populate('comments.user', 'username photo');
    return JSON.parse(JSON.stringify(posts));
  } catch (error) {
    console.error("Error fetching user posts:", error);
    throw error;
  }
}



export async function createPost(clerkUserId: string, postData: PostCreateData): Promise<IPost> {
  try {
    await connect();
    const user = await User.findOne({ clerkId: clerkUserId });
    if (!user) {
      throw new Error("User not found");
    }
    const newPost = await Post.create({ author: user._id, ...postData });
    revalidatePath('/');
    return JSON.parse(JSON.stringify(newPost));
  } catch (error) {
    console.error("Error creating post:", error);
    throw error;
  }
}

export async function getPostById(postId: string): Promise<ISerializedPost | null> {
  try {
    await connect();
    const post = await Post.findById(postId)
      .populate({
        path: 'author',
        model: User,
        select: 'username photo bio clerkId followers following'
      })
      .populate('likes', 'username')
      .populate({
        path: 'comments.user',
        model: User,
        select: 'username photo'
      });

    if (!post) return null;
    
    return serializePost(post);
  } catch (error) {
    console.error("Error fetching post:", error);
    throw error;
  }
}

export async function likePost(userId: string, postId: string) {
  try {
    await connect();
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      throw new Error("User not found");
    }
    await Post.findByIdAndUpdate(postId, { $addToSet: { likes: user._id } });
    revalidatePath('/');
  } catch (error) {
    console.error("Error liking post:", error);
    throw error;
  }
}

export async function unlikePost(userId: string, postId: string) {
  try {
    await connect();
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      throw new Error("User not found");
    }
    await Post.findByIdAndUpdate(postId, { $pull: { likes: user._id } });
    revalidatePath('/');
  } catch (error) {
    console.error("Error unliking post:", error);
    throw error;
  }
}

export async function addComment(userId: string, postId: string, content: string) {
  try {
    await connect();
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      throw new Error("User not found");
    }
    await Post.findByIdAndUpdate(postId, {
      $push: { comments: { user: user._id, content } }
    });
    revalidatePath('/');
  } catch (error) {
    console.error("Error adding comment:", error);
    throw error;
  }
}

export async function getPosts(page = 1, limit = 10): Promise<ISerializedPost[]> {
  try {
    await connect();
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({
        path: 'author',
        model: User,
        select: 'username photo bio clerkId followers following email firstName lastName'
      })
      .populate('likes')
      .populate({
        path: 'comments.user',
        model: User,
        select: 'username photo'
      });
    
    return posts.map(post => serializePost(post));
  } catch (error) {
    console.error("Error fetching posts:", error);
    throw error;
  }
}

export async function searchPosts(query: string): Promise<IPost[]> {
  try {
    await connect();
    const posts = await Post.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } }
      ]
    })
    .sort({ createdAt: -1 })
    .populate('author', 'username photo')
    .populate('likes', 'username')
    .populate('comments.user', 'username photo');
    return JSON.parse(JSON.stringify(posts));
  } catch (error) {
    console.error("Error searching posts:", error);
    throw error;
  }
}

