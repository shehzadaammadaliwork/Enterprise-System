import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useUsers } from '../api/hooks';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../../../components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';

interface UserPickerProps {
  value: string;
  onChange: (userId: string) => void;
}

/// Searchable replacement for pasting a raw user id into "Add employee" —
/// only ever offers users with no linked Employee profile yet (the backend
/// enforces User<->Employee as one-to-one, so an already-onboarded user
/// should never even be selectable here).
export function UserPicker({ value, onChange }: UserPickerProps) {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useUsers(undefined, true, 100);
  const users = data?.data ?? [];
  const selected = users.find((user) => user.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className={cn('truncate', !selected && 'text-muted-foreground')}>
            {selected ? `${selected.firstName} ${selected.lastName} — ${selected.email}` : 'Select a user…'}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command>
          <CommandInput placeholder="Search by name or email…" />
          <CommandList>
            {isLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">Loading…</div>
            ) : (
              <>
                <CommandEmpty>No users available to onboard.</CommandEmpty>
                <CommandGroup>
                  {users.map((user) => (
                    <CommandItem
                      key={user.id}
                      value={`${user.firstName} ${user.lastName} ${user.email}`}
                      onSelect={() => {
                        onChange(user.id);
                        setOpen(false);
                      }}
                    >
                      <Check className={cn('size-4', user.id === value ? 'opacity-100' : 'opacity-0')} />
                      <div className="flex flex-col">
                        <span>
                          {user.firstName} {user.lastName}
                        </span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
