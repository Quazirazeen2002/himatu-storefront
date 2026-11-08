import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { PrintingService } from "./printing.service";
import { OptionalAuthGuard } from "../auth/optional-auth.guard";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/roles";
import type { CreatePrintingRequestDto } from "@himatu/shared";

@Controller("printing")
export class PrintingController {
  constructor(@Inject(PrintingService) private readonly printingService: PrintingService) {}

  @Post("requests")
  @UseGuards(OptionalAuthGuard)
  async createRequest(
    @CurrentUser() user: any,
    @Body() body: CreatePrintingRequestDto,
  ) {
    return this.printingService.createRequest(user?.id || null, body);
  }

  @Post("requests/:id/images")
  @UseInterceptors(FileInterceptor("file"))
  async uploadReferenceImage(
    @Param("id") id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body("description") description?: string,
  ) {
    return this.printingService.addReferenceImage(
      id,
      {
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      },
      description,
    );
  }

  @Get("requests/my-requests")
  @UseGuards(AuthGuard)
  async getMyRequests(@CurrentUser() user: any) {
    return this.printingService.getMyRequests(user.id);
  }

  @Get("requests/:id")
  @UseGuards(OptionalAuthGuard)
  async getRequestDetail(
    @Param("id") id: string,
    @CurrentUser() user: any,
  ) {
    return this.printingService.getRequestById(id, user?.id, false);
  }

  @Post("requests/:id/approve-quotation")
  @UseGuards(AuthGuard)
  async approveQuotation(
    @Param("id") id: string,
    @CurrentUser() user: any,
    @Body("addressId") addressId?: string,
  ) {
    return this.printingService.approveQuotation(id, user.id, addressId);
  }

  @Post("requests/:id/reject-quotation")
  async rejectQuotation(
    @Param("id") id: string,
    @Body("reason") reason?: string,
  ) {
    return this.printingService.rejectQuotation(id, reason);
  }
}
