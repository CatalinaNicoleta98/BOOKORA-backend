export interface User {
  _id: string;

  // Required
  name: string;
  email: string;
  password: string;

  // Optional profile fields
  profilePicture?: string;
  bio?: string;

  // Public profile settings
  isProfilePublic?: boolean;

  // Ownership / role
  role?: string;

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}