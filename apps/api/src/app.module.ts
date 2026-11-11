import { SocialOrdersModule } from "./social-orders/social-orders.module";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { validateEnvironment } from "./config/environment";
import { PrismaModule } from "./prisma/prisma.module";
import { HealthModule } from "./health/health.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { StorageModule } from "./storage/storage.module";
import { CategoriesModule } from "./categories/categories.module";
import { ProductsModule } from "./products/products.module";
import { ShippingModule } from "./shipping/shipping.module";
import { CartModule } from "./cart/cart.module";
import { WishlistModule } from "./wishlist/wishlist.module";
import { AddressesModule } from "./addresses/addresses.module";
import { OrdersModule } from "./orders/orders.module";
import { AdminModule } from "./admin/admin.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { PaymentsModule } from "./payments/payments.module";
import { PrintingModule } from "./printing/printing.module";

@Module({
  imports: [
    SocialOrdersModule,
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    StorageModule,
    CategoriesModule,
    ProductsModule,
    ShippingModule,
    CartModule,
    WishlistModule,
    AddressesModule,
    OrdersModule,
    AdminModule,
    AnalyticsModule,
    PaymentsModule,
    PrintingModule,
  ],
})
export class AppModule {}

