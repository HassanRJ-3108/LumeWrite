import { getPosts } from "@/actions/post.actions"
import { getAllUsers, getCurrentUser } from "@/actions/user.actions"
import BlogCard from "@/components/BlogCard"
import UserList from "@/components/UserList"
import { auth } from "@clerk/nextjs/server"
import Link from "next/link"
import { IUser } from "@/types/user"
import { ISerializedPost } from "@/types/post"

export default async function Home() {
  const { userId } = auth()

  const [posts, usersData, currentUser] = await Promise.all([
    getPosts(),
    getAllUsers({ excludeUserId: userId, currentUserId: userId }),
    getCurrentUser(userId)
  ])

 
  const otherUsers = usersData.users.filter((user): user is IUser & { isFollowing: boolean } => 
    user.clerkId !== userId
  );

  return (
    <main className="min-h-screen py-8">
      <div className="max-w-screen-xl mx-auto px-4 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main content - Posts */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-8">Latest Posts</h1>
            <div className="divide-y divide-gray-200">
              {posts.map((post: ISerializedPost) => (
                <BlogCard key={post._id} post={post} />
              ))}
            </div>
          </div>

          {/* Right sidebar - Fixed position */}
          <div className="lg:w-80 shrink-0">
            <div className="lg:sticky lg:top-8 space-y-6">
              <UserList users={otherUsers} currentUserId={userId} />
              
              {/* Additional sidebar content */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium mb-2">About</h3>
                <p className="text-sm text-gray-600">
                  Discover stories, thinking, and expertise from writers on any topic.
                </p>
              </div>

              {/* Footer links */}
              <div className="text-sm text-gray-500">
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  <Link href="/help">Help</Link>
                  <Link href="/status">Status</Link>
                  <Link href="/writers">Writers</Link>
                  <Link href="/blog">Blog</Link>
                  <Link href="/careers">Careers</Link>
                  <Link href="/privacy">Privacy</Link>
                  <Link href="/terms">Terms</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

