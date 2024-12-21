'use client'

import { updateUser } from "@/actions/user.actions";
import { useState, useEffect } from "react";
import { IUser } from "@/types/user";
import Image from "next/image";
import { useUser, useClerk } from "@clerk/nextjs";
import { toast, Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';

const MAX_USERNAME_LENGTH = 30;
const MAX_BIO_LENGTH = 160; // Adjusted to a common tweet-like length

export default function EditProfileForm({ user }: { user: IUser }) {
  const { user: clerkUser } = useUser();
  const { user: clerkUserMethods } = useClerk();
  
  const [formData, setFormData] = useState({
    username: user.username || "",
    bio: user.bio || "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ username: '', bio: '' });

  useEffect(() => {
    validateForm();
  }, [formData]);

  const validateForm = () => {
    const newErrors = { username: '', bio: '' };

    if (formData.username.length > MAX_USERNAME_LENGTH) {
      newErrors.username = `Username must be ${MAX_USERNAME_LENGTH} characters or less`;
    }

    if (formData.bio.length > MAX_BIO_LENGTH) {
      newErrors.bio = `Bio must be ${MAX_BIO_LENGTH} characters or less`;
    }

    setErrors(newErrors);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && clerkUserMethods) {
      try {
        setIsLoading(true);
        await clerkUserMethods.setProfileImage({ file });
        toast.success('Profile image updated successfully');
      } catch (error) {
        console.error("Error updating profile image:", error);
        toast.error('Failed to update profile image');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (errors.username || errors.bio) {
      toast.error('Please fix the errors before submitting');
      return;
    }
    try {
      setIsLoading(true);
      await updateUser(user.clerkId, {
        username: formData.username,
        bio: formData.bio,
        photo: clerkUser?.imageUrl
      });
      toast.success('Profile updated successfully');
      setTimeout(() => window.location.href = '/profile', 2000);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg"
    >
      <Toaster position="top-center" />
      <h2 className="text-2xl font-bold mb-6 text-center">Edit Your Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col items-center">
          <div className="relative w-32 h-32 mb-4">
            <Image
              src={clerkUser?.imageUrl || '/default-avatar.png'}
              alt="Profile"
              fill
              className="rounded-full object-cover border-4 border-blue-500"
              sizes="(max-width: 128px) 100vw, 128px"
            />
          </div>
          <label className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition">
            <span>Change Photo</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 ${errors.username ? 'border-red-500' : ''}`}
            maxLength={MAX_USERNAME_LENGTH}
          />
          {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
          <p className="text-gray-500 text-xs mt-1">{formData.username.length}/{MAX_USERNAME_LENGTH}</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="bio">Bio</label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            placeholder="Write a short bio about yourself..."
            className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 ${errors.bio ? 'border-red-500' : ''}`}
            rows={4}
            maxLength={MAX_BIO_LENGTH}
          />
          {errors.bio && <p className="text-red-500 text-xs mt-1">{errors.bio}</p>}
          <p className="text-gray-500 text-xs mt-1">{formData.bio.length}/{MAX_BIO_LENGTH}</p>
        </div>

        <button
          type="submit"
          className={`w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isLoading || !!errors.username || !!errors.bio}
        >
          {isLoading ? 'Updating...' : 'Update Profile'}
        </button>
      </form>
    </motion.div>
  );
}

