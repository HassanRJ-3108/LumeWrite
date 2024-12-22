import { redirect } from "next/navigation";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getUserById, getUserByClerkId } from "@/actions/user.actions";
import FollowButton from "@/components/FollowButton";
import Link from "next/link";
import Image from "next/image";
import BlogCard from "@/components/BlogCard";
import { getPosts } from "@/actions/post.actions";
import { ISerializedPost } from "@/types/post";

const Profile = async ({ params }: { params: { id: string } }) => {
  const { userId: clerkUserId } = auth();

  if (!clerkUserId) {
    redirect("/sign-in");
  }

  try {
    // Check if the ID is a Clerk ID
    const isClerkId = params.id.startsWith('user_');
    
    const [currentUser, profileUser, posts] = await Promise.all([
      getUserByClerkId(clerkUserId),
      isClerkId ? getUserByClerkId(params.id) : getUserById(params.id),
      getPosts()
    ]);

    if (!profileUser || !currentUser) {
      return (
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">User not found</h1>
            <p className="text-gray-600">This user doesn&apos;t exist or has been removed.</p>
          </div>
        </div>
      );
    }

    // Get Clerk user data for the profile we're viewing
    const profileClerkUser = await clerkClient.users.getUser(profileUser.clerkId);

    // Convert IDs to strings for comparison
    const isOwnProfile = currentUser._id.toString() === profileUser._id.toString();
    
    // Check if the current user is following the profile user
    const isFollowing = currentUser.following.some(id => 
      id.toString() === profileUser._id.toString()
    );

    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="relative w-32 h-32 mx-auto mb-4">
            <Image
              src={profileClerkUser.imageUrl}
              alt={profileUser.username}
              fill
              className="rounded-full object-cover"
              sizes="128px"
              priority
            />
          </div>
          <h1 className="text-3xl font-bold mb-2">{profileUser.username}</h1>
          {profileUser.bio ? (
            <p className="text-gray-600 mb-4 max-w-md mx-auto">{profileUser.bio}</p>
          ) : (
            <p className="text-gray-500 mb-4">No bio added yet</p>
          )}
          <div className="flex justify-center items-center space-x-4 text-sm text-gray-600 mb-6">
            <span>{profileUser.followers.length} Followers</span>
            <span>·</span>
            <span>{profileUser.following.length} Following</span>
          </div>
          {!isOwnProfile && (
            <FollowButton
              currentUserId={clerkUserId}
              profileUserId={profileUser.clerkId}
              isFollowing={isFollowing}
            />
          )}
          {isOwnProfile && (
            <Link
              href="/profile/edit"
              className="inline-block px-6 py-2 rounded-full bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors"
            >
              Edit Profile
            </Link>
          )}
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Posts</h2>
          <div className="divide-y divide-gray-200 w-full">
            {posts
              .filter((post: ISerializedPost) => {
                const postAuthorId = typeof post.author === 'string' 
                  ? post.author 
                  : post.author._id;
                return postAuthorId === profileUser._id.toString();
              })
              .map((post: ISerializedPost) => (
                <BlogCard key={post._id} post={post}/>
              ))}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Profile error:", error);
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Error</h1>
          <p className="text-gray-600">Something went wrong. Please try again later.</p>
        </div>
      </div>
    );
  }
};

export default Profile;

