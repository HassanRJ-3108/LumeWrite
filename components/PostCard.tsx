'use client'

import { likePost, unlikePost, addComment, deletePost } from "@/actions/post.actions";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { ISerializedPost, ISerializedComment } from "@/types/post";
import { IUser } from "@/types/user";
import Link from "next/link";
import Image from "next/image";
import { BookmarkIcon, Heart, MessageCircle, Share2, Edit, Trash } from 'lucide-react';
import FollowButton from "./FollowButton";
import { useRouter } from "next/navigation";
import Prism from 'prismjs';
import 'prismjs/themes/prism.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import { inter, merriweather } from "@/app/ui/fonts";
import { sourceSerif, sohne } from '@/app/layout'
import { toast } from "react-hot-toast";

interface PostCardProps {
  post: ISerializedPost;
  currentUserId: string;
  isGuest: boolean;
}

export default function PostCard({ post, currentUserId, isGuest}: PostCardProps) {
  useEffect(() => {
    if (isGuest) {
      toast("You're not signed in. Please consider signing in to interact with posts.", {
        icon: "🔒",
      });
    }
  }, [isGuest]);


  const [comment, setComment] = useState("");
  const { user } = useUser();
  const [isLiked, setIsLiked] = useState(post.likes.some((like: string | { _id: string }) => 
    typeof like === 'string' 
      ? like === user?.id 
      : like._id === user?.id
  ));
  const [likesCount, setLikesCount] = useState(post.likes.length);
  const [author, setAuthor] = useState<IUser | null>(
    typeof post.author === 'string' ? null : post.author as IUser
  );
  const [isFollowing, setIsFollowing] = useState(false);
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const checkFollowStatus = async () => {
      if (author?.clerkId && currentUserId) {
        try {
          const response = await fetch(`/api/follow-status?userId=${currentUserId}&profileId=${author.clerkId}`);
          const data = await response.json();
          setIsFollowing(data.isFollowing);
        } catch (error) {
          console.error('Error checking follow status:', error);
        }
      }
    };
    checkFollowStatus();
  }, [author?.clerkId, currentUserId]);

  const handleFollowUpdate = async (profileUserId: string, newIsFollowing: boolean) => {
    setIsFollowing(newIsFollowing);
    router.refresh();

    const event = new CustomEvent('followStatusChange', {
      detail: { profileUserId, isFollowing: newIsFollowing }
    });
    window.dispatchEvent(event);
  };

  useEffect(() => {
    const handleFollowStatusChange = (event: CustomEvent<{ profileUserId: string; isFollowing: boolean }>) => {
      if (author?.clerkId && event.detail.profileUserId === author.clerkId) {
        setIsFollowing(event.detail.isFollowing);
      }
    };

    window.addEventListener('followStatusChange', handleFollowStatusChange as EventListener);
    return () => window.removeEventListener('followStatusChange', handleFollowStatusChange as EventListener);
  }, [author?.clerkId]);

  // Early return if no author
  if (!author) {
    return null;
  }

  const handleLike = async () => {
    if (user?.id) {
      if (isLiked) {
        await unlikePost(user.id, post._id.toString());
        setLikesCount(prev => prev - 1);
      } else {
        await likePost(user.id, post._id.toString());
        setLikesCount(prev => prev + 1);
      }
      setIsLiked(!isLiked);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.id && comment.trim()) {
      await addComment(user.id, post._id.toString(), comment);
      setComment("");
      router.refresh();
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      setIsDeleting(true);
      try {
        await deletePost(post._id.toString(), user?.id || '');
        router.push('/');
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('Failed to delete post. Please try again.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  useEffect(() => {
    Prism.highlightAll();
  }, [post.content]);

  return (
    <article className={`max-w-[728px] mx-auto px-4 md:px-0 py-12 ${inter.className}`}>
      {/* Post Header */}
      <header className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href={`/profile/${author.clerkId}`}>
              <div className="relative w-12 h-12">
                <Image
                  src={author.photo || "/placeholder.svg"}
                  alt={author.username}
                  fill
                  className="rounded-full object-cover"
                  sizes="48px"
                />
              </div>
            </Link>
            <div className="flex flex-col">
              <Link href={`/profile/${author.clerkId}`}>
                <span className="font-semibold text-gray-900 hover:underline">
                  {author.username}
                </span>
              </Link>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{author.followers?.length || 0} Followers</span>
                <span>·</span>
                <time>
                  {new Date(post.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </time>
              </div>
            </div>
          </div>
          {currentUserId && currentUserId !== author.clerkId && (
            <FollowButton
              currentUserId={currentUserId}
              profileUserId={author.clerkId}
              isFollowing={isFollowing}
              onFollowUpdate={handleFollowUpdate}
            />
          )}
        </div>
        <h1 className={`${sohne.className} text-4xl md:text-5xl text-gray-900 leading-tight tracking-tight mb-6`}>
          {post.title}
        </h1>
      </header>

      {/* Post Content */}
      <div className={`${merriweather.className} prose prose-lg max-w-none mb-12`}>
        <FormattedContent content={post.content} />
      </div>

      {/* Post Actions */}
      <div className="flex justify-between items-center py-6 mb-12 border-t border-b border-gray-200">
        <div className="flex items-center gap-6">
          {user ? (
            <button
              onClick={handleLike}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
            >
              <Heart className={`w-6 h-6 ${isLiked ? 'fill-gray-900 text-gray-900' : 'stroke-current'}`} />
              <span>{likesCount}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 text-gray-700">
              <Heart className="w-6 h-6 stroke-current" />
              <span>{likesCount}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-gray-700">
            <MessageCircle className="w-6 h-6" />
            <span>{post.comments.length}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-gray-700 hover:text-gray-900">
            <Share2 className="w-6 h-6" />
          </button>
          <button className="text-gray-700 hover:text-gray-900">
            <BookmarkIcon className="w-6 h-6" />
          </button>
          {user?.id === author.clerkId && (
            <>
              <Link href={`/post/edit/${post._id}`} className="text-gray-700 hover:text-gray-900">
                <Edit className="w-6 h-6" />
              </Link>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-red-500 hover:text-red-700"
              >
                <Trash className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Author Section */}
      <section className="mb-16">
        <div className="flex items-start gap-6">
          <Link href={`/profile/${author.clerkId}`}>
            <div className="relative w-16 h-16">
              <Image
                src={author.photo || "/placeholder.svg"}
                alt={author.username}
                fill
                className="rounded-full object-cover"
                sizes="64px"
              />
            </div>
          </Link>
          <div>
            <Link href={`/profile/${author.clerkId}`}>
              <h3 className="text-xl font-semibold text-gray-900 hover:underline mb-2">
                Written by {author.username}
              </h3>
            </Link>
            <p className="text-gray-600 mb-3">
              {author.bio || "No bio available"}
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>{author.followers?.length || 0} Followers</span>
              <span>·</span>
              <span>{author.following?.length || 0} Following</span>
            </div>
          </div>
        </div>
      </section>

      {/* Comments Section */}
      <section>
        <h3 className={`${merriweather.className} text-2xl font-bold text-gray-900 mb-8`}>
          Responses ({post.comments.length})
        </h3>

        {user ? (
          <form onSubmit={handleComment} className="mb-12">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What are your thoughts?"
              className="w-full p-4 text-lg text-gray-900 border-b border-gray-200 focus:outline-none focus:border-gray-900 resize-none"
              rows={3}
            />
            <button
              type="submit"
              className="mt-4 px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-full hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!comment.trim()}
            >
              Respond
            </button>
          </form>
        ) : (
          <p className="text-gray-700 mb-12">Log in to leave a comment.</p>
        )}

        <div className="space-y-8">
          {post.comments.map((comment: ISerializedComment) => (
            <div key={comment._id} className="flex items-start gap-4">
              <Link href={`/profile/${(comment.user as IUser)._id}`}>
                <div className="relative w-10 h-10 flex-shrink-0">
                  <Image
                    src={(comment.user as IUser).photo || "/placeholder.svg"}
                    alt={(comment.user as IUser).username}
                    fill
                    className="rounded-full object-cover"
                    sizes="40px"
                  />
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Link href={`/profile/${(comment.user as IUser)._id}`}>
                    <span className="font-medium text-gray-900 hover:underline">
                      {(comment.user as IUser).username}
                    </span>
                  </Link>
                  <span className="text-sm text-gray-500">
                    {new Date(comment.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <p className="text-gray-800 whitespace-pre-wrap">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </article>
  );
}

function FormattedContent({ content }: { content: string }) {
  useEffect(() => {
    Prism.highlightAll();
  }, [content]);

  return (
    <div
      dangerouslySetInnerHTML={{ __html: content }}
      className={`${sourceSerif.className} text-xl prose prose-lg max-w-none mb-12
        text-gray-700 leading-relaxed
        [&_pre]:bg-gray-50 [&_pre]:border [&_pre]:border-gray-200
        [&_pre]:rounded-md [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:mb-6
        [&_pre]:text-sm
        [&_code]:bg-gray-50 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:mb-6
        [&_code]:text-lg
        [&_p]:mb-6 [&_p]:leading-relaxed [&_h2]:mt-12 [&_h2]:mb-6 [&_h3]:mt-8 [&_h3]:mb-4
        [&_ul]:my-6 [&_ol]:my-6 [&_li]:mb-2
        [&_blockquote]:border-l-4 [&_blockquote]:border-gray-200 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:mb-6
        [&_img]:rounded-lg [&_img]:my-8
        `}
    />
  );
}
