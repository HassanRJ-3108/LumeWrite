import { redirect } from "next/navigation";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getUserById, getUserByClerkId } from "@/actions/user.actions";
import FollowButton from "@/components/FollowButton";
import Link from "next/link";
import Image from "next/image";
import BlogCard from "@/components/BlogCard"
import { getPosts } from "@/actions/post.actions";

const Profile = async ({ params }: { params: { id: string } }) => {
  const { userId: clerkUserId } = auth();

  if (!clerkUserId) {
    redirect("/sign-in");
  }

  const [currentUser, profileUser, posts] = await Promise.all([
    getUserByClerkId(clerkUserId),
    getUserById(params.id),
    getPosts()
  ]);

  if (!profileUser) {
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

  const isOwnProfile = currentUser?._id?.toString() === profileUser._id?.toString();
  const isFollowing = currentUser?.following?.some(id => id.toString() === profileUser._id?.toString()) || false;

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
        {!isOwnProfile && currentUser && (
          <FollowButton
            currentUserId={currentUser._id?.toString() || ''}
            profileUserId={profileUser._id?.toString() || ''}
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
        <div className="divide-y divide-gray-200">
          {posts.filter(post => post.author.toString() === profileUser._id.toString()).map((post) => (
            <BlogCard key={post._id.toString()} post={post} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Profile;

