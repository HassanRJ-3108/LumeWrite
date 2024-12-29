'use client'

import { IUser } from '@/types/user';
import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AboutSectionProps {
  user: IUser;
  isOwnProfile: boolean;
}

const AboutSection: React.FC<AboutSectionProps> = ({ user, isOwnProfile }) => {
  return (
    <Card className="w-full h-full bg-white shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-bold">About {user.username}</CardTitle>
        {isOwnProfile && (
          <Link 
            href="/profile/edit" 
            className="inline-flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <Pencil className="w-4 h-4 mr-1" />
            Edit Profile
          </Link>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-base font-semibold">Bio</h3>
          <div className="text-sm text-muted-foreground min-h-[60px] bg-muted/30 rounded-md p-3">
            {user.bio || "No bio available."}
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-base font-semibold">About</h3>
          <div className="text-sm text-muted-foreground min-h-[120px] bg-muted/30 rounded-md p-3">
            {user.about || "No additional information available."}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AboutSection;

