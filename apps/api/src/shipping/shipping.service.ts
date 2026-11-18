import { Injectable } from "@nestjs/common";
import type { ShippingCalculation } from "@himatu/shared";
import { DELIVERY_CHARGE_BDT } from "@himatu/shared";

@Injectable()
export class ShippingService {
  calculateShipping(district: string, _subtotal: number): ShippingCalculation {
    const isDhaka = (district || "").trim().toLowerCase() === "dhaka";
    return {
      district: district || "Dhaka",
      shippingCharge: DELIVERY_CHARGE_BDT,
      isFreeShipping: false,
      estimatedDeliveryDays: isDhaka ? "1-2 business days" : "2-4 business days",
    };
  }
}

