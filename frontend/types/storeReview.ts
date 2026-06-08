export interface StoreReviewItem {
  _id: string;
  orderNumber?: string;
  rating: number;
  review?: string;
  ratedAt: string;
  userName: string;
}

export interface StoreReviewsResponse {
  success: boolean;
  message: string;
  rating: {
    average: number;
    totalReviews: number;
  };
  reviews: StoreReviewItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalReviews: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface PendingStoreReviewOrder {
  _id: string;
  orderNumber?: string;
  store: {
    _id: string;
    storeName: string;
    storeImages?: string[];
    address?: string;
  };
  totalAmount: number;
  deliveryDate?: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  storeRated?: boolean;
}

export interface PendingStoreReviewsResponse {
  success: boolean;
  message: string;
  totalPending: number;
  orders: PendingStoreReviewOrder[];
}

export interface RateStoreRequest {
  orderId: string;
  rating: number;
  review?: string;
}

export interface RateStoreResponse {
  success: boolean;
  message: string;
  storeRating: {
    average: number;
    totalReviews: number;
  };
  order: {
    _id: string;
    storeRated: boolean;
    storeRating: number;
    storeReview?: string;
    storeRatedAt: string;
  };
}
