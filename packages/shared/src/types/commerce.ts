export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export type PaymentMethod = "COD" | "BKASH" | "NAGAD" | "CARD";

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  displayOrder: number;
  productCount?: number;
}

export interface ProductImageDto {
  id: string;
  productId: string;
  storagePath: string | null;
  imageUrl: string;
  altText: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface InventoryDto {
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
}

export interface ProductDto {
  id: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string | null;
  description: string;
  price: number;
  salePrice: number | null;
  currency: string;
  categoryId: string;
  category?: CategoryDto;
  specifications?: Record<string, string | number | boolean> | null;
  isActive: boolean;
  isFeatured: boolean;
  images: ProductImageDto[];
  inventory?: InventoryDto | null;
  createdAt: string;
  updatedAt: string;
}

export interface AddressDto {
  id: string;
  userId: string;
  recipientName: string;
  phone: string;
  district: string;
  area: string;
  fullAddress: string;
  postalCode: string | null;
  label: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItemDto {
  id: string;
  cartId: string;
  productId: string;
  product: ProductDto;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartDto {
  id: string;
  userId: string;
  items: CartItemDto[];
  subtotal: number;
  itemCount: number;
  hasStockIssue?: boolean;
}

export interface WishlistItemDto {
  id: string;
  wishlistId: string;
  productId: string;
  product: ProductDto;
  createdAt: string;
}

export interface WishlistDto {
  id: string;
  userId: string;
  items: WishlistItemDto[];
}

export interface AddressSnapshot {
  recipientName: string;
  phone: string;
  district: string;
  area: string;
  fullAddress: string;
  postalCode?: string | null;
  label?: string;
}

export interface OrderItemDto {
  id: string;
  orderId: string;
  productId: string | null;
  productName: string;
  sku: string;
  productImage: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  createdAt: string;
}

export interface OrderDto {
  id: string;
  orderNumber: string;
  userId: string;
  addressSnapshot: AddressSnapshot;
  subtotal: number;
  shippingCharge: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  customerNotes: string | null;
  cancelReason: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItemDto[];
}

export interface ShippingCalculation {
  district: string;
  shippingCharge: number;
  isFreeShipping: boolean;
  estimatedDeliveryDays: string;
}

export interface AdminDashboardSummaryDto {
  totalSales: number;
  pendingSales: number;
  todaySales: number;
  todayOrdersCount: number;
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  activeProducts: number;
  lowStockProducts: number;
  totalCustomers: number;
}

export interface AdminRevenuePointDto {
  date: string;
  confirmedRevenue: number;
  pendingRevenue: number;
  orderCount: number;
}

export interface AdminTopProductDto {
  productId: string | null;
  productName: string;
  sku: string;
  productImage: string | null;
  unitsSold: number;
  revenue: number;
  currentStock: number;
  categoryName?: string;
}

export interface AdminCustomerDto {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  orderCount: number;
  totalSpent: number;
  createdAt: string;
}

export interface StoreSettingsDto {
  storeName: string;
  contactEmail: string;
  contactPhone: string;
  businessAddress: string;
  insideDhakaShipping: number;
  outsideDhakaShipping: number;
  freeShippingThreshold: number;
  lowStockThreshold: number;
  currency: string;
  operatingHours: string;
}

// ==========================================
// STAGE 3 STEP 2D.1: BUSINESS INTELLIGENCE
// ==========================================

export type AnalyticsPeriod =
  | "today"
  | "last_7_days"
  | "last_30_days"
  | "last_90_days"
  | "this_month"
  | "prev_month"
  | "this_year"
  | "custom";

export interface AnalyticsFilterParams {
  period?: AnalyticsPeriod;
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  orderStatus?: string;
  paymentMethod?: string;
  compare?: boolean;
}

export interface RevenueIntelligenceDto {
  grossOrderValue: number;
  collectedRevenue: number;
  pendingCodRevenue: number;
  averageOrderValue: number;
  totalOrders: number;
  cancelledOrders: number;
  comparison: {
    govChangePercent: number | null;
    govChangeAbsolute: number;
    collectedChangePercent: number | null;
    collectedChangeAbsolute: number;
    aovChangePercent: number | null;
    ordersChangePercent: number | null;
    previousPeriodLabel: string;
  };
  trendPoints: Array<{
    date: string;
    collected: number;
    gross: number;
    orders: number;
    previousCollected?: number;
    previousGross?: number;
  }>;
  paymentMethods: Array<{
    method: string;
    name: string;
    amount: number;
    count: number;
    sharePercentage: number;
  }>;
}

export interface CollectionPerformanceDto {
  collections: Array<{
    id: string;
    name: string;
    slug: string;
    imageUrl?: string | null;
    activeProducts: number;
    unitsSold: number;
    revenue: number;
    orderCount: number;
    sharePercentage: number;
    growthPercent: number | null;
  }>;
  leaderboard: Array<{
    rank: number;
    id: string;
    name: string;
    slug: string;
    revenue: number;
    unitsSold: number;
    orderCount: number;
  }>;
}

export interface InventoryHealthDto {
  totalActiveProducts: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalAvailableUnits: number;
  totalReservedUnits: number;
  categoryDistribution: Array<{
    categoryId: string;
    categoryName: string;
    availableUnits: number;
    productCount: number;
  }>;
  lowStockAlerts: Array<{
    productId: string;
    name: string;
    slug: string;
    sku: string;
    imageUrl?: string | null;
    availableStock: number;
    threshold: number;
    status: "LOW_STOCK" | "OUT_OF_STOCK";
    categoryName: string;
  }>;
  recommendations: Array<{
    productId: string;
    name: string;
    type: "low_stock" | "out_of_stock" | "high_velocity" | "no_sales";
    message: string;
    severity: "high" | "medium" | "info";
  }>;
}

export interface OrderFulfilmentDto {
  stages: Array<{
    status: OrderStatus;
    label: string;
    count: number;
    percentage: number;
    changeFromPreviousPercent: number | null;
  }>;
  cancellationRate: number;
  awaitingConfirmationCount: number;
  activeTransitCount: number;
}

export interface ProductLeaderboardDto {
  bestSelling: Array<{
    rank: number;
    productId: string;
    name: string;
    slug: string;
    sku: string;
    imageUrl?: string | null;
    categoryName: string;
    unitsSold: number;
    revenue: number;
    remainingStock: number;
  }>;
  topRevenue: Array<{
    rank: number;
    productId: string;
    name: string;
    slug: string;
    sku: string;
    imageUrl?: string | null;
    categoryName: string;
    unitsSold: number;
    revenue: number;
    remainingStock: number;
  }>;
  mostWishlisted: Array<{
    rank: number;
    productId: string;
    name: string;
    slug: string;
    sku: string;
    imageUrl?: string | null;
    wishlistCount: number;
    currentPrice: number;
    remainingStock: number;
  }>;
}

export interface CustomerInsightsDto {
  totalRegistered: number;
  newCustomersInPeriod: number;
  returningCustomersInPeriod: number;
  purchasingCustomersCount: number;
  repeatPurchaseRate: number;
  ordersPerCustomerAvg: number;
  districts: Array<{
    district: string;
    customerCount: number;
    orderCount: number;
    revenue: number;
    sharePercentage: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: "REGISTRATION" | "ORDER";
    customerName: string;
    timestamp: string;
    detail: string;
  }>;
}

export interface ConversionFunnelDto {
  trackingActivatedAt: string;
  totalSessions: number;
  productViews: number;
  addToCartEvents: number;
  checkoutStartedEvents: number;
  purchaseCompletedEvents: number;
  stages: Array<{
    stageName: string;
    eventCount: number;
    stepConversionRate: number;
    overallConversionRate: number;
    dropOffRate: number;
  }>;
  isHistoricalUnavailable: boolean;
}

export interface BusinessInsightDto {
  id: string;
  title: string;
  category: "opportunity" | "warning" | "performance" | "recommendation";
  summary: string;
  evidence: {
    metric: string;
    value: string | number;
    period: string;
    context?: string;
  };
  recommendedAction: string;
  destination: string;
  source: "ai-generated" | "rule-based";
  confidence: "high" | "medium" | "low";
  createdAt: string;
}

export interface AnalyticsOverviewDto {
  revenue: RevenueIntelligenceDto;
  collections: CollectionPerformanceDto;
  inventory: InventoryHealthDto;
  orders: OrderFulfilmentDto;
  products: ProductLeaderboardDto;
  customers: CustomerInsightsDto;
  funnel: ConversionFunnelDto;
  insights: BusinessInsightDto[];
}

export interface CreateAnalyticsEventDto {
  eventName:
    | "storefront_session_started"
    | "product_viewed"
    | "add_to_cart"
    | "checkout_started"
    | "purchase_completed"
    | "search_performed"
    | "category_viewed"
    | "wishlist_added";
  sessionId: string;
  userId?: string;
  productId?: string;
  categoryId?: string;
  metadata?: Record<string, any>;
}

export type PaymentProvider = "BKASH" | "SSLCOMMERZ" | "COD";

export interface PaymentTransactionDto {
  id: string;
  transactionRef: string;
  orderId: string | null;
  orderNumber?: string | null;
  userId: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  provider: "BKASH" | "SSLCOMMERZ" | "COD" | string;
  paymentMethod: PaymentMethod;
  providerTransactionId: string | null;
  providerSessionId: string | null;
  providerReference: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  verificationStatus: string;
  paymentDetails?: Record<string, any> | null;
  initiatedAt: string;
  completedAt: string | null;
  failedAt: string | null;
  createdAt: string;
  updatedAt: string;
  events?: PaymentEventDto[];
  refunds?: RefundDto[];
}

export interface PaymentEventDto {
  id: string;
  transactionId: string;
  eventType: string;
  provider: string;
  providerEventRef: string | null;
  status: string;
  verificationResult: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
}

export interface RefundDto {
  id: string;
  refundRef: string;
  transactionId: string;
  orderId: string | null;
  amount: number;
  currency: string;
  reason: string;
  providerRefundRef: string | null;
  status: string;
  initiatedBy: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface InitiatePaymentDto {
  orderId: string;
  provider: "BKASH" | "SSLCOMMERZ" | "COD";
  callbackUrl?: string;
}

export interface PaymentInitiationResultDto {
  transactionRef: string;
  provider: string;
  paymentUrl?: string;
  status: PaymentStatus;
  orderNumber: string;
  amount: number;
  currency: string;
  instructions?: string;
}

export interface ReconcilePaymentDto {
  transactionRef: string;
}

export interface ProcessRefundDto {
  transactionId: string;
  amount: number;
  reason: string;
}

export type PrintingStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "QUOTED"
  | "QUOTATION_ACCEPTED"
  | "QUOTATION_REJECTED"
  | "IN_PRODUCTION"
  | "COMPLETED"
  | "CANCELLED";

export type ProductionStage =
  | "3D_MODELING"
  | "MODEL_SLICING"
  | "PRINTING_STARTED"
  | "PRINT_CLEANUP_CURING"
  | "SURFACE_PRIMING"
  | "AIRBRUSH_BASE"
  | "DETAIL_HAND_PAINTING"
  | "CLEAR_COAT_FINISH"
  | "QUALITY_INSPECTION"
  | "PACKED_FOR_DELIVERY";

export interface PrintingReferenceImageDto {
  id: string;
  requestId: string;
  storagePath: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  description: string | null;
  downloadUrl?: string;
  createdAt: string;
}

export interface PrintingQuotationDto {
  id: string;
  requestId: string;
  quotationNumber: string;
  baseCost: number;
  materialCost: number;
  printingCost: number;
  finishingCost: number;
  paintingCost: number;
  customizationCost: number;
  shippingCost: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  depositPercent: number;
  depositAmount: number;
  productionDays: number;
  termsAndNotes: string | null;
  validUntil: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  acceptedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  orderId?: string | null;
  orderNumber?: string | null;
}

export interface ProductionUpdateDto {
  id: string;
  productionId: string;
  stage: ProductionStage | string;
  customerMessage: string;
  internalNote: string | null;
  progressImageUrl: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface PrintingProductionDto {
  id: string;
  requestId: string;
  orderId: string | null;
  orderNumber?: string | null;
  stage: ProductionStage | string;
  targetCompletionDate: string | null;
  actualCompletionDate: string | null;
  assignedTechnician: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  updates: ProductionUpdateDto[];
}

export interface PrintingRequestDto {
  id: string;
  requestNumber: string;
  userId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  title: string;
  animeName: string;
  characterName: string;
  description: string;
  posePreference: string | null;
  sizePreference: string | null;
  materialPreference: string | null;
  finishPreference: string | null;
  colorPreference: string | null;
  budgetEstimate: number | null;
  deadlineDate: string | null;
  customizationDetails: Record<string, any> | null;
  status: PrintingStatus | string;
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
  images: PrintingReferenceImageDto[];
  quotations: PrintingQuotationDto[];
  activeQuotation?: PrintingQuotationDto | null;
  production?: PrintingProductionDto | null;
}

export interface CreatePrintingRequestDto {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  title: string;
  animeName: string;
  characterName: string;
  description: string;
  posePreference?: string;
  sizePreference?: string;
  materialPreference?: string;
  finishPreference?: string;
  colorPreference?: string;
  budgetEstimate?: number;
  deadlineDate?: string;
  customizationDetails?: Record<string, any>;
}

export interface CreateQuotationDto {
  baseCost: number;
  materialCost: number;
  printingCost: number;
  finishingCost: number;
  paintingCost: number;
  customizationCost: number;
  shippingCost: number;
  discountAmount?: number;
  depositPercent?: number;
  productionDays: number;
  termsAndNotes?: string;
  validityDays?: number;
}

export interface CreateProductionUpdateDto {
  stage: ProductionStage | string;
  customerMessage: string;
  internalNote?: string;
  progressImageUrl?: string;
}



