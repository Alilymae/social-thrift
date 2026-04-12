export type UserTier = 'basic' | 'premium';

export interface UserProfile {
  uid: string;
  displayName: string;
  displayNameLower?: string;
  photoURL: string;
  coverPhotoURL?: string;
  bio: string;
  favorites?: string[];
  followersCount?: number;
  followingCount?: number;
  tier: UserTier;
  generationCount?: number;
  lastGenerationAt?: string;
  sellerRating?: number;
  sellerReviewCount?: number;
  createdAt: string;
}

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: any;
}

export interface Listing {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerTier?: UserTier;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  status: 'available' | 'sold';
  qualityRating?: string;
  sellerRating?: number;
  createdAt: any;
}

export interface Order {
  id: string;
  buyerId: string;
  sellerId: string;
  listingId: string;
  title: string;
  price: number;
  imageUrl: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: any;
}

export interface Rating {
  id: string;
  orderId: string;
  reviewerId: string;
  targetUserId: string;
  rating: number; // 1-5
  comment: string;
  createdAt: any;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  text: string;
  createdAt: any;
}

export interface Garment {
  id: string;
  ownerId: string;
  imageUrl: string;
  category: string;
  tags: string[];
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  createdAt: any;
}

export interface OutfitItem {
  garmentId: string;
  imageUrl: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  scale: number;
  scaleX?: number;
  scaleY?: number;
  rotation: number;
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface Outfit {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  items: OutfitItem[];
  likesCount: number;
  commentsCount: number;
  isPublic: boolean;
  backgroundColor?: string;
  createdAt: any;
}

export interface Tutorial {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  title: string;
  description: string;
  videoUrl: string;
  tags: string[];
  likesCount?: number;
  commentsCount?: number;
  createdAt: any;
}

export interface SavedRecommendation {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  imageUrl: string;
  summary: string;
  isPublic: boolean;
  createdAt: any;
}
