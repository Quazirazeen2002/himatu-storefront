import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { AddressDto } from "@himatu/shared";

@Injectable()
export class AddressesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private mapAddressToDto(addr: any): AddressDto {
    return {
      id: addr.id,
      userId: addr.userId,
      recipientName: addr.recipientName,
      phone: addr.phone,
      district: addr.district,
      area: addr.area,
      fullAddress: addr.fullAddress,
      postalCode: addr.postalCode,
      label: addr.label,
      isDefault: addr.isDefault,
      createdAt: addr.createdAt.toISOString(),
      updatedAt: addr.updatedAt.toISOString(),
    };
  }

  async listCustomerAddresses(userId: string): Promise<AddressDto[]> {
    const addresses = await this.prisma.db.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    return addresses.map((addr) => this.mapAddressToDto(addr));
  }

  async createAddress(
    userId: string,
    data: {
      recipientName: string;
      phone: string;
      district: string;
      area: string;
      fullAddress: string;
      postalCode?: string | null;
      label?: string;
      isDefault?: boolean;
    },
  ): Promise<AddressDto> {
    const count = await this.prisma.db.address.count({ where: { userId } });
    const shouldBeDefault = data.isDefault ?? count === 0;

    const created = await this.prisma.db.$transaction(async (tx) => {
      if (shouldBeDefault) {
        await tx.address.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }

      return tx.address.create({
        data: {
          userId,
          recipientName: data.recipientName,
          phone: data.phone,
          district: data.district,
          area: data.area,
          fullAddress: data.fullAddress,
          postalCode: data.postalCode,
          label: data.label || "HOME",
          isDefault: shouldBeDefault,
        },
      });
    });

    return this.mapAddressToDto(created);
  }

  async updateAddress(
    userId: string,
    id: string,
    data: {
      recipientName?: string;
      phone?: string;
      district?: string;
      area?: string;
      fullAddress?: string;
      postalCode?: string | null;
      label?: string;
      isDefault?: boolean;
    },
  ): Promise<AddressDto> {
    const address = await this.prisma.db.address.findUnique({ where: { id } });
    if (!address) throw new NotFoundException("Address not found");
    if (address.userId !== userId) {
      throw new ForbiddenException("Cannot modify another customer's address");
    }

    const updated = await this.prisma.db.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.address.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }

      return tx.address.update({
        where: { id },
        data: {
          recipientName: data.recipientName,
          phone: data.phone,
          district: data.district,
          area: data.area,
          fullAddress: data.fullAddress,
          postalCode: data.postalCode,
          label: data.label,
          isDefault: data.isDefault,
        },
      });
    });

    return this.mapAddressToDto(updated);
  }

  async deleteAddress(userId: string, id: string): Promise<{ success: boolean }> {
    const address = await this.prisma.db.address.findUnique({ where: { id } });
    if (!address) throw new NotFoundException("Address not found");
    if (address.userId !== userId) {
      throw new ForbiddenException("Cannot delete another customer's address");
    }

    await this.prisma.db.$transaction(async (tx) => {
      await tx.address.delete({ where: { id } });

      // If deleted was default, promote the newest remaining address to default
      if (address.isDefault) {
        const next = await tx.address.findFirst({
          where: { userId },
          orderBy: { createdAt: "desc" },
        });
        if (next) {
          await tx.address.update({
            where: { id: next.id },
            data: { isDefault: true },
          });
        }
      }
    });

    return { success: true };
  }

  async setDefault(userId: string, id: string): Promise<AddressDto> {
    const address = await this.prisma.db.address.findUnique({ where: { id } });
    if (!address) throw new NotFoundException("Address not found");
    if (address.userId !== userId) {
      throw new ForbiddenException("Cannot modify another customer's address");
    }

    const updated = await this.prisma.db.$transaction(async (tx) => {
      await tx.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });

      return tx.address.update({
        where: { id },
        data: { isDefault: true },
      });
    });

    return this.mapAddressToDto(updated);
  }
}

