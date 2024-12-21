import { getPostById } from "@/actions/post.actions";
import EditPostForm from "@/components/EditPostForm";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function EditPostPage({ params }: { params: { id: string } }) {
  const { userId } = auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const post = await getPostById(params.id);

  if (!post) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4">Post not found</h1>
          <p>The post you&apos;re trying to edit doesn&apos;t exist or has been removed.</p>
        </div>
      </div>
    );
  }

  if (post.author.clerkId !== userId) {
    redirect("/");
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Edit Post</h1>
      <EditPostForm post={post} />
    </div>
  );
}

