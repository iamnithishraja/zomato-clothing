export interface StoreContact {
  phone?: string;
  email?: string;
  website?: string;
}

export interface StoreWorkingDays {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
}

export interface StoreRating {
  average: number;
  totalReviews: number;
}

export interface StoreMerchant {
  _id: string;
  name: string;
  email: string;
}

export interface Store {
  _id: string;
  storeName: string;
  description: string;
  storeImages: string[];
  address: string;
  mapLink: string;
  contact: StoreContact;
  workingDays: StoreWorkingDays;
  rating: StoreRating;
  isActive: boolean;
  merchantId: StoreMerchant;
  createdAt: string;
  updatedAt: string;
}

export interface StoresResponse {
  success: boolean;
  message: string;
  stores: Store[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalStores: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface BestSellerStoresResponse {
  success: boolean;
  message: string;
  stores: Store[];
}

// Location types
export interface Location {
  id: string;
  name: string;
  city: string;
  state: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface LocationState {
  selectedLocation: Location | null;
  availableLocations: Location[];
  isLoading: boolean;
}
