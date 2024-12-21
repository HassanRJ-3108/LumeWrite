import { getPostById } from "@/actions/post.actions";
import PostCard from "@/components/PostCard";
import { auth } from "@clerk/nextjs/server";

export default async function PostPage({ params }: { params: { id: string } }) {
  const { userId } = auth();
  const post = await getPostById(params.id);

  if (!post) {
    return (
      <div className="flex justify-center items-center min-h-screen ">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4">Post not found</h1>
          <p>The post you&apos;re looking for doesn&apos;t exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  pt-16 pb-8">
      <PostCard post={post} />
    </div>
  );
}

