// types/user.ts
// データモデル設計書（02_data-model.md）に基づく型定義

export interface User {
  uid: string;
  email: string;
  displayName: string;
  createdAt: Date;
  lastLoginAt: Date;
}

// Firestore保存用の型（Date → Timestamp変換前）
export interface UserDocument {
  email: string | null;
  displayName: string | null;
  createdAt?: Date;
  lastLoginAt: Date;
}
