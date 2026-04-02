export interface User {
  _id: string;

  // Required
  name: string;
  email: string;
  password: string;

  // Optional profile fields
  avatarUrl?: string;
  profilePicture?: string;
  coverImageUrl?: string;
  bio?: string;

  // Public profile settings
  isProfilePublic?: boolean;

  // Ownership / role
  role?: string;

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}