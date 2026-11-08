import { Injectable } from "@nestjs/common";
import type { ShippingCalculation } from "@himatu/shared";

@Injectable()
export class ShippingService {
  private readonly insideDhakaCharge = 80;
  private readonly outsideDhakaCharge = 130;
  private readonly freeShippingThreshold = 15000;

  calculateShipping(district: string, subtotal: number): ShippingCalculation {
    const isDhaka = (district || "").trim().toLowerCase() === "dhaka";
    const isFree = subtotal >= this.freeShippingThreshold;

    const baseCharge = isDhaka ? this.insideDhakaCharge : this.outsideDhakaCharge;
    const finalCharge = isFree ? 0 : baseCharge;

    return {
      district: district || "Dhaka",
      shippingCharge: finalCharge,
      isFreeShipping: isFree,
      estimatedDeliveryDays: isDhaka ? "1-2 business days" : "2-4 business days",
    };
  }
}

