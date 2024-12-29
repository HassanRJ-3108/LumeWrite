"use client";

import { followUser, unfollowUser } from "@/actions/user.actions";
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";

interface FollowButtonProps {
  currentUserId: string;
  profileUserId: string;
  isFollowing: boolean;
  onFollowUpdate?: (profileUserId: string, isFollowing: boolean) => void;
}

export default function FollowButton({ 
  currentUserId, 
  profileUserId, 
  isFollowing: initialIsFollowing,
  onFollowUpdate 
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const { isSignedIn } = useAuth();

  useEffect(() => {
    setIsFollowing(initialIsFollowing);
  }, [initialIsFollowing]);

  const handleFollow = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(currentUserId, profileUserId);
      } else {
        await followUser(currentUserId, profileUserId);
      }

      const newIsFollowing = !isFollowing;
      setIsFollowing(newIsFollowing);
      onFollowUpdate?.(profileUserId, newIsFollowing);
    } catch (error: any) {
      if (error.message === "Already following this user") {
        setIsFollowing(true);
      } else if (error.message === "Not following this user") {
        setIsFollowing(false);
      } else {
        console.error("Follow action failed:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSignedIn) {
    return (
      null
    );
  }

  return (
    <button
      onClick={handleFollow}
      disabled={isLoading}
      className={`px-4 py-1 rounded-full text-sm font-medium transition-colors ${
        isFollowing
          ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
          : "bg-green-600 text-white hover:bg-green-700"
      } disabled:opacity-50`}
    >
      {isFollowing ? "Following" : "Follow"}
    </button>
  );
}
