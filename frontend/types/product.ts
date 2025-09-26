export interface ProductSpecifications {
  material?: string;
  fit?: string;
  pattern?: string;
}

export interface ProductDetails {
  subcategory?: string;
  specifications?: ProductSpecifications;
  season?: string;
  isActive: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
}

export interface ProductData {
  name: string;
  description: string;
  category: string;
  subcategory: string;
  images: string[];
  price: string;
  sizes: string[]; // Multiple sizes selection
  availableQuantity: string; // Changed from quantity to match backend
  specifications?: ProductSpecifications;
  season?: string;
  isActive: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
}

export interface FormErrors {
  name?: string;
  category?: string;
  subcategory?: string;
  price?: string;
  availableQuantity?: string;
  images?: string;
  sizes?: string[];
}

export const PRODUCT_CATEGORIES = ['Men', 'Women', 'Kids', 'Unisex'] as const;

export const PRODUCT_SUBCATEGORIES = {
      'Men': ['Shirts', 'T-Shirts', 'Pants', 'Jeans', 'Shorts', 'Jackets', 'Suits', 'Coats'],
      'Women': ['Dresses', 'Tops', 'Sarees', 'Kurtas', 'Skirts', 'Leggings', 'Shirts', 'T-Shirts', 'Pants', 'Jeans', 
      'Shorts',  ],
      'Kids': ['Shirts', 'T-Shirts', 'Dresses', 'Tops', 'Skirts', 'Leggings', 'Jackets'],
      'Unisex': ['Jackets', 'Hoodies', 'Sweatshirts','Blazers']
} as const;

export const PRODUCT_MATERIALS = ['Cotton', 'Polyester', 'Silk', 'Wool', 'Linen','Leather'] as const;

export const PRODUCT_FITS = ['Slim Fit', 'Regular Fit', 'Loose Fit', 'Oversized'] as const;

export const PRODUCT_PATTERNS = ['Solid', 'Striped', 'Printed', 'Checkered'] as const;

export const PRODUCT_SEASONS = ['Summer', 'Winter', 'Monsoon', 'All Season'] as const;

export const PRODUCT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', 'Free Size'] as const;

// Full Product interface for API responses
export interface Product {
  _id: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  images: string[];
  price: number;
  sizes: string[];
  availableQuantity: number;
  specifications?: ProductSpecifications;
  season?: string;
  isActive: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  merchantId: {
    _id: string;
    name: string;
    email: string;
  };
  storeId: {
    _id: string;
    storeName: string;
    address: string;
    storeImages: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProductsResponse {
  success: boolean;
  message: string;
  products: Product[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalProducts: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Category and subcategory types for UI
export interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  subcategories: string[];
}

export interface FilterState {
  category: string | null;
  subcategory: string | null;
  priceRange: {
    min: number;
    max: number;
  };
  isBestSeller: boolean;
  isNewArrival: boolean;
}