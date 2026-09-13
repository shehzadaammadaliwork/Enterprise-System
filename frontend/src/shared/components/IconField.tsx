import { useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { cn } from '../../lib/utils';

interface IconFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: ReactNode;
  /// Renders a show/hide toggle and switches the input between
  /// type="password" and type="text" — pass the field's real type via
  /// `type` as normal, this only activates the toggle for password fields.
  isPassword?: boolean;
}

export function IconField({ label, icon, isPassword, id, type, className, ...inputProps }: IconFieldProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 text-muted-foreground [&_svg]:size-4">
          {icon}
        </span>
        <Input
          id={id}
          type={isPassword ? (revealed ? 'text' : 'password') : type}
          className={cn('pl-9', isPassword && 'pr-9', className)}
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((value) => !value)}
            aria-label={revealed ? 'Hide password' : 'Show password'}
            tabIndex={-1}
            className="absolute right-2.5 top-1/2 flex -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {revealed ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}
