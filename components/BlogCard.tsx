'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Heart, MessageCircle, MoreHorizontal, Edit, Trash } from 'lucide-react'
import { IPost } from '@/types/post'
import { IUser } from '@/types/user'
import { likePost, unlikePost, deletePost } from '@/actions/post.actions'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { inter } from '@/app/ui/fonts'
import { segoeUI, segoeui1} from '@/app/layout'


interface BlogCardProps {
  post: IPost
}

export default function BlogCard({ post }: BlogCardProps) {
  const author = post.author as IUser
  const { user } = useUser()
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isImageLoading, setIsImageLoading] = useState(true)
  const [postImage, setPostImage] = useState<string | null>(null)
  const [isLiked, setIsLiked] = useState(post.likes.some(like => like.toString() === user?.id))
  const [likesCount, setLikesCount] = useState(post.likes.length)

  const handleLike = async () => {
    if (user?.id) {
      if (isLiked) {
        await unlikePost(user.id, post._id.toString())
        setLikesCount(prev => prev - 1)
      } else {
        await likePost(user.id, post._id.toString())
        setLikesCount(prev => prev + 1)
      }
      setIsLiked(!isLiked)
    }
  }
  
  useEffect(() => {
    const extractImageFromContent = (content: string) => {
      const parser = new DOMParser()
      const doc = parser.parseFromString(content, 'text/html')
      const img = doc.querySelector('img')
      return img ? img.src : null
    }

    const imageUrl = extractImageFromContent(post.content)
    setPostImage(imageUrl)
  }, [post.content])

  const description = post.content
    .replace(/<img\b[^>]*>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim()
    .split('\n')[0]
    .substring(0, 150) + (post.content.length > 150 ? '...' : '')
  
  const readingTime = Math.max(1, Math.ceil(post.content.length / 1000))
  
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      setIsDeleting(true)
      try {
        await deletePost(post._id.toString(), user?.id || '')
        router.refresh()
      } catch (error) {
        console.error('Error deleting post:', error)
        alert('Failed to delete post. Please try again.')
      } finally {
        setIsDeleting(false)
      }
    }
  }

  return (
    <motion.article 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={`${inter.className} py-6 first:pt-0 border-b border-gray-200 last:border-0 hover:bg-gray-50/50 transition-colors`}
    >
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-4">
          <Link 
            href={`/profile/${author._id}`} 
            className="shrink-0 hover:opacity-80 transition-opacity relative w-8 h-8 rounded-full overflow-hidden"
          >
            <Image
              src={author.photo || `https://api.dicebear.com/6.x/initials/svg?seed=${author.username}`}
              alt={author.username}
              fill
              className="object-cover"
              sizes="32px"
            />
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <Link href={`/profile/${author._id}`} className="font-medium text-gray-900 hover:underline">
              {author.username}
            </Link>
            <span className="text-gray-500">·</span>
            <time className="text-gray-500" dateTime={new Date(post.createdAt).toISOString()}>
              {new Date(post.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              })}
            </time>
          </div>
        </div>

        <div className="flex gap-8 items-start">
          <div className="flex-1 space-y-3">
            <Link href={`/post/${post._id}`} className="group block space-y-2">
              <h2 className={`${segoeUI.className} text-[25px] font-black leading-tight group-hover:text-gray-700 transition-colors tracking-tight`}>
                {post.title}
              </h2>
              <p className={`${segoeui1.className} text-[16px] font-medium text-gray-600 leading-normal line-clamp-2`}>
                {description}
              </p>
            </Link>

            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-6">
                <button 
                  onClick={handleLike} 
                  className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <Heart 
                    className={`w-5 h-5 ${isLiked ? 'fill-gray-900 text-gray-900' : 'stroke-current'}`} 
                  />
                  <span className="text-sm">{likesCount}</span>
                </button>
                <button className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm">{post.comments.length}</span>
                </button>
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <span>{readingTime}</span>
                  min read
                </span>
              </div>

              <div className="flex items-center gap-1">
                {user?.id === author.clerkId && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button 
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="More options"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem asChild>
                        <Link href={`/post/edit/${post._id}`} className="flex items-center">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit post
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={handleDelete} 
                        disabled={isDeleting}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash className="w-4 h-4 mr-2" />
                        Delete post
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </div>

          {postImage && (
            <Link 
              href={`/post/${post._id}`}
              className="hidden sm:block shrink-0 relative w-32 h-32 rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
            >
              <Image
                src={postImage}
                alt={post.title}
                fill
                className="object-cover"
                sizes="128px"
                onLoadingComplete={() => setIsImageLoading(false)}
              />
              <AnimatePresence>
                {isImageLoading && (
                  <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 bg-gray-100 animate-pulse"
                  />
                )}
              </AnimatePresence>
            </Link>
          )}
        </div>
      </div>
    </motion.article>
  )
}

