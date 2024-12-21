'use client'

import { UserButton } from '@clerk/nextjs'
import { HiUser, HiPencil } from 'react-icons/hi'


const CustomUserButton = () => {
    return (
        <UserButton>
            <UserButton.MenuItems>
                <UserButton.Link
                    label="Profile"
                    labelIcon={<HiUser />}
                    href={`/profile`}
                />
                <UserButton.Link
                    label="Edit Profile"
                    labelIcon={<HiPencil />}
                    href={`/profile/edit`}
                />
                <UserButton.Action label="manageAccount" />
                <UserButton.Action label="signOut" />
            </UserButton.MenuItems>
        </UserButton>
    )
}

export default CustomUserButton 