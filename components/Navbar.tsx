'use client'

import Link from "next/link";
import React, { useState } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import SearchPosts from "./SearchPosts";
import CustomUserButton from "./CustomUserButton";

const Navbar = () => {
  const { isSignedIn } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const menuVariants = {
    closed: { x: "100%", opacity: 0 },
    open: { x: 0, opacity: 1 }
  };

  const iconVariants = {
    closed: { rotate: 0 },
    open: { rotate: 90 }
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-cyan-600 text-xl font-bold hover:text-cyan-700 transition-colors duration-200">
              LumeWrite
            </Link>
          </div>
          <div className="hidden md:block flex-grow mx-4">
            <SearchPosts />
          </div>
          <div className="hidden md:flex items-center space-x-4">
            {isSignedIn && (
              <Link href="/create-post" className="text-cyan-600 hover:text-cyan-700 transition-colors duration-200">
                Create Post
              </Link>
            )}
            {!isSignedIn ? (
              <>
                <Link href="/sign-in" className="text-cyan-600 hover:text-cyan-700 transition-colors duration-200">
                  Login
                </Link>
                <Link href="/sign-up" className="bg-cyan-600 text-white px-4 py-2 rounded-md hover:bg-cyan-700 transition-colors duration-200">
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                <Link href="/profile" className="text-cyan-600 hover:text-cyan-700 transition-colors duration-200">
                  Profile
                </Link>
                <CustomUserButton />
              </>
            )}
          </div>
          <div className="md:hidden">
            <motion.button
              onClick={toggleMenu}
              className="text-cyan-600 p-2"
              variants={iconVariants}
              animate={isOpen ? "open" : "closed"}
              transition={{ duration: 0.3 }}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </motion.button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={menuVariants}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed top-0 right-0 bottom-0 w-64 bg-white shadow-xl z-50 md:hidden"
          >
            <div className="flex flex-col h-full">
              <div className="flex justify-end p-4">
                <motion.button
                  onClick={toggleMenu}
                  className="text-cyan-600 p-2"
                  variants={iconVariants}
                  animate="open"
                  transition={{ duration: 0.3 }}
                >
                  <X size={24} />
                </motion.button>
              </div>
              <div className="flex-grow overflow-y-auto">
                <div className="px-4 py-2">
                  <SearchPosts />
                </div>
                <div className="px-4 py-2 space-y-3">
                  {isSignedIn && (
                    <Link href="/create-post" className="block text-cyan-600 hover:text-cyan-700 transition-colors duration-200">
                      Create Post
                    </Link>
                  )}
                  {!isSignedIn ? (
                    <>
                      <Link href="/sign-in" className="block text-cyan-600 hover:text-cyan-700 transition-colors duration-200">
                        Login
                      </Link>
                      <Link href="/sign-up" className="block bg-cyan-600 text-white px-4 py-2 rounded-md hover:bg-cyan-700 transition-colors duration-200 text-center">
                        Sign Up
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/profile" className="block text-cyan-600 hover:text-cyan-700 transition-colors duration-200">
                        Profile
                      </Link>
                      <div className="py-2">
                        <CustomUserButton />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;

