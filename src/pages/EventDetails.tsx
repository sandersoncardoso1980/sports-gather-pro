import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, Event, EventParticipant, EventPhoto } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock,
  ArrowLeft,
  UserCheck,
  UserMinus,
  Camera,
  Navigation,
  UserPlus
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'

const EventDetails = () => {
  const { eventId } = useParams<{ eventId: string }>()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [event, setEvent] = useState<Event | null>(null)
  const [participants, setParticipants] = useState<any[]>([])
  const [photos, setPhotos] = useState<EventPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [isParticipating, setIsParticipating] = useState(false)
  const [isCheckedIn, setIsCheckedIn] = useState(false)

  useEffect(() => {
    if (eventId) {
      loadEventDetails()
    }
  }, [eventId, user])

  const loadEventDetails = async () => {
    if (!eventId) return

    setLoading(true)
    try {
      // Load event details
      const { data: eventData } = await supabase
        .from('events')
        .select(`
          *,
          profiles:creator_id (name, avatar_url, city)
        `)
        .eq('id', eventId)
        .single()

      if (eventData) {
        setEvent(eventData)
      }

      // Load participants
      const { data: participantsData } = await supabase
        .from('event_participants')
        .select(`
          *,
          profiles:user_id (name, avatar_url, city)
        `)
        .eq('event_id', eventId)

      if (participantsData) {
        setParticipants(participantsData)
        
        // Check if current user is participating
        const userParticipation = participantsData.find(p => p.user_id === user?.id)
        setIsParticipating(!!userParticipation)
        setIsCheckedIn(!!userParticipation?.checked_in)
      }

      // Load event photos
      const { data: photosData } = await supabase
        .from('event_photos')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })

      if (photosData) {
        setPhotos(photosData)
      }
    } catch (error) {
      console.error('Error loading event details:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleParticipation = async () => {
    if (!user || !eventId) return

    try {
      if (isParticipating) {
        // Remove participation
        const { error } = await supabase
          .from('event_participants')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', user.id)

        if (error) throw error

        setIsParticipating(false)
        setIsCheckedIn(false)
        toast({
          title: "Participação cancelada",
          description: "Você não participará mais deste evento.",
        })
      } else {
        // Add participation
        const { error } = await supabase
          .from('event_participants')
          .insert({
            event_id: eventId,
            user_id: user.id,
            confirmed_at: new Date().toISOString()
          })

        if (error) throw error

        setIsParticipating(true)
        toast({
          title: "Participação confirmada!",
          description: "Você está confirmado para este evento.",
        })
      }

      // Reload participants
      loadEventDetails()
    } catch (error) {
      console.error('Error updating participation:', error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar sua participação.",
        variant: "destructive"
      })
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

  const openMaps = () => {
    if (event) {
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`
      window.open(mapsUrl, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          <div className="h-8 bg-muted animate-pulse rounded-lg w-32" />
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <h2 className="text-xl font-bold">Evento não encontrado</h2>
          <Button onClick={() => navigate(-1)} className="mt-4">
            Voltar
          </Button>
        </div>
      </div>
    )
  }

  const eventDate = new Date(event.date)
  const isEventToday = eventDate.toDateString() === new Date().toDateString()
  const isEventPast = eventDate < new Date()

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header with back button */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </div>

      {/* Event Banner */}
      <Card className="overflow-hidden">
        <div className="relative h-48 md:h-64">
          {event.banner_url ? (
            <img 
              src={event.banner_url} 
              alt={event.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full ${getSportColor(event.sport_type)} flex items-center justify-center`}>
              <span className="text-white font-bold text-4xl">
                {event.sport_type.slice(0, 3).toUpperCase()}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute bottom-4 left-4 right-4">
            <Badge variant="secondary" className="mb-2">
              {event.sport_type}
            </Badge>
            <h1 className="text-white font-bold text-2xl md:text-3xl shadow-text">
              {event.name}
            </h1>
          </div>
        </div>
      </Card>

      {/* Event Info */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-3">Sobre o evento</h3>
              <p className="text-muted-foreground leading-relaxed">
                {event.description}
              </p>
            </CardContent>
          </Card>

          {/* Creator Info */}
          {event.profiles && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">Organizador</h3>
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={event.profiles.avatar_url} alt={event.profiles.name} />
                    <AvatarFallback>
                      {event.profiles.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{event.profiles.name}</p>
                    <p className="text-sm text-muted-foreground">{event.profiles.city}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Participants */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">
                  Participantes ({participants.length}
                  {event.max_participants && `/${event.max_participants}`})
                </h3>
              </div>
              
              {participants.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Ainda não há participantes confirmados
                </p>
              ) : (
                <div className="space-y-3">
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage 
                          src={participant.profiles?.avatar_url} 
                          alt={participant.profiles?.name} 
                        />
                        <AvatarFallback>
                          {participant.profiles?.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{participant.profiles?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {participant.profiles?.city}
                        </p>
                      </div>
                      {participant.checked_in && (
                        <Badge variant="secondary" className="text-xs">
                          <UserCheck className="w-3 h-3 mr-1" />
                          Presente
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Photos Gallery */}
          {photos.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center">
                  <Camera className="w-5 h-5 mr-2" />
                  Galeria de Fotos
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {photos.map((photo) => (
                    <div key={photo.id} className="aspect-square overflow-hidden rounded-lg">
                      <img 
                        src={photo.photo_url} 
                        alt="Foto do evento"
                        className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Event Details */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">
                    {format(eventDate, 'EEEE, dd/MM/yyyy', { locale: ptBR })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isEventToday ? 'Hoje' : isEventPast ? 'Evento finalizado' : 'Próximo evento'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">{event.time}</p>
                  <p className="text-sm text-muted-foreground">Horário de início</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">{event.location}</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={openMaps}
                    className="p-0 h-auto text-primary hover:text-primary/80"
                  >
                    <Navigation className="w-4 h-4 mr-1" />
                    Ver no mapa
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">
                    {participants.length} participantes
                    {event.max_participants && ` de ${event.max_participants}`}
                  </p>
                  <p className="text-sm text-muted-foreground">Confirmados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Participation Button */}
          {!isEventPast && (
            <Button
              onClick={handleParticipation}
              className={`w-full ${
                isParticipating 
                  ? 'bg-destructive hover:bg-destructive/90' 
                  : 'bg-gradient-primary hover:opacity-90 shadow-glow'
              }`}
              disabled={!isParticipating && event.max_participants && participants.length >= event.max_participants}
            >
              {isParticipating ? (
                <>
                  <UserMinus className="w-4 h-4 mr-2" />
                  Cancelar Participação
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Confirmar Presença
                </>
              )}
            </Button>
          )}

          {/* Check-in Info */}
          {isParticipating && !isEventPast && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 text-center">
                <UserCheck className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="font-medium text-primary">Participação Confirmada</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {isEventToday 
                    ? 'Chegue no local para fazer check-in automático' 
                    : 'Você receberá lembretes sobre o evento'
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default EventDetails