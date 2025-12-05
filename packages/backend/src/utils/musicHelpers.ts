import mongoose from 'mongoose';

/**
 * Convert MongoDB document to API format
 * Converts _id to id and ensures proper serialization
 */
export function toApiFormat<T extends { _id?: mongoose.Types.ObjectId | string; [key: string]: any }>(
  doc: T | null | undefined
): (T & { id: string }) | null {
  if (!doc) return null;
  
  // Handle both Mongoose documents and plain objects
  const docObj = doc.toObject ? doc.toObject() : doc;
  const { _id, ...rest } = docObj;
  
  // Convert _id to id string
  let id: string;
  if (_id instanceof mongoose.Types.ObjectId) {
    id = _id.toString();
  } else if (_id) {
    id = String(_id);
  } else {
    id = '';
  }
  
  // Ensure timestamps are strings if they exist
  const result: any = {
    ...rest,
    id,
  };
  
  // Convert Date objects to ISO strings for timestamps
  if (result.createdAt instanceof Date) {
    result.createdAt = result.createdAt.toISOString();
  }
  if (result.updatedAt instanceof Date) {
    result.updatedAt = result.updatedAt.toISOString();
  }
  
  return result as T & { id: string };
}

/**
 * Convert array of MongoDB documents to API format
 */
export function toApiFormatArray<T extends { _id?: mongoose.Types.ObjectId | string; [key: string]: any }>(
  docs: T[]
): (T & { id: string })[] {
  return docs.map(doc => toApiFormat(doc)!).filter(Boolean);
}

