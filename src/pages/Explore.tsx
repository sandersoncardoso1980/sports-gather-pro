import React, { useEffect, useState } from 'react'
import { supabase, Event } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock,
  Search,
  Filter
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'

const Explore = () => {
  const navigate = useNavigate()
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSport, setSelectedSport] = useState('')

  const sports = [
    { value: '', label: 'Todos os esportes' },
    { value: 'futebol', label: 'Futebol' },
    { value: 'futsal', label: 'Futsal' },
    { value: 'volei', label: 'Vôlei' },
    { value: 'basquete', label: 'Basquete' },
    { value: 'ciclismo', label: 'Ciclismo' },
    { value: 'corrida', label: 'Corrida' },
    { value: 'caminhada', label: 'Caminhada' },
    { value: 'tenis', label: 'Tênis' },
    { value: 'natacao', label: 'Natação' },
    { value: 'outros', label: 'Outros' }
  ]

  useEffect(() => {
    loadEvents()
  }, [])

  useEffect(() => {
    filterEvents()
  }, [events, searchTerm, selectedSport])

  const loadEvents = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('events')
        .select(`
          *,
          profiles:creator_id (name, avatar_url),
          event_participants (id)
        `)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date')
        .order('time')

      if (data) setEvents(data)
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterEvents = () => {
    let filtered = events

    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedSport) {
      filtered = filtered.filter(event => event.sport_type === selectedSport)
    }

    setFilteredEvents(filtered)
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          <div className="h-12 bg-muted animate-pulse rounded-lg" />
          <div className="h-12 bg-muted animate-pulse rounded-lg" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">
          Explorar Eventos
        </h2>
        <p className="text-muted-foreground mt-1">
          Encontre o evento perfeito para você
        </p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar eventos, locais..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value)}
            className="flex-1 px-3 py-2 bg-background border border-input rounded-md text-sm"
          >
            {sports.map(sport => (
              <option key={sport.value} value={sport.value}>
                {sport.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredEvents.length} eventos encontrados
        </p>
        {(searchTerm || selectedSport) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchTerm('')
              setSelectedSport('')
            }}
          >
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {filteredEvents.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Nenhum evento encontrado
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    Tente ajustar os filtros ou buscar por outros termos
                  </p>
                </div>
                <Button onClick={() => {
                  setSearchTerm('')
                  setSelectedSport('')
                }}>
                  Ver todos os eventos
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredEvents.map((event) => (
            <Card 
              key={event.id}
              className="cursor-pointer hover:shadow-md transition-shadow group"
              onClick={() => handleEventClick(event.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  {/* Event Banner */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
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
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {event.name}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {event.description}
                        </p>
                      </div>
                      
                      <Badge variant="secondary" className="text-xs ml-2">
                        {event.sport_type}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {format(new Date(event.date), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {event.time}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span className="truncate max-w-40">{event.location}</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {event.event_participants?.length || 0}
                        {event.max_participants && `/${event.max_participants}`}
                      </div>
                    </div>

                    {/* Creator Info */}
                    {event.profiles && (
                      <div className="flex items-center mt-3 pt-3 border-t border-border">
                        {event.profiles.avatar_url ? (
                          <img 
                            src={event.profiles.avatar_url} 
                            alt={event.profiles.name}
                            className="w-6 h-6 rounded-full mr-2"
                          />
                        ) : (
                          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center mr-2">
                            <span className="text-primary-foreground text-xs font-semibold">
                              {event.profiles.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <span className="text-sm text-muted-foreground">
                          Criado por {event.profiles.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

export default Explore