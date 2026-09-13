import { Module } from '@nestjs/common';
import { LeadsService } from './services/leads.service';
import { CustomersService } from './services/customers.service';
import { DealsService } from './services/deals.service';
import { ActivitiesService } from './services/activities.service';
import { NotesService } from './services/notes.service';
import { LeadsController } from './controllers/leads.controller';
import { CustomersController } from './controllers/customers.controller';
import { DealsController } from './controllers/deals.controller';
import { ActivitiesController } from './controllers/activities.controller';
import { NotesController } from './controllers/notes.controller';

@Module({
  controllers: [
    LeadsController,
    CustomersController,
    DealsController,
    ActivitiesController,
    NotesController,
  ],
  providers: [
    LeadsService,
    CustomersService,
    DealsService,
    ActivitiesService,
    NotesService,
  ],
  exports: [CustomersService, DealsService],
})
export class CrmModule {}
