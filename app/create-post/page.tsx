import CreatePostForm from "@/components/CreatePostForm";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default function CreatePostPage() {
  const { userId } = auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen py-8 bg-gray-50">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Create New Post</h1>
        <CreatePostForm />
      </div>
    </div>
  );
} 