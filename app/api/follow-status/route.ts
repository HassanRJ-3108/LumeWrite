import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/db';
import User from '@/modals/user.modal';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const profileId = searchParams.get('profileId');

    if (!userId || !profileId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    await connect();

    const [currentUser, profileUser] = await Promise.all([
      User.findOne({ clerkId: userId }),
      User.findOne({ clerkId: profileId })
    ]);

    if (!currentUser || !profileUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isFollowing = currentUser.following.includes(profileUser._id);

    return NextResponse.json({ isFollowing });
  } catch (error) {
    console.error('Error checking follow status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 