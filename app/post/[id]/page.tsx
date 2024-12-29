import { getPostById } from "@/actions/post.actions";
import PostCard from "@/components/PostCard";
import { auth } from "@clerk/nextjs/server";
import { ISerializedPost } from "@/types/post";

export default async function PostPage({ params }: { params: { id: string } }) {
  const { userId } = auth();

  // Fetch the post data
  const post = (await getPostById(params.id)) as ISerializedPost;

  if (!post) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4">Post not found</h1>
          <p>The post you&apos;re looking for doesn&apos;t exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 pb-8">
      {/* Pass `userId` to the PostCard */}
      <PostCard post={post} currentUserId={userId ?? ""} isGuest={!userId} />
    </div>
  );
}
