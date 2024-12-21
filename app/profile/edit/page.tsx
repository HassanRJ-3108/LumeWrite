import { redirect } from "next/navigation";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/actions/user.actions";
import EditProfileForm from "@/components/EditFormProfile";

const EditProfile = async () => {
  const { userId } = auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const [user, clerkUser] = await Promise.all([
    getUserByClerkId(userId),
    clerkClient.users.getUser(userId)
  ]);

  if (!user || !clerkUser) {
    return <div>User not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <EditProfileForm user={user} />
      </div>
    </div>
  );
};

export default EditProfile; 