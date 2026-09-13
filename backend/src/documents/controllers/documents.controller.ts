import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  DocumentsService,
  MAX_DOCUMENT_SIZE_BYTES,
} from '../services/documents.service';
import { RequirePermission } from '../../rbac/decorators/require-permission.decorator';
import { AuditEntity } from '../../common/decorators/audit-entity.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { UploadDocumentDto } from '../dto/upload-document.dto';
import { UpdateDocumentDto } from '../dto/update-document.dto';
import { SetDocumentAccessDto } from '../dto/set-document-access.dto';
import { ListDocumentsQueryDto } from '../dto/list-documents-query.dto';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  @RequirePermission('documents', 'VIEW')
  listForEntity(
    @Query() query: ListDocumentsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.listForEntity(query, user.id);
  }

  @Post()
  @RequirePermission('documents', 'CREATE')
  @AuditEntity('Document')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_DOCUMENT_SIZE_BYTES } }),
  )
  uploadDocument(
    @Body() dto: UploadDocumentDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!file) throw new BadRequestException('A file is required.');
    return this.documentsService.uploadDocument(dto, file, user.id);
  }

  @Get(':id')
  @RequirePermission('documents', 'VIEW')
  getDocument(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.documentsService.getDocument(id, user.id);
  }

  @Patch(':id')
  @RequirePermission('documents', 'EDIT')
  @AuditEntity('Document')
  updateDocument(@Param('id') id: string, @Body() dto: UpdateDocumentDto) {
    return this.documentsService.updateDocument(id, dto);
  }

  @Patch(':id/access')
  @RequirePermission('documents', 'EDIT')
  @AuditEntity('Document')
  setAccess(@Param('id') id: string, @Body() dto: SetDocumentAccessDto) {
    return this.documentsService.setAccess(id, dto);
  }

  @Delete(':id')
  @RequirePermission('documents', 'DELETE')
  @AuditEntity('Document')
  deleteDocument(@Param('id') id: string) {
    return this.documentsService.deleteDocument(id);
  }

  @Post(':id/versions')
  @RequirePermission('documents', 'EDIT')
  @AuditEntity('Document')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_DOCUMENT_SIZE_BYTES } }),
  )
  addVersion(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!file) throw new BadRequestException('A file is required.');
    return this.documentsService.addVersion(id, file, user.id);
  }

  @Get(':id/download')
  @RequirePermission('documents', 'VIEW')
  downloadLatest(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.downloadVersion(id, undefined, user.id);
  }

  @Get(':id/versions/:versionId/download')
  @RequirePermission('documents', 'VIEW')
  downloadVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentsService.downloadVersion(id, versionId, user.id);
  }
}
