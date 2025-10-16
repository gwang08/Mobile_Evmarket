export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  role?: string;
  isVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Seller {
  id: string;
  name: string;
  avatar: string;
  email?: string;
  phone?: string;
  bio?: string;
  isVerified?: boolean;
  createdAt?: string;
}

export interface SellerStats {
  totalProducts: number;
  totalSales: number;
  totalReviews: number;
  averageRating: number;
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  mediaUrls: string[];
  hasBeenEdited: boolean;
  createdAt: string;
  updatedAt: string;
  type: 'vehicle' | 'battery';
  productId: string;
  productTitle: string;
  buyer: {
    id: string;
    name: string;
    avatar: string;
  };
}

export interface SellerDetailResponse {
  message: string;
  data: {
    seller: Seller;
    reviews: Review[];
  };
}

export interface VehicleSpecifications {
  warranty: {
    basic: string;
    battery: string;
    drivetrain: string;
  };
  dimensions: {
    width: string;
    height: string;
    length: string;
    curbWeight: string;
  };
  performance: {
    topSpeed: string;
    motorType: string;
    horsepower: string;
    acceleration: string;
  };
  batteryAndCharging: {
    range: string;
    chargeTime: string;
    chargingSpeed: string;
    batteryCapacity: string;
  };
}

export interface Vehicle {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  status: 'AVAILABLE' | 'SOLD' | 'DELISTED';
  brand: string;
  model: string;
  year: number;
  mileage: number;
  specifications: VehicleSpecifications;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  sellerId: string;
  seller?: Seller;
}

export interface VehiclesResponse {
  message: string;
  data: {
    vehicles: Vehicle[];
    page?: number;
    limit?: number;
    totalPages?: number;
    totalResults?: number;
  };
}

export interface BatterySpecifications {
  weight: string;
  voltage: string;
  chemistry: string;
  degradation: string;
  chargingTime: string;
  installation: string;
  warrantyPeriod: string;
  temperatureRange: string;
}

export interface Battery {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  status: 'AVAILABLE' | 'SOLD' | 'DELISTED';
  brand: string;
  capacity: number;
  year: number;
  health: number | null;
  specifications: BatterySpecifications;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  sellerId: string;
  seller?: Seller;
}

export interface BatteriesResponse {
  message: string;
  data: {
    batteries: Battery[];
    page?: number;
    limit?: number;
    totalPages?: number;
    totalResults?: number;
  };
}

export interface VehicleDetailResponse {
  message: string;
  data: {
    vehicle: Vehicle;
  };
}

export interface BatteryDetailResponse {
  message: string;
  data: {
    battery: Battery;
  };
}

export interface Wallet {
  id: string;
  userId: string;
  availableBalance: number;
  lockedBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface WalletResponse {
  message: string;
  data: Wallet;
}

export interface DepositRequest {
  amount: number;
}

export interface DepositResponse {
  message: string;
  data: {
    partnerCode: string;
    orderId: string;
    requestId: string;
    amount: number;
    responseTime: number;
    message: string;
    resultCode: number;
    payUrl: string;
    deeplink: string;
    qrCodeUrl: string;
    deeplinkMiniApp: string;
  };
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: 'DEPOSIT' | 'WITHDRAW' | 'PAYMENT' | 'REFUND';
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  gateway?: string;
  gatewayTransId?: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface WalletHistoryResponse {
  message: string;
  data: {
    transactions: WalletTransaction[];
    page: number;
    limit: number;
    totalPages: number;
    totalResults: number;
  };
}

// Checkout Types
export interface CheckoutRequest {
  listingId: string;
  listingType: 'VEHICLE' | 'BATTERY';
  paymentMethod: 'MOMO' | 'WALLET';
}

export interface MoMoPaymentInfo {
  partnerCode: string;
  orderId: string;
  requestId: string;
  amount: number;
  responseTime: number;
  message: string;
  resultCode: number;
  payUrl: string;
  deeplink: string;
  qrCodeUrl: string;
  deeplinkMiniApp: string;
}

export interface CheckoutResponse {
  message: string;
  data: {
    transactionId: string;
    paymentInfo: MoMoPaymentInfo | null;
  };
}

// Transaction History Types
export interface Transaction {
  id: string;
  buyerId: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  vehicleId: string | null;
  batteryId: string | null;
  finalPrice: number;
  paymentGateway: 'MOMO' | 'WALLET';
  paymentDetail: any;
  createdAt: string;
  updatedAt: string;
  vehicle: {
    id: string;
    title: string;
    images: string[];
  } | null;
  battery: {
    id: string;
    title: string;
    images: string[];
  } | null;
  review: any;
}

export interface TransactionHistoryResponse {
  message: string;
  data: {
    transactions: Transaction[];
    page: number;
    limit: number;
    totalPages: number;
    totalResults: number;
  };
}

// Chatbot Types
export interface ChatbotRequest {
  question: string;
}

export interface ChatbotResponse {
  answer: string;
}