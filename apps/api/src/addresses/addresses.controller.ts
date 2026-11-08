import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { AddressesService } from "./addresses.service";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/roles";
import { CreateAddressSchema, UpdateAddressSchema } from "@himatu/shared";

@Controller("addresses")
@UseGuards(AuthGuard)
export class AddressesController {
  constructor(
    @Inject(AddressesService) private readonly addressesService: AddressesService,
  ) {}

  @Get()
  async listAddresses(@CurrentUser() customer: { id: string }) {
    return this.addressesService.listCustomerAddresses(customer.id);
  }

  @Post()
  async createAddress(
    @CurrentUser() customer: { id: string },
    @Body() body: unknown,
  ) {
    const parsed = CreateAddressSchema.parse(body);
    return this.addressesService.createAddress(customer.id, parsed);
  }

  @Patch(":id")
  async updateAddress(
    @CurrentUser() customer: { id: string },
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const parsed = UpdateAddressSchema.parse(body);
    return this.addressesService.updateAddress(customer.id, id, parsed);
  }

  @Delete(":id")
  async deleteAddress(
    @CurrentUser() customer: { id: string },
    @Param("id") id: string,
  ) {
    return this.addressesService.deleteAddress(customer.id, id);
  }

  @Patch(":id/default")
  async setDefault(
    @CurrentUser() customer: { id: string },
    @Param("id") id: string,
  ) {
    return this.addressesService.setDefault(customer.id, id);
  }
}

