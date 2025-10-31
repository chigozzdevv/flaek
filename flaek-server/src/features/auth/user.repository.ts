import { UserModel, UserDocument } from '@/features/auth/user.model';

export const userRepository = {
  async findByEmail(email: string) {
    return UserModel.findOne({ email }).exec();
  },
  async findById(id: string) {
    return UserModel.findById(id).exec();
  },
  async findByValidResetToken(token: string) {
    return UserModel.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: new Date() } }).exec();
  },
  async create(data: Partial<UserDocument>) {
    const user = new UserModel(data);
    return user.save();
  },
  async setTotp(userId: string, enabled: boolean, secret?: string) {
    return UserModel.findByIdAndUpdate(userId, { totpEnabled: enabled, totpSecret: secret }, { new: true }).exec();
  },
  async resetTotpSecret(userId: string, secret: string) {
    return UserModel.findByIdAndUpdate(userId, { totpEnabled: false, totpSecret: secret }, { new: true }).exec();
  },
  async disableTotp(userId: string) {
    return UserModel.findByIdAndUpdate(userId, { totpEnabled: false, totpSecret: undefined }, { new: true }).exec();
  },
  async updatePassword(userId: string, passwordHash: string) {
    return UserModel.findByIdAndUpdate(userId, { passwordHash }, { new: true }).exec();
  },
  async setResetPassword(userId: string, token: string, expiresAt: Date) {
    return UserModel.findByIdAndUpdate(userId, { resetPasswordToken: token, resetPasswordExpires: expiresAt }, { new: true }).exec();
  },
  async clearResetPassword(userId: string) {
    return UserModel.findByIdAndUpdate(userId, { resetPasswordToken: undefined, resetPasswordExpires: undefined }, { new: true }).exec();
  },
};
