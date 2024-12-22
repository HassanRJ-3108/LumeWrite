'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { IUser } from '@/types/user'
import FollowButton from './FollowButton'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

interface UserListProps {
    users: (IUser & { isFollowing: boolean })[];
    currentUserId: string;
}

export default function UserList({ users, currentUserId }: UserListProps) {
    const [visibleUsers, setVisibleUsers] = useState(5)
    const [localUsers, setLocalUsers] = useState(users)
    const router = useRouter()

    useEffect(() => {
        setLocalUsers(users);
    }, [users]);

    const handleFollowUpdate = (profileUserId: string, isFollowing: boolean) => {
        setLocalUsers(prevUsers => 
            prevUsers.map(user => 
                user.clerkId === profileUserId
                    ? { ...user, isFollowing }
                    : user
            )
        );
        router.refresh();
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="font-bold text-lg mb-4">Who to follow</h2>
            <div className="space-y-4">
                {localUsers.slice(0, visibleUsers).map((user, index) => (
                    <motion.div
                        key={user.clerkId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex items-start gap-3"
                    >
                        <Link href={`/profile/${user.clerkId}`} className="shrink-0">
                            <Image
                                src={user.photo || '/placeholder.svg?height=40&width=40'}
                                alt={user.username}
                                width={40}
                                height={40}
                                className="rounded-full object-cover border border-gray-200"
                            />
                        </Link>
                        <div className="flex-1 min-w-0">
                            <Link href={`/profile/${user.clerkId}`} className="block">
                                <h3 className="font-medium truncate hover:underline">
                                    {user.username}
                                </h3>
                                <p className="text-sm text-gray-500 line-clamp-2">
                                    {user.bio || 'No bio available'}
                                </p>
                            </Link>
                        </div>
                        {user.clerkId !== currentUserId && (
                            <FollowButton
                                currentUserId={currentUserId}
                                profileUserId={user.clerkId}
                                isFollowing={user.isFollowing}
                                onFollowUpdate={handleFollowUpdate}
                            />
                        )}
                    </motion.div>
                ))}
            </div>
            {localUsers.length > visibleUsers && (
                <button
                    onClick={() => setVisibleUsers(prev => prev + 5)}
                    className="w-full mt-4 text-green-600 hover:text-green-700 text-sm font-medium"
                >
                    Show more
                </button>
            )}
        </div>
    )
}

