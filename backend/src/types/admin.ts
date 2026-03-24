export interface Admin {
  _id: any;
  username: string;
  email: string;
  password?: string;
  phone?: string | null;
  isActive: boolean;
  lastLogin?: Date | null;
  otp?: any;
  createdAt: Date;
  updatedAt: Date;
}
