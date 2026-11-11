import "reflect-metadata";
import { Test, TestingModule } from "@nestjs/testing";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { CartService } from "../src/cart/cart.service";
import { WishlistService } from "../src/wishlist/wishlist.service";
import { AddressesService } from "../src/addresses/addresses.service";
import { OrdersService } from "../src/orders/orders.service";
import { ShippingService } from "../src/shipping/shipping.service";
import { PrismaService } from "../src/prisma/prisma.service";

describe("Phase B: Cart, Wishlist, Addresses, Checkout & Orders", () => {
  const userId = "user-1111-1111-1111";
  const otherUserId = "user-2222-2222-2222";

  const mockProduct = {
    id: "prod-1111",
    name: "Luffy · Gear Five",
    slug: "straw-hat-captain",
    sku: "HMT-OP-001",
    price: 6500,
    salePrice: 5900,
    currency: "BDT",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    images: [{ id: "img-1", imageUrl: "https://test.supabase.co/img.jpg", isPrimary: true }],
    inventory: {
      id: "inv-1",
      productId: "prod-1111",
      quantity: 10,
      reservedQuantity: 0,
    },
  };

  const mockAddress = {
    id: "addr-1111",
    userId,
    recipientName: "Razeen Jubair",
    phone: "01711111111",
    district: "Dhaka",
    area: "Gulshan",
    fullAddress: "Road 10, House 5",
    postalCode: "1212",
    label: "HOME",
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let cartService: CartService;
  let wishlistService: WishlistService;
  let addressesService: AddressesService;
  let ordersService: OrdersService;
  let shippingService: ShippingService;

  const mockCart = {
    id: "cart-1111",
    userId,
    items: [
      {
        id: "item-1111",
        cartId: "cart-1111",
        productId: mockProduct.id,
        quantity: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
        product: mockProduct,
      },
    ],
  };

  const mockPrisma = {
    db: {
      cart: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.userId === userId) return Promise.resolve(mockCart);
          return Promise.resolve(null);
        }),
        create: jest.fn().mockResolvedValue(mockCart),
      },
      cartItem: {
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockImplementation(({ where }) => {
          return Promise.resolve(mockCart.items[0]);
        }),
        create: jest.fn().mockResolvedValue(mockCart.items[0]),
        update: jest.fn().mockImplementation(({ data }) => ({
          ...mockCart.items[0],
          ...data,
        })),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      wishlist: {
        findUnique: jest.fn().mockResolvedValue({ id: "wish-1", userId, items: [] }),
        create: jest.fn().mockResolvedValue({ id: "wish-1", userId, items: [] }),
      },
      wishlistItem: {
        upsert: jest.fn().mockResolvedValue({ id: "wi-1" }),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      address: {
        findMany: jest.fn().mockResolvedValue([mockAddress]),
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === mockAddress.id) return Promise.resolve(mockAddress);
          return Promise.resolve(null);
        }),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockAddress),
        update: jest.fn().mockImplementation(({ data }) => ({
          ...mockAddress,
          ...data,
        })),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        delete: jest.fn().mockResolvedValue(mockAddress),
      },
      product: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === mockProduct.id) return Promise.resolve(mockProduct);
          return Promise.resolve(null);
        }),
      },
      inventory: {
        findUnique: jest.fn().mockResolvedValue(mockProduct.inventory),
        update: jest.fn().mockResolvedValue(mockProduct.inventory),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      order: {
        create: jest.fn().mockImplementation(({ data }) => {
          return Promise.resolve({
            id: "ord-1111",
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
            items: data.items.create,
          });
        }),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue({
          id: "ord-1111",
          orderNumber: "HMT-20261108-12345",
          userId,
          addressSnapshot: mockAddress,
          subtotal: 11800,
          shippingCharge: 80,
          discountAmount: 0,
          totalAmount: 11880,
          currency: "BDT",
          orderStatus: "PENDING",
          paymentStatus: "PENDING",
          paymentMethod: "COD",
          customerNotes: "Handle with care",
          items: [
            {
              id: "oi-1",
              orderId: "ord-1111",
              productId: mockProduct.id,
              productName: mockProduct.name,
              sku: mockProduct.sku,
              unitPrice: 5900,
              quantity: 2,
              lineTotal: 11800,
              createdAt: new Date(),
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        update: jest.fn().mockImplementation(({ data }) => ({
          id: "ord-1111",
          orderNumber: "HMT-20261108-12345",
          userId,
          ...data,
          items: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      },
      $transaction: jest.fn().mockImplementation(async (cb) => cb(mockPrisma.db)),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        WishlistService,
        AddressesService,
        OrdersService,
        ShippingService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    cartService = module.get<CartService>(CartService);
    wishlistService = module.get<WishlistService>(WishlistService);
    addressesService = module.get<AddressesService>(AddressesService);
    ordersService = module.get<OrdersService>(OrdersService);
    shippingService = module.get<ShippingService>(ShippingService);
  });

  describe("Shipping Calculation Engine", () => {
    it("should charge ৳80 inside Dhaka", () => {
      const result = shippingService.calculateShipping("Dhaka", 5000);
      expect(result.shippingCharge).toBe(80);
      expect(result.isFreeShipping).toBe(false);
    });

    it("should charge ৳130 outside Dhaka", () => {
      const result = shippingService.calculateShipping("Chittagong", 5000);
      expect(result.shippingCharge).toBe(130);
      expect(result.isFreeShipping).toBe(false);
    });

    it("should give free shipping for orders at or above ৳15,000 threshold", () => {
      const result = shippingService.calculateShipping("Sylhet", 16000);
      expect(result.shippingCharge).toBe(0);
      expect(result.isFreeShipping).toBe(true);
    });
  });

  describe("Persistent Cart Service", () => {
    it("should calculate correct subtotal and stock availability", async () => {
      const cart = await cartService.getCustomerCart(userId);
      expect(cart.userId).toBe(userId);
      expect(cart.subtotal).toBe(11800); // 2 * salePrice (5900)
      expect(cart.itemCount).toBe(2);
      expect(cart.hasStockIssue).toBe(false);
    });

    it("should reject adding more items than available stock", async () => {
      await expect(
        cartService.addItem(userId, mockProduct.id, 25), // available is 10
      ).rejects.toThrow(ConflictException);
    });

    it("should reject non-positive quantities", async () => {
      await expect(
        cartService.addItem(userId, mockProduct.id, 0),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("Address Ownership & Defaults", () => {
    it("should prevent modifying another customer's address", async () => {
      await expect(
        addressesService.updateAddress(otherUserId, mockAddress.id, {
          recipientName: "Hacker",
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it("should prevent deleting another customer's address", async () => {
      await expect(
        addressesService.deleteAddress(otherUserId, mockAddress.id),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("Order Creation & Concurrency Safety", () => {
    it.each(["COD", "CARD", "NAGAD"])("rejects new %s orders", async paymentMethod => {
      await expect(ordersService.createOrder(userId,{addressId:mockAddress.id,paymentMethod})).rejects.toThrow("Only bKash is available");
    });
    it("should atomically create order, snapshot address, deduct stock, and clear cart", async () => {
      const order = await ordersService.createOrder(userId, {
        addressId: mockAddress.id,
        paymentMethod: "BKASH",
        customerNotes: "Please call before delivery",
      });

      expect(order.userId).toBe(userId);
      expect(order.orderNumber).toMatch(/^HMT-\d{8}-\d{5}$/);
      expect(order.subtotal).toBe(11800);
      expect(order.shippingCharge).toBe(80); // Dhaka
      expect(order.totalAmount).toBe(11880);
      expect(order.paymentMethod).toBe("BKASH");
      expect(order.paymentStatus).toBe("PENDING");
      expect(order.orderStatus).toBe("PENDING");
      expect(order.addressSnapshot.recipientName).toBe("Razeen Jubair");

      // Verify stock was decremented
      expect(mockPrisma.db.inventory.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { productId: mockProduct.id },
          data: { quantity: { decrement: 2 } },
        }),
      );

      // Verify cart was cleared
      expect(mockPrisma.db.cartItem.deleteMany).toHaveBeenCalled();
    });

    it("should reject order creation if delivery address belongs to another user", async () => {
      await expect(
        ordersService.createOrder(otherUserId, {
          addressId: mockAddress.id,
          paymentMethod: "BKASH",
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it("should allow customer to cancel pending order and restore stock", async () => {
      const cancelled = await ordersService.cancelOrder(
        userId,
        "HMT-20261108-12345",
        "Changed my mind",
      );

      expect(cancelled.orderStatus).toBe("CANCELLED");
      expect(mockPrisma.db.inventory.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { productId: mockProduct.id },
          data: { quantity: { increment: 2 } },
        }),
      );
    });

    it("should reject unauthorized cancellation of another customer's order", async () => {
      await expect(
        ordersService.cancelOrder(
          otherUserId,
          "HMT-20261108-12345",
          "Unauthorized attempt",
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});

