export interface OrderItem {
  product: string; // Product ID
  quantity: number;
  price: number;
  size?: string;
  notes?: string;
}

export interface Order {
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
  orderItems: OrderItem[];
  totalAmount: number;
  shippingAddress: string;
  orderDate: string;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  paymentMethod: 'COD' | 'Online';
  paymentStatus: 'Pending' | 'Completed' | 'Failed';
  deliveryDate?: string;
  trackingNumber?: string;
  deliveryPerson?: {
    _id: string;
    name: string;
    phone: string;
  };
  deliveryFee?: number;
  discountAmount?: number;
  taxAmount?: number;
  finalAmount?: number;
  notes?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  orderItems: {
    product: string;
    quantity: number;
    price: number;
    size?: string;
    notes?: string;
  }[];
  shippingAddress: string;
  paymentMethod: 'COD' | 'Online';
}

export interface UpdateOrderStatusRequest {
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  cancellationReason?: string;
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders?: number;
  shippedOrders?: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue?: number;
}

export interface OrdersResponse {
  success: boolean;
  message: string;
  orders: Order[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalOrders: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface OrderResponse {
  success: boolean;
  message: string;
  order: Order;
}

export interface OrderStatsResponse {
  success: boolean;
  message: string;
  stats: OrderStats;
}

// Cart related types
export interface CartItem {
  product: {
    _id: string;
    name: string;
    images: string[];
    price: number;
    availableQuantity: number;
    sizes: string[];
  };
  quantity: number;
  selectedSize?: string;
  notes?: string;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  storeId?: string;
  storeName?: string;
}
