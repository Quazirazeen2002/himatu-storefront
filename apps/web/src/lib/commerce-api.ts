import type {
  CategoryDto,
  CategoryKind,
  FranchiseFamily,
  ProductDto,
  ProductImageDto,
  CartDto,
  WishlistDto,
  AddressDto,
  OrderDto,
  AdminDashboardSummaryDto,
  AdminRevenuePointDto,
  AdminTopProductDto,
  AdminCustomerDto,
  StoreSettingsDto,
  AnalyticsFilterParams,
  AnalyticsOverviewDto,
  RevenueIntelligenceDto,
  CollectionPerformanceDto,
  InventoryHealthDto,
  OrderFulfilmentDto,
  ProductLeaderboardDto,
  CustomerInsightsDto,
  ConversionFunnelDto,
  BusinessInsightDto,
  CreateAnalyticsEventDto,
  PaymentTransactionDto,
  PaymentInitiationResultDto,
  InitiatePaymentDto,
  RefundDto,
  PrintingRequestDto,
  CreatePrintingRequestDto,
  PrintingQuotationDto,
  CreateQuotationDto,
  PrintingProductionDto,
  ProductionStage,
  CreateProductionUpdateDto,
} from "@himatu/shared";

function getApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  // In the browser, default to same-origin relative URL so there are no mixed-content or CORS failures
  if (typeof window !== "undefined") {
    return "";
  }
  return process.env.API_URL || "http://localhost:4000";
}

export class CommerceApiError extends Error {
  constructor(message: string, public readonly status: number) { super(message); }
}

interface FetchOptions extends RequestInit {
  token?: string;
}

async function request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, headers = {}, ...rest } = options;

  const requestHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(headers as Record<string, string>),
  };

  if (token) {
    requestHeaders["Authorization"] = `Bearer ${token}`;
  }

  // Auto-detect JSON vs FormData
  if (!(rest.body instanceof FormData) && !requestHeaders["Content-Type"]) {
    requestHeaders["Content-Type"] = "application/json";
  }

  const base = getApiBase();
  const url = `${base}/api/v1${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const res = await fetch(url, {
    ...rest,
    headers: requestHeaders,
    cache: "no-store",
    signal: rest.signal || AbortSignal.timeout(rest.body instanceof FormData ? 90000 : 10000),
  });

  if (!res.ok) {
    let errMessage = `API error: ${res.status} ${res.statusText}`;
    try {
      const errorData = await res.json();
      errMessage = errorData.message || errorData.error || errMessage;
    } catch {}
    throw new CommerceApiError(errMessage, res.status);
  }

  return res.json();
}

// CATEGORIES
export async function getCategories(): Promise<CategoryDto[]> {
  return request<CategoryDto[]>("/categories");
}

// PRODUCTS
export interface ProductQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  productType?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "price_asc" | "price_desc" | "new" | "name";
  featured?: boolean;
}

export interface PaginatedProducts {
  items: ProductDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getProducts(query: ProductQuery = {}): Promise<PaginatedProducts> {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.search) params.set("search", query.search);
  if (query.category) params.set("category", query.category);
  if (query.productType) params.set("productType", query.productType);
  if (query.minPrice !== undefined) params.set("minPrice", String(query.minPrice));
  if (query.maxPrice !== undefined) params.set("maxPrice", String(query.maxPrice));
  if (query.sort) params.set("sort", query.sort);
  if (query.featured !== undefined) params.set("featured", String(query.featured));

  const qs = params.toString();
  return request<PaginatedProducts>(`/products${qs ? `?${qs}` : ""}`);
}

/** Load every API page so local search, filters and sixteen-item pagination see new products. */
export async function getAllProducts(): Promise<ProductDto[]> {
  const first = await getProducts({ limit: 50 });
  const items = [...first.items];
  for (let page = 2; page <= first.totalPages; page++) {
    items.push(...(await getProducts({ limit: 50, page })).items);
  }
  return items;
}

export async function getProductBySlug(slug: string): Promise<ProductDto> {
  return request<ProductDto>(`/products/${encodeURIComponent(slug)}`);
}

// ADMIN PRODUCTS
export async function getAdminProducts(token: string, query: ProductQuery = {}): Promise<PaginatedProducts> {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.search) params.set("search", query.search);
  if (query.category) params.set("category", query.category);
  if (query.productType) params.set("productType", query.productType);

  const qs = params.toString();
  return request<PaginatedProducts>(`/admin/products${qs ? `?${qs}` : ""}`, { token });
}

export async function getAllAdminProducts(token: string): Promise<ProductDto[]> {
  const first = await getAdminProducts(token, { limit: 100 });
  const items = [...first.items];
  for (let page = 2; page <= first.totalPages; page++) items.push(...(await getAdminProducts(token, { limit: 100, page })).items);
  return items;
}

export async function createAdminProduct(token: string, data: any): Promise<ProductDto> {
  return request<ProductDto>("/admin/products", {
    method: "POST",
    body: JSON.stringify(data),
    token,
  });
}

export async function updateAdminProduct(token: string, id: string, data: any): Promise<ProductDto> {
  return request<ProductDto>(`/admin/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
    token,
  });
}

export async function deleteAdminProduct(token: string, id: string): Promise<{success:boolean;id:string}> {
  return request(`/admin/products/${encodeURIComponent(id)}/permanent`, {method:"DELETE", token});
}

export async function archiveAdminProduct(token: string, id: string): Promise<ProductDto> {
  return request<ProductDto>(`/admin/products/${id}`, {
    method: "DELETE",
    token,
  });
}

export async function adjustAdminInventory(
  token: string,
  productId: string,
  quantity: number,
  reservedQuantity?: number,
) {
  return request(`/admin/inventory/${productId}/adjust`, {
    method: "POST",
    body: JSON.stringify({ quantity, reservedQuantity }),
    token,
  });
}

// ADMIN IMAGES
export async function uploadProductImages(
  token: string,
  productId: string,
  formData: FormData,
): Promise<ProductImageDto[]> {
  const files = formData.getAll("files");
  if (!files.length || files.length > 10) throw new Error("Choose between 1 and 10 photographs.");
  const uploaded: ProductImageDto[] = [];
  // One image per request keeps a multi-photo selection below proxy body limits.
  // Do not retry a completed image when a later image fails.
  for (const file of files) {
    const body = new FormData();
    body.append("files", file);
    for (const key of ["altText", "isPrimary"]) {
      const value = formData.get(key);
      if (value !== null && (key !== "isPrimary" || uploaded.length === 0)) body.append(key, value);
    }
    try {
      uploaded.push(...await request<ProductImageDto[]>(`/admin/products/${productId}/images`, { method: "POST", body, token }));
    } catch (error) {
      throw new Error(`${uploaded.length} of ${files.length} photographs uploaded. ${error instanceof Error ? error.message : "Upload failed."} Reloaded photographs remain saved; select only the remaining files to retry.`);
    }
  }
  return uploaded;
}

export async function updateProductImage(
  token: string,
  productId: string,
  imageId: string,
  data: { altText?: string; isPrimary?: boolean },
): Promise<ProductImageDto> {
  return request<ProductImageDto>(`/admin/products/${productId}/images/${imageId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
    token,
  });
}

export async function reorderProductImages(
  token: string,
  productId: string,
  items: Array<{ imageId: string; sortOrder: number }>,
) {
  return request(`/admin/products/${productId}/images/reorder`, {
    method: "PATCH",
    body: JSON.stringify({ items }),
    token,
  });
}

export async function deleteProductImage(token: string, productId: string, imageId: string) {
  return request(`/admin/products/${productId}/images/${imageId}`, {
    method: "DELETE",
    token,
  });
}

// CART
export async function getCart(token: string): Promise<CartDto> {
  return request<CartDto>("/cart", { token });
}

export async function addCartItem(token: string, productId: string, quantity = 1): Promise<CartDto> {
  return request<CartDto>("/cart/items", {
    method: "POST",
    body: JSON.stringify({ productId, quantity }),
    token,
  });
}

export async function updateCartItem(token: string, itemId: string, quantity: number): Promise<CartDto> {
  return request<CartDto>(`/cart/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
    token,
  });
}

export async function removeCartItem(token: string, itemId: string): Promise<CartDto> {
  return request<CartDto>(`/cart/items/${itemId}`, {
    method: "DELETE",
    token,
  });
}

export async function clearCart(token: string): Promise<{ success: boolean }> {
  return request("/cart", {
    method: "DELETE",
    token,
  });
}

// WISHLIST
export async function getWishlist(token: string): Promise<WishlistDto> {
  return request<WishlistDto>("/wishlist", { token });
}

export async function addWishlistItem(token: string, productId: string): Promise<WishlistDto> {
  return request<WishlistDto>("/wishlist/items", {
    method: "POST",
    body: JSON.stringify({ productId }),
    token,
  });
}

export async function removeWishlistItem(token: string, productId: string): Promise<WishlistDto> {
  return request<WishlistDto>(`/wishlist/items/${productId}`, {
    method: "DELETE",
    token,
  });
}

// ADDRESSES
export async function getAddresses(token: string): Promise<AddressDto[]> {
  return request<AddressDto[]>("/addresses", { token });
}

export async function createAddress(token: string, data: any): Promise<AddressDto> {
  return request<AddressDto>("/addresses", {
    method: "POST",
    body: JSON.stringify(data),
    token,
  });
}

export async function updateAddress(token: string, id: string, data: any): Promise<AddressDto> {
  return request<AddressDto>(`/addresses/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
    token,
  });
}

export async function deleteAddress(token: string, id: string): Promise<{ success: boolean }> {
  return request(`/addresses/${id}`, {
    method: "DELETE",
    token,
  });
}

export async function setDefaultAddress(token: string, id: string): Promise<AddressDto> {
  return request<AddressDto>(`/addresses/${id}/default`, {
    method: "PATCH",
    token,
  });
}

// ORDERS
export async function createOrder(
  token: string,
  data: { addressId: string; paymentMethod: string; customerNotes?: string },
): Promise<OrderDto> {
  return request<OrderDto>("/orders", {
    method: "POST",
    body: JSON.stringify(data),
    token,
  });
}

export async function getOrders(token: string): Promise<OrderDto[]> {
  return request<OrderDto[]>("/orders", { token });
}

export async function getOrderByNumber(token: string, orderNumber: string): Promise<OrderDto> {
  return request<OrderDto>(`/orders/${encodeURIComponent(orderNumber)}`, { token });
}

export async function cancelOrder(token: string, orderNumber: string, reason: string): Promise<OrderDto> {
  return request<OrderDto>(`/orders/${encodeURIComponent(orderNumber)}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason }),
    token,
  });
}

// ADMIN DASHBOARD & MANAGEMENT
export async function getAdminDashboardSummary(
  token: string,
  period = "all",
): Promise<AdminDashboardSummaryDto> {
  return request<AdminDashboardSummaryDto>(
    `/admin/dashboard/summary?period=${encodeURIComponent(period)}`,
    { token },
  );
}

export async function getAdminRevenue(
  token: string,
  period = "30d",
): Promise<AdminRevenuePointDto[]> {
  return request<AdminRevenuePointDto[]>(
    `/admin/dashboard/revenue?period=${encodeURIComponent(period)}`,
    { token },
  );
}

export async function getAdminTopProducts(
  token: string,
  limit = 5,
): Promise<AdminTopProductDto[]> {
  return request<AdminTopProductDto[]>(
    `/admin/dashboard/top-products?limit=${limit}`,
    { token },
  );
}

export async function getAdminOrders(
  token: string,
  query: { page?: number; limit?: number; status?: string; search?: string } = {},
): Promise<{ items: OrderDto[]; total: number; page: number; limit: number; totalPages: number }> {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.status && query.status !== "ALL") params.set("status", query.status);
  if (query.search) params.set("search", query.search);

  const qs = params.toString();
  return request(`/admin/orders${qs ? `?${qs}` : ""}`, { token });
}

export async function updateAdminOrderStatus(
  token: string,
  orderId: string,
  status: string,
  reason?: string,
): Promise<OrderDto> {
  return request<OrderDto>(`/admin/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, reason }),
    token,
  });
}

export async function getAdminCustomers(
  token: string,
  query: { page?: number; limit?: number; search?: string } = {},
): Promise<{ items: AdminCustomerDto[]; total: number; page: number; limit: number; totalPages: number }> {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.search) params.set("search", query.search);

  const qs = params.toString();
  return request(`/admin/customers${qs ? `?${qs}` : ""}`, { token });
}

export async function getAdminCustomerDetail(token: string, id: string) {
  return request(`/admin/customers/${id}`, { token });
}

export async function getAdminSettings(token: string): Promise<StoreSettingsDto> {
  return request<StoreSettingsDto>("/admin/settings", { token });
}

export async function updateAdminSettings(
  token: string,
  settings: Partial<StoreSettingsDto>,
): Promise<StoreSettingsDto> {
  return request<StoreSettingsDto>("/admin/settings", {
    method: "PATCH",
    body: JSON.stringify(settings),
    token,
  });
}

export async function createAdminCategory(
  token: string,
  data: { name: string; slug: string; description?: string | null; imageUrl?: string | null; displayOrder?: number; isActive?: boolean; kind?: CategoryKind; family?: FranchiseFamily | null; imageIsDemo?: boolean },
): Promise<CategoryDto> {
  return request<CategoryDto>("/admin/categories", {
    method: "POST",
    body: JSON.stringify(data),
    token,
  });
}

export async function updateAdminCategory(
  token: string,
  id: string,
  data: Partial<{ name: string; slug: string; description?: string | null; imageUrl?: string | null; isActive?: boolean; displayOrder?: number; kind?: CategoryKind; family?: FranchiseFamily | null; imageIsDemo?: boolean }>,
): Promise<CategoryDto> {
  return request<CategoryDto>(`/admin/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
    token,
  });
}

// ==========================================
// STAGE 3 STEP 2D.1: ANALYTICS & INSIGHTS API
// ==========================================

export async function getAnalyticsOverview(
  token: string,
  params: AnalyticsFilterParams = {},
): Promise<AnalyticsOverviewDto> {
  const qs = new URLSearchParams();
  if (params.period) qs.set("period", params.period);
  if (params.startDate) qs.set("startDate", params.startDate);
  if (params.endDate) qs.set("endDate", params.endDate);
  if (params.categoryId) qs.set("categoryId", params.categoryId);
  if (params.orderStatus) qs.set("orderStatus", params.orderStatus);
  if (params.paymentMethod) qs.set("paymentMethod", params.paymentMethod);
  const qStr = qs.toString();
  return request<AnalyticsOverviewDto>(`/admin/analytics/overview${qStr ? `?${qStr}` : ""}`, { token });
}

export async function getRevenueIntelligence(
  token: string,
  params: AnalyticsFilterParams = {},
): Promise<RevenueIntelligenceDto> {
  const qs = new URLSearchParams();
  if (params.period) qs.set("period", params.period);
  if (params.startDate) qs.set("startDate", params.startDate);
  if (params.endDate) qs.set("endDate", params.endDate);
  const qStr = qs.toString();
  return request<RevenueIntelligenceDto>(`/admin/analytics/revenue${qStr ? `?${qStr}` : ""}`, { token });
}

export async function getCollectionPerformance(
  token: string,
  params: AnalyticsFilterParams = {},
): Promise<CollectionPerformanceDto> {
  const qs = new URLSearchParams();
  if (params.period) qs.set("period", params.period);
  const qStr = qs.toString();
  return request<CollectionPerformanceDto>(`/admin/analytics/collections${qStr ? `?${qStr}` : ""}`, { token });
}

export async function getInventoryHealth(token: string, threshold = 5): Promise<InventoryHealthDto> {
  return request<InventoryHealthDto>(`/admin/analytics/inventory?threshold=${threshold}`, { token });
}

export async function getOrderFulfilment(
  token: string,
  params: AnalyticsFilterParams = {},
): Promise<OrderFulfilmentDto> {
  const qs = new URLSearchParams();
  if (params.period) qs.set("period", params.period);
  const qStr = qs.toString();
  return request<OrderFulfilmentDto>(`/admin/analytics/orders${qStr ? `?${qStr}` : ""}`, { token });
}

export async function getProductLeaderboard(
  token: string,
  params: AnalyticsFilterParams = {},
): Promise<ProductLeaderboardDto> {
  const qs = new URLSearchParams();
  if (params.period) qs.set("period", params.period);
  const qStr = qs.toString();
  return request<ProductLeaderboardDto>(`/admin/analytics/products${qStr ? `?${qStr}` : ""}`, { token });
}

export async function getCustomerInsights(
  token: string,
  params: AnalyticsFilterParams = {},
): Promise<CustomerInsightsDto> {
  const qs = new URLSearchParams();
  if (params.period) qs.set("period", params.period);
  const qStr = qs.toString();
  return request<CustomerInsightsDto>(`/admin/analytics/customers${qStr ? `?${qStr}` : ""}`, { token });
}

export async function getConversionFunnel(
  token: string,
  params: AnalyticsFilterParams = {},
): Promise<ConversionFunnelDto> {
  const qs = new URLSearchParams();
  if (params.period) qs.set("period", params.period);
  const qStr = qs.toString();
  return request<ConversionFunnelDto>(`/admin/analytics/funnel${qStr ? `?${qStr}` : ""}`, { token });
}

export async function getBusinessInsights(
  token: string,
  params: AnalyticsFilterParams = {},
): Promise<BusinessInsightDto[]> {
  const qs = new URLSearchParams();
  if (params.period) qs.set("period", params.period);
  const qStr = qs.toString();
  return request<BusinessInsightDto[]>(`/admin/analytics/insights${qStr ? `?${qStr}` : ""}`, { token });
}

export async function regenerateBusinessInsights(
  token: string,
  params: AnalyticsFilterParams = {},
): Promise<BusinessInsightDto[]> {
  return request<BusinessInsightDto[]>("/admin/analytics/insights/generate", {
    method: "POST",
    body: JSON.stringify(params),
    token,
  });
}

export async function postAnalyticsEvent(dto: CreateAnalyticsEventDto): Promise<{ status: string }> {
  return request<{ status: string }>("/analytics/events", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

// ==================== PAYMENTS (CUSTOMER) ====================

export async function initiatePayment(
  dto: InitiatePaymentDto,
  token?: string,
): Promise<PaymentInitiationResultDto> {
  return request<PaymentInitiationResultDto>("/payments/initiate", {
    method: "POST",
    body: JSON.stringify(dto),
    token,
  });
}

export async function getTransaction(ref: string): Promise<PaymentTransactionDto> {
  return request<PaymentTransactionDto>(`/payments/${ref}`);
}

// ==================== PAYMENTS (ADMIN) ====================

export async function getAdminPayments(
  token: string,
  params: { page?: number; limit?: number; status?: string; provider?: string; search?: string } = {},
): Promise<{ items: PaymentTransactionDto[]; total: number; page: number; limit: number }> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.status) qs.set("status", params.status);
  if (params.provider) qs.set("provider", params.provider);
  if (params.search) qs.set("search", params.search);
  const qStr = qs.toString();
  return request<{ items: PaymentTransactionDto[]; total: number; page: number; limit: number }>(
    `/admin/payments${qStr ? `?${qStr}` : ""}`,
    { token },
  );
}

export async function getAdminPaymentSummary(token: string) {
  return request<any>("/admin/payments/summary", { token });
}

export async function reconcilePayment(token: string, id: string) {
  return request<any>(`/admin/payments/${id}/reconcile`, {
    method: "POST",
    token,
  });
}

export async function refundPayment(
  token: string,
  id: string,
  data: { amount: number; reason: string },
): Promise<RefundDto> {
  return request<RefundDto>(`/admin/payments/${id}/refund`, {
    method: "POST",
    body: JSON.stringify(data),
    token,
  });
}

export async function getAdminRefunds(
  token: string,
  params: { page?: number; limit?: number; search?: string } = {},
): Promise<{ items: RefundDto[]; total: number; page: number; limit: number }> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.search) qs.set("search", params.search);
  const qStr = qs.toString();
  return request<{ items: RefundDto[]; total: number; page: number; limit: number }>(
    `/admin/refunds${qStr ? `?${qStr}` : ""}`,
    { token },
  );
}

// ==================== 3D PRINTING (CUSTOMER) ====================

export async function createPrintingRequest(
  dto: CreatePrintingRequestDto,
  token?: string,
): Promise<PrintingRequestDto> {
  return request<PrintingRequestDto>("/printing/requests", {
    method: "POST",
    body: JSON.stringify(dto),
    token,
  });
}

export async function uploadPrintingImage(
  requestId: string,
  file: File,
  description?: string,
  token?: string,
): Promise<any> {
  const formData = new FormData();
  formData.append("file", file);
  if (description) formData.append("description", description);

  return request<any>(`/printing/requests/${requestId}/images`, {
    method: "POST",
    body: formData,
    token,
  });
}

export async function getMyPrintingRequests(token: string): Promise<PrintingRequestDto[]> {
  return request<PrintingRequestDto[]>("/printing/requests/my-requests", { token });
}

export async function getPrintingRequest(id: string, token?: string): Promise<PrintingRequestDto> {
  return request<PrintingRequestDto>(`/printing/requests/${id}`, { token });
}

export async function approvePrintingQuotation(
  id: string,
  token: string,
  addressId?: string,
): Promise<{
  orderId: string;
  orderNumber: string;
  quotationNumber: string;
  depositAmount: number;
  totalAmount: number;
}> {
  return request<{
    orderId: string;
    orderNumber: string;
    quotationNumber: string;
    depositAmount: number;
    totalAmount: number;
  }>(`/printing/requests/${id}/approve-quotation`, {
    method: "POST",
    body: JSON.stringify({ addressId }),
    token,
  });
}

export async function rejectPrintingQuotation(
  id: string,
  reason?: string,
  token?: string,
): Promise<{ status: string; quotationNumber: string }> {
  return request<{ status: string; quotationNumber: string }>(
    `/printing/requests/${id}/reject-quotation`,
    {
      method: "POST",
      body: JSON.stringify({ reason }),
      token,
    },
  );
}

// ==================== 3D PRINTING & PRODUCTION (ADMIN) ====================

export async function getAdminPrintingRequests(
  token: string,
  params: { page?: number; limit?: number; status?: string; search?: string } = {},
): Promise<{ items: PrintingRequestDto[]; total: number; page: number; limit: number }> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.status) qs.set("status", params.status);
  if (params.search) qs.set("search", params.search);
  const qStr = qs.toString();
  return request<{ items: PrintingRequestDto[]; total: number; page: number; limit: number }>(
    `/admin/printing/requests${qStr ? `?${qStr}` : ""}`,
    { token },
  );
}

export async function getAdminPrintingRequest(token: string, id: string): Promise<PrintingRequestDto> {
  return request<PrintingRequestDto>(`/admin/printing/requests/${id}`, { token });
}

export async function updateAdminPrintingStatus(
  token: string,
  id: string,
  status: string,
  internalNotes?: string,
): Promise<PrintingRequestDto> {
  return request<PrintingRequestDto>(`/admin/printing/requests/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, internalNotes }),
    token,
  });
}

export async function createAdminPrintingQuotation(
  token: string,
  id: string,
  dto: CreateQuotationDto,
): Promise<PrintingQuotationDto> {
  return request<PrintingQuotationDto>(`/admin/printing/requests/${id}/quotation`, {
    method: "POST",
    body: JSON.stringify(dto),
    token,
  });
}

export async function getAdminProductionBoard(token: string) {
  return request<{
    stages: ProductionStage[];
    totalActive: number;
    columns: Record<string, any[]>;
  }>("/admin/printing/production", { token });
}

export async function updateAdminProductionStage(
  token: string,
  id: string,
  data: { stage: ProductionStage; notes?: string; assignedTechnician?: string },
): Promise<PrintingProductionDto> {
  return request<PrintingProductionDto>(`/admin/printing/production/${id}/stage`, {
    method: "PATCH",
    body: JSON.stringify(data),
    token,
  });
}

export async function addAdminProductionUpdate(
  token: string,
  id: string,
  dto: CreateProductionUpdateDto,
) {
  return request<any>(`/admin/printing/production/${id}/updates`, {
    method: "POST",
    body: JSON.stringify(dto),
    token,
  });
}





export async function getAdminCategories(token: string): Promise<CategoryDto[]> { return request<CategoryDto[]>("/admin/categories", { token }); }
export async function uploadCategoryImage(token: string, id: string, file: File, imageIsDemo = false): Promise<CategoryDto> {
  const body = new FormData(); body.append("file", file); body.append("imageIsDemo", String(imageIsDemo));
  return request<CategoryDto>(`/admin/categories/${id}/image`, { method: "POST", body, token });
}

export { request as commerceRequest };

export async function getInvoicePdfUrl(token: string, orderId: string) {
  const response = await fetch(`${getApiBase()}/api/v1/admin/invoices/${encodeURIComponent(orderId)}/pdf`, {
    headers: {Authorization:`Bearer ${token}`}, cache:"no-store",
  });
  if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.message || "Invoice download failed"); }
  return URL.createObjectURL(await response.blob());
}
export async function downloadInvoicePdf(token: string, orderId: string) {
  const url = await getInvoicePdfUrl(token, orderId);
  const link = document.createElement("a"); link.href = url; link.download = `HIMATU-Invoice-${orderId}.pdf`; document.body.appendChild(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
