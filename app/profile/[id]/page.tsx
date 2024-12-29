import { redirect } from "next/navigation";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getUserById, getUserByClerkId } from "@/actions/user.actions";
import FollowButton from "@/components/FollowButton";
import Link from "next/link";
import Image from "next/image";
import BlogCard from "@/components/BlogCard";
import { getPosts } from "@/actions/post.actions";
import { ISerializedPost } from "@/types/post";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, FileText, User, Pencil } from 'lucide-react';
import AboutSection from "@/components/AboutSection";

const Profile = async ({ params }: { params: { id: string } }) => {
  const { userId: clerkUserId } = auth();

  if (!clerkUserId) {
    redirect("/sign-in");
  }

  try {
    const isClerkId = params.id.startsWith('user_');
    
    const [currentUser, profileUser, posts] = await Promise.all([
      getUserByClerkId(clerkUserId),
      isClerkId ? getUserByClerkId(params.id) : getUserById(params.id),
      getPosts()
    ]);

    if (!profileUser || !currentUser) {
      return (
        <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">User not found</h1>
            <p className="text-xl text-gray-600">This user&apos;t exist or has been removed.</p>
            <Link href="/" className="mt-6 inline-block px-6 py-3 rounded-full bg-cyan-600 text-white hover:bg-cyan-700 transition-colors">
              Go Home
            </Link>
          </div>
        </div>
      );
    }

    const profileClerkUser = await clerkClient.users.getUser(profileUser.clerkId);
    const isOwnProfile = currentUser._id.toString() === profileUser._id.toString();
    const isFollowing = currentUser.following.some(id => id.toString() === profileUser._id.toString());

    const userPosts = posts.filter((post: ISerializedPost) => {
      const postAuthorId = typeof post.author === 'string' ? post.author : post.author._id;
      return postAuthorId === profileUser._id.toString();
    });

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[calc(100vh-200px)]">
          {/* Profile Section (Left Side) */}
          <div className="lg:col-span-4">
            <div className="sticky top-8">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="relative h-32 bg-gradient-to-r from-cyan-500 to-blue-500">
                  <Image
                    src={profileClerkUser.imageUrl}
                    alt={profileUser.username}
                    fill
                    className="opacity-50 object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent h-16"></div>
                </div>
                <div className="relative px-6 pb-6 pt-16">
                  <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden">
                    <Image
                      src={profileClerkUser.imageUrl}
                      alt={profileUser.username}
                      fill
                      className="object-cover"
                      sizes="128px"
                    />
                  </div>
                  <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">{profileUser.username}</h1>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {profileUser.bio || "No bio available"}
                    </p>
                    <div className="grid grid-cols-3 gap-4 py-4 border-y border-gray-100 mb-4">
                      <div className="text-center">
                        <div className="font-semibold">{profileUser.followers.length}</div>
                        <div className="text-xs text-gray-600">Followers</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{profileUser.following.length}</div>
                        <div className="text-xs text-gray-600">Following</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{userPosts.length}</div>
                        <div className="text-xs text-gray-600">Posts</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center text-sm text-gray-600 mb-4">
                      <CalendarDays className="w-4 h-4 mr-1" />
                      <span>Joined {new Date(profileUser.createdAt).toLocaleDateString()}</span>
                    </div>
                    {!isOwnProfile ? (
                      <FollowButton
                        currentUserId={clerkUserId}
                        profileUserId={profileUser.clerkId}
                        isFollowing={isFollowing}
                      />
                    ) : (
                      <Link
                        href="/profile/edit"
                        className="inline-flex items-center justify-center w-full px-6 py-2 rounded-full bg-cyan-600 text-white hover:bg-cyan-700 transition-colors"
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Section (Right Side) */}
          <div className="lg:col-span-8">
            <Tabs defaultValue="posts" className="w-full">
              <TabsList className="w-full flex mb-8 bg-white rounded-lg shadow-sm">
                <TabsTrigger value="posts" className="flex-1">
                  <FileText className="w-4 h-4 mr-2" />
                  Posts
                </TabsTrigger>
                <TabsTrigger value="about" className="flex-1">
                  <User className="w-4 h-4 mr-2" />
                  About
                </TabsTrigger>
              </TabsList>
              <TabsContent value="posts" className="min-h-[500px]">
                {userPosts.length > 0 ? (
                  <div className="grid gap-6">
                    {userPosts.map((post: ISerializedPost) => (
                      <BlogCard key={post._id} post={post} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[500px] bg-white rounded-lg shadow-sm p-8">
                    <FileText className="w-16 h-16 text-gray-400 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts yet</h3>
                    <p className="text-gray-600 text-center">
                      {isOwnProfile 
                        ? "Share your thoughts and ideas by creating your first post!"
                        : `${profileUser.username} hasn't posted anything yet.`
                      }
                    </p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="about" className="min-h-[500px]">
                <AboutSection user={profileUser} isOwnProfile={isOwnProfile} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Profile error:", error);
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Error</h1>
          <p className="text-xl text-gray-600">Something went wrong. Please try again later.</p>
          <Link href="/" className="mt-6 inline-block px-6 py-3 rounded-full bg-cyan-600 text-white hover:bg-cyan-700 transition-colors">
            Go Home
          </Link>
        </div>
      </div>
    );
  }
};

export default Profile;

