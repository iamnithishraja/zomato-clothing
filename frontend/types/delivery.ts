export interface Delivery {
  _id: string;
  deliveryPerson: {
    _id: string;
    name: string;
    phone: string;
    email: string;
  };
  order: {
    _id: string;
    user: {
      _id: string;
      name: string;
      phone: string;
      email: string;
    };
    store: {
      _id: string;
      storeName: string;
      address: string;
      storeImages: string[];
    };
    orderItems: {
      product: {
        _id: string;
        name: string;
        images: string[];
        price: number;
      };
      quantity: number;
      price: number;
    }[];
    totalAmount: number;
    shippingAddress: string;
    orderDate: string;
    status: string;
    paymentMethod: string;
  };
  status: 'Pending' | 'Accepted' | 'PickedUp' | 'Delivered' | 'Cancelled';
  pickupAddress: string;
  deliveryAddress: string;
  estimatedDeliveryTime: string;
  actualDeliveryTime?: string;
  deliveryFee: number;
  rating?: number;
  review?: string;
  deliveryNotes?: string;
  cancellationReason?: string;
  failureReason?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeliveryRequest {
  order: string; // Order ID
  pickupAddress: string;
  deliveryAddress: string;
  estimatedDeliveryTime: string; // ISO string
  deliveryFee: number;
}

export interface UpdateDeliveryStatusRequest {
  status: 'Pending' | 'Accepted' | 'PickedUp' | 'Delivered' | 'Cancelled';
  deliveryNotes?: string;
  cancellationReason?: string;
}

export interface RateDeliveryRequest {
  rating: number; // 1-5
  review?: string;
}

export interface DeliveryStats {
  totalDeliveries: number;
  pendingDeliveries: number;
  acceptedDeliveries: number;
  pickedUpDeliveries: number;
  deliveredDeliveries: number;
  cancelledDeliveries: number;
  averageRating: number;
  totalEarnings: number;
}

export interface DeliveriesResponse {
  success: boolean;
  message: string;
  deliveries: Delivery[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalDeliveries: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface DeliveryResponse {
  success: boolean;
  message: string;
  delivery: Delivery;
}

export interface DeliveryStatsResponse {
  success: boolean;
  message: string;
  stats: DeliveryStats;
}

// Delivery person status
export interface DeliveryPersonStatus {
  isOnline: boolean;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  lastUpdated: string;
}
