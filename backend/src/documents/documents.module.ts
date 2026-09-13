import { Module } from '@nestjs/common';
import { RbacModule } from '../rbac/rbac.module';
import { DocumentsService } from './services/documents.service';
import { DocumentsController } from './controllers/documents.controller';

@Module({
  imports: [RbacModule],
  controllers: [DocumentsController],
  providers: [DocumentsService],
})
export class DocumentsModule {}
