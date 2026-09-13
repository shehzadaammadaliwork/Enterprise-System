import { CalendarEventsService } from '../services/calendar-events.service';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreateCalendarEventDto } from '../dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from '../dto/update-calendar-event.dto';
import { ListCalendarEventsQueryDto } from '../dto/list-calendar-events-query.dto';
export declare class CalendarEventsController {
    private readonly calendarEventsService;
    constructor(calendarEventsService: CalendarEventsService);
    list(query: ListCalendarEventsQueryDto): Promise<import("../services/calendar-events.service").CalendarEventView[]>;
    get(id: string): Promise<import("../services/calendar-events.service").CalendarEventView>;
    create(user: AuthenticatedUser, dto: CreateCalendarEventDto): Promise<import("../services/calendar-events.service").CalendarEventView>;
    update(id: string, dto: UpdateCalendarEventDto): Promise<import("../services/calendar-events.service").CalendarEventView>;
    remove(id: string): Promise<void>;
}
