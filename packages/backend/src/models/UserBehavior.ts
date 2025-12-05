import mongoose, { Schema, Document } from 'mongoose';

export interface PreferredPostTypes {
  text: number;
  image: number;
  video: number;
  poll: number;
}

export interface IUserBehavior extends Document {
  oxyUserId: string;
  preferredAuthors: string[]; // Array of author IDs
  preferredTopics: string[]; // Array of topic tags
  preferredPostTypes: PreferredPostTypes;
  activeHours: number[]; // Array of hours (0-23) when user is most active
  preferredLanguages: string[]; // Array of language codes
  createdAt: Date;
  updatedAt: Date;
}

const PreferredPostTypesSchema = new Schema<PreferredPostTypes>({
  text: { type: Number, default: 0 },
  image: { type: Number, default: 0 },
  video: { type: Number, default: 0 },
  poll: { type: Number, default: 0 },
}, { _id: false });

const UserBehaviorSchema = new Schema<IUserBehavior>({
  oxyUserId: { type: String, required: true, index: true, unique: true },
  preferredAuthors: [{ type: String }],
  preferredTopics: [{ type: String }],
  preferredPostTypes: { type: PreferredPostTypesSchema, default: () => ({
    text: 0,
    image: 0,
    video: 0,
    poll: 0
  }) },
  activeHours: [{ type: Number, min: 0, max: 23 }],
  preferredLanguages: [{ type: String }],
}, { timestamps: true, versionKey: false });

export const UserBehavior = mongoose.model<IUserBehavior>('UserBehavior', UserBehaviorSchema);

export default UserBehavior;

