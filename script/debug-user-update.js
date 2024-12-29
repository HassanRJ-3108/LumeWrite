import { connect } from "@/db";
import User from "@/modals/user.modal";

async function debugUserUpdate() {
  try {
    await connect();
    
    const testClerkId = "user_2qRM6Z0zm7n2DRzC0EUzUjFImOc";
    
    // Fetch the user before update
    const userBefore = await User.findOne({ clerkId: testClerkId });
    console.log("User before update:", userBefore);
    
    // Update the user
    const updatedUser = await User.findOneAndUpdate(
      { clerkId: testClerkId },
      { 
        $set: { 
          about: "This is a test about section.",
          bio: "Updated bio for testing."
        }
      },
      { new: true, runValidators: true }
    );
    
    console.log("Updated user:", updatedUser);
    
    // Fetch the user after update to verify changes
    const userAfter = await User.findOne({ clerkId: testClerkId });
    console.log("User after update:", userAfter);
    
  } catch (error) {
    console.error("Error during debug:", error);
  }
}

debugUserUpdate();