export interface User extends Document {
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