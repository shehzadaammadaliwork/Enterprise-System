import type { ReactNode } from 'react';
import { BarChart3, Globe, Moon, ShieldCheck, Sun, Users } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { Button } from '../../components/ui/button';

const YEAR = new Date().getFullYear();

const FEATURES = [
  { icon: Users, text: 'Manage employees, customers and deals in one place' },
  { icon: BarChart3, text: 'Real-time sales, finance and inventory insights' },
  { icon: ShieldCheck, text: 'Role-based access control with full audit trails' },
];

/// Split-screen shell for every auth page (login/register/forgot/reset):
/// a fixed brand panel on the left, and the page's own form in a centered
/// column on the right. The language selector is a static placeholder —
/// there's no i18n implementation yet, it's here purely to match the
/// approved design; wire it up when Module 18 (Settings) adds locale support.
export function AuthSplitLayout({ children }: { children: ReactNode }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex min-h-svh">
      <aside
        className="hidden min-w-0 flex-1 basis-[46%] flex-col p-10 text-white md:flex"
        style={{ background: 'var(--brand-grad)' }}
      >
        <div className="mx-auto flex w-full max-w-115 flex-1 flex-col">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8.5 shrink-0 items-center justify-center rounded-[9px] bg-white/15 text-sm font-bold">
              IT
            </span>
            <span className="text-[17px] font-bold">Innova Tech Biz</span>
          </div>

          <div className="mt-24">
            <h1 className="mb-3.5 text-[34px] leading-[1.2] font-semibold tracking-tight text-white">
              Run your business with clarity and control.
            </h1>
            <p className="max-w-95 text-[15px] leading-relaxed text-white/75">
              The internal system built for managing your team, operations and growth at scale.
            </p>
          </div>

          <ul className="mt-10 flex flex-col gap-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-white">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-white/12">
                  <Icon className="size-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>

          <p className="mt-auto pt-10 text-xs text-white/75">© {YEAR} Innova Tech Biz. All rights reserved.</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 basis-[54%] flex-col bg-background">
        <div className="flex items-center justify-end gap-2.5 px-6 pt-5">
          <Button type="button" variant="outline" size="sm" className="rounded-full">
            <Globe className="size-3.75" />
            English
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Moon className="size-4" /> : <Sun className="size-4" />}
          </Button>
        </div>

        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-100">{children}</div>
        </div>
      </div>
    </div>
  );
}
