import { Global, Module } from '@nestjs/common';
import { FieldEncryptionService } from './encryption.service';
import { PasswordService } from './password.service';
import { CsrfService } from './csrf.service';

@Global()
@Module({
  providers: [FieldEncryptionService, PasswordService, CsrfService],
  exports: [FieldEncryptionService, PasswordService, CsrfService],
})
export class SecurityModule {}
