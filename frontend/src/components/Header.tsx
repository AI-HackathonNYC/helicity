import { Link, useLocation } from 'react-router-dom'

interface Props {
  lastUpdated: Date | null
}

export function Header({ lastUpdated }: Props) {
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/map', label: 'Map' },
    { path: '/developers', label: 'Developers' },
    { path: '/portal', label: 'API Portal' },
  ]

  const secondsAgo = lastUpdated
    ? Math.floor((Date.now() - lastUpdated.getTime()) / 1000)
    : null

  return (
    <header className="border-b border-black/6 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight">
              <span className="text-[#6c5ce7]">helicity</span>
            </h1>
          </Link>
          <nav className="flex gap-1">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'bg-[#6c5ce7]/10 text-[#6c5ce7]'
                    : 'text-[#555] hover:text-[#0f0f0f] hover:bg-black/4'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#888]">
          <span className="inline-block w-2 h-2 rounded-full bg-[#00b894] animate-pulse" />
          <span>
            {secondsAgo !== null ? `Updated ${secondsAgo}s ago` : 'Connecting...'}
          </span>
        </div>
      </div>
    </header>
  )
}
