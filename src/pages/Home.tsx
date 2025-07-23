import React, { useEffect, useState } from 'react'
import { supabase, Event, Advertisement } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock,
  ChevronRight,
  Zap
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'

const Home = () => {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [events, setEvents] = useState<Event[]>([])
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load advertisements
      const { data: ads } = await supabase
        .from('advertisements')
        .select('*')
        .eq('is_active', true)
        .order('display_order')
        .limit(5)

      if (ads) setAdvertisements(ads)

      // Load upcoming events
      const { data: eventsData } = await supabase
        .from('events')
        .select(`
          *,
          profiles:creator_id (name, avatar_url),
          event_participants (id)
        `)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date')
        .order('time')
        .limit(10)

      if (eventsData) setEvents(eventsData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSportColor = (sport: string) => {
    const colors: { [key: string]: string } = {
      'futebol': 'bg-sport-football',
      'futsal': 'bg-sport-football',
      'volei': 'bg-sport-volleyball',
      'basquete': 'bg-sport-basketball',
      'ciclismo': 'bg-sport-cycling',
      'corrida': 'bg-sport-running',
      'caminhada': 'bg-sport-running',
    }
    return colors[sport] || 'bg-primary'
  }

  const handleEventClick = (eventId: string) => {
    navigate(`/event/${eventId}`)
  }

  const handleAdClick = (ad: Advertisement) => {
    if (ad.event_id) {
      navigate(`/event/${ad.event_id}`)
    } else if (ad.link_url) {
      window.open(ad.link_url, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          <div className="h-48 bg-muted animate-pulse rounded-lg" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Welcome Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">
          Olá, {profile?.name || 'Hunter'}! 👋
        </h2>
        <p className="text-muted-foreground mt-1">
          Encontre eventos esportivos perto de você
        </p>
      </div>

      {/* Advertisements Carousel */}
      {advertisements.length > 0 && (
        <div className="relative">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-primary" />
            Destaques
          </h3>
          <Carousel className="w-full">
            <CarouselContent>
              {advertisements.map((ad) => (
                <CarouselItem key={ad.id}>
                  <Card 
                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
                    onClick={() => handleAdClick(ad)}
                  >
                    <div className="relative h-48">
                      {ad.banner_url ? (
                        <img 
                          src={ad.banner_url} 
                          alt={ad.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-primary flex items-center justify-center">
                          <span className="text-primary-foreground font-bold text-xl">
                            {ad.title}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <h4 className="text-white font-bold text-lg shadow-text">
                          {ad.title}
                        </h4>
                      </div>
                    </div>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      )}

      {/* Upcoming Events */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-primary" />
            Próximos Eventos
          </h3>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/explore')}
            className="text-primary hover:text-primary"
          >
            Ver todos
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <div className="space-y-4">
          {events.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">
                  Nenhum evento encontrado na sua região.
                </p>
                <Button 
                  className="mt-4"
                  onClick={() => navigate('/explore')}
                >
                  Explorar eventos
                </Button>
              </CardContent>
            </Card>
          ) : (
            events.map((event) => (
              <Card 
                key={event.id}
                className="cursor-pointer hover:shadow-md transition-shadow group"
                onClick={() => handleEventClick(event.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    {/* Event Banner */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      {event.banner_url ? (
                        <img 
                          src={event.banner_url} 
                          alt={event.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className={`w-full h-full ${getSportColor(event.sport_type)} flex items-center justify-center`}>
                          <span className="text-white font-bold text-sm">
                            {event.sport_type.slice(0, 3).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Event Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {event.name}
                          </h4>
                          <div className="flex items-center text-sm text-muted-foreground mt-1 space-x-4">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {format(new Date(event.date), 'dd/MM', { locale: ptBR })}
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {event.time}
                            </div>
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <MapPin className="w-4 h-4 mr-1" />
                            {event.location}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end space-y-2">
                          <Badge variant="secondary" className="text-xs">
                            {event.sport_type}
                          </Badge>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Users className="w-4 h-4 mr-1" />
                            {event.event_participants?.length || 0}
                            {event.max_participants && `/${event.max_participants}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Create Event CTA for non-premium users */}
      {!profile?.is_premium && (
        <Card className="bg-gradient-primary text-primary-foreground">
          <CardContent className="p-6 text-center">
            <h4 className="font-bold text-lg mb-2">Quer criar seus próprios eventos?</h4>
            <p className="mb-4 opacity-90">
              Torne-se Premium e organize eventos esportivos na sua cidade!
            </p>
            <Button variant="secondary" className="font-semibold">
              Upgrade para Premium
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default Home