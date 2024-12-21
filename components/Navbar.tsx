'use client'

import Link from "next/link";
import React, { useState } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import SearchPosts from "./SearchPosts";
import CustomUserButton from "./CustomUserButton";

const Navbar = () => {
  const { isSignedIn, userId } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-cyan-950 rounded-b-xl shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link href="/" className="text-white text-xl font-bold hover:text-cyan-300 transition-colors duration-200">
              LumeWrite
            </Link>
          </div>
          <div className="hidden md:block flex-grow mx-4">
            <SearchPosts />
          </div>
          <div className="hidden md:flex items-center space-x-4">
            {isSignedIn && (
              <Link href="/create-post" className="text-white hover:text-cyan-300 transition-colors duration-200">
                Create Post
              </Link>
            )}
            {!isSignedIn ? (
              <>
                <Link href="/sign-in" className="text-white hover:text-cyan-300 transition-colors duration-200">
                  Login
                </Link>
                <Link href="/sign-up" className="bg-cyan-600 text-white px-3 py-2 rounded-md hover:bg-cyan-500 transition-colors duration-200">
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                <Link href="/profile" className="text-white hover:text-cyan-300 transition-colors duration-200">
                  Profile
                </Link>
                <CustomUserButton />
              </>
            )}
          </div>
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-white p-2">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-cyan-900"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              <div className="py-2">
                <SearchPosts />
              </div>
              {isSignedIn && (
                <Link href="/create-post" className="text-white block px-3 py-2 rounded-md text-base font-medium hover:bg-cyan-800 transition-colors duration-200">
                  Create Post
                </Link>
              )}
              {!isSignedIn ? (
                <>
                  <Link href="/sign-in" className="text-white block px-3 py-2 rounded-md text-base font-medium hover:bg-cyan-800 transition-colors duration-200">
                    Login
                  </Link>
                  <Link href="/sign-up" className="text-white block px-3 py-2 rounded-md text-base font-medium hover:bg-cyan-800 transition-colors duration-200">
                    Sign Up
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/profile" className="text-white block px-3 py-2 rounded-md text-base font-medium hover:bg-cyan-800 transition-colors duration-200">
                    Profile
                  </Link>
                  <div className="px-3 py-2">
                    <CustomUserButton />
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;

