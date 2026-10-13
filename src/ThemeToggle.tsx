import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')
  // Start in light mode unless the user has explicitly saved a theme choice.
  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try { localStorage.setItem('thangam-admin-theme-v3', next) } catch { /* Theme still applies for this session. */ }
    setTheme(next)
  }
  const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
  return <button type="button" className="theme-toggle" aria-label={label} title={label} onClick={toggle}>
    {theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}
    <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
  </button>
}
