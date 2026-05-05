import { Link, NavLink, Outlet } from 'react-router-dom';
import { useJobs } from '../store/jobs';
import ThemeToggle from './ThemeToggle';

const NAV = [
  { to: '/', label: 'Studio', end: true },
  { to: '/project', label: 'Project' },
];

export default function Layout() {
  const jobs = useJobs();
  const live = jobs.filter((j) => j.status !== 'complete' && j.status !== 'failed').length;

  return (
    <div className="min-h-screen flex flex-col bg-ink-950 text-ink-100 noise">
      <header className="sticky top-0 z-40 border-b border-ink-800/80 backdrop-blur-md bg-ink-950/70">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/brand/rr-logo-darkmode.png"
              alt="Rigby & Rigby"
              className="h-5 w-auto hidden dark:block"
            />
            <img
              src="/brand/rr-logo-lightmode.png"
              alt="Rigby & Rigby"
              className="h-5 w-auto block dark:hidden"
            />
            <span className="text-[15px] tracking-tight text-ink-300 translate-y-[3px]">
              <span className="text-ink-500">·</span> ComfyUI Studio
            </span>
          </Link>

          <nav className="flex items-center gap-1 translate-y-[3px]">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `relative px-3 py-1.5 text-[13px] tracking-tight rounded-md transition-colors ${
                    isActive
                      ? 'text-ink-100 bg-ink-800/60'
                      : 'text-ink-400 hover:text-ink-100'
                  }`
                }
              >
                {item.label}
                {item.label === 'Project' && live > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-ink-950 text-[10px] font-mono font-semibold">
                    {live}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3 translate-y-[3px]">
            <div className="hidden md:flex items-center gap-2 text-[11px] font-mono text-ink-500">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-slow" />
              <span>agent · live</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-ink-800/80 py-6">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-[11px] font-mono text-ink-500">
          <div className="flex items-center gap-3">
            <span>RIGBY &amp; RIGBY</span>
            <span className="text-ink-700">/</span>
            <span>ALLECT AI LAB</span>
            <span className="text-ink-700">/</span>
            <span>v0.6.0</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Internal — not for client distribution</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
