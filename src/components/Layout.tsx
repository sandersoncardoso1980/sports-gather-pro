import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { 
  Home, 
  Search, 
  Plus, 
  User, 
  MapPin,
  LogOut
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { profile, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const navigationItems = [
    { icon: Home, label: 'Início', path: '/' },
    { icon: Search, label: 'Explorar', path: '/explore' },
    { icon: Plus, label: 'Criar', path: '/create-event', premium: true },
    { icon: User, label: 'Perfil', path: '/profile' },
  ]

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth')
  }

  return (
    <div className="min-h-screen bg-gradient-surface">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Hunters
            </h1>
          </div>

          <div className="flex items-center space-x-2">
            {profile?.is_premium && (
              <span className="text-xs bg-gradient-primary text-primary-foreground px-2 py-1 rounded-full font-medium">
                Premium
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-around h-16">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.path
              const isDisabled = item.premium && !profile?.is_premium
              const Icon = item.icon

              return (
                <Button
                  key={item.path}
                  variant="ghost"
                  size="sm"
                  onClick={() => !isDisabled && navigate(item.path)}
                  disabled={isDisabled}
                  className={`flex flex-col items-center space-y-1 h-12 px-3 ${
                    isActive 
                      ? 'text-primary' 
                      : isDisabled 
                        ? 'text-muted-foreground/50' 
                        : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{item.label}</span>
                  {item.premium && !profile?.is_premium && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                  )}
                </Button>
              )
            })}
          </div>
        </div>
      </nav>
    </div>
  )
}

export default Layout