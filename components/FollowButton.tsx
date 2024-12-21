'use client'

import { followUser, unfollowUser } from "@/actions/user.actions";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from 'next/navigation';

interface FollowButtonProps {
  currentUserId: string;
  profileUserId: string;
  isFollowing: boolean;
  onFollowUpdate?: (profileUserId: string, isFollowing: boolean) => void;
}

export default function FollowButton({ currentUserId, profileUserId, isFollowing: initialIsFollowing, onFollowUpdate }: FollowButtonProps) {
  const [following, setFollowing] = useState(initialIsFollowing);
  const [isHovered, setIsHovered] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const handleFollow = async () => {
    setIsPending(true);
    try {
      if (following) {
        await unfollowUser(currentUserId, profileUserId);
        toast.success("Unfollowed successfully");
      } else {
        await followUser(currentUserId, profileUserId);
        toast.success("Followed successfully");
      }
      setFollowing(!following);
      if (onFollowUpdate) {
        onFollowUpdate(profileUserId, !following);
      }
      router.refresh();
    } catch (error: any) {
      console.error('Error following/unfollowing user:', error);
      toast.error(error.message || "Failed to update follow status. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      onClick={handleFollow}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={isPending}
      className={`
        px-3 py-1 text-sm font-medium rounded-full transition-all
        ${following 
          ? 'border border-gray-300 text-gray-700 hover:border-red-500 hover:text-red-500 hover:bg-red-50' 
          : 'border border-gray-700 text-gray-900 hover:bg-gray-100'
        }
        ${isPending ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {isPending 
        ? 'Loading...' 
        : (following 
            ? (isHovered ? 'Unfollow' : 'Following') 
            : 'Follow'
          )
      }
    </button>
  );
}

