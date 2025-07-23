import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, Event, EventPhoto } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  User, 
  MapPin, 
  Calendar, 
  Trophy,
  Camera,
  Edit,
  Save,
  X,
  Upload,
  Star
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'

const Profile = () => {
  const { profile, updateProfile } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    name: '',
    age: '',
    city: '',
    favorite_sport: ''
  })
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])
  const [eventPhotos, setEventPhotos] = useState<EventPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  const sports = [
    'futebol', 'futsal', 'volei', 'basquete', 'ciclismo', 
    'caminhada', 'corrida', 'tenis', 'natacao', 'outros'
  ]

  useEffect(() => {
    if (profile) {
      setEditData({
        name: profile.name,
        age: profile.age.toString(),
        city: profile.city,
        favorite_sport: profile.favorite_sport
      })
      loadUserData()
    }
  }, [profile])

  const loadUserData = async () => {
    if (!profile) return

    setLoading(true)
    try {
      // Set mock data for upcoming events (since we don't have real Supabase tables)
      const mockEvents: Event[] = [
        {
          id: '1',
          name: 'Futebol no Parque',
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          time: '15:00',
          location: 'Parque do Ibirapuera',
          sport_type: 'futebol',
          banner_url: null,
          description: 'Jogo amistoso',
          latitude: -23.5505,
          longitude: -46.6333,
          max_participants: 20,
          creator_id: profile.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
      setUpcomingEvents(mockEvents)

      // Set mock event photos
      const mockPhotos: EventPhoto[] = []
      setEventPhotos(mockPhotos)
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      let avatarUrl = profile?.avatar_url

      // Upload new avatar if selected
      if (avatarFile && profile) {
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${profile.id}.${fileExt}`
        const filePath = `avatars/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('profiles')
          .upload(filePath, avatarFile, { upsert: true })

        if (uploadError) {
          console.error('Error uploading avatar:', uploadError)
        } else {
          const { data } = supabase.storage
            .from('profiles')
            .getPublicUrl(filePath)
          avatarUrl = data.publicUrl
        }
      }

      const { error } = await updateProfile({
        name: editData.name,
        age: parseInt(editData.age),
        city: editData.city,
        favorite_sport: editData.favorite_sport,
        avatar_url: avatarUrl
      })

      if (!error) {
        setIsEditing(false)
        setAvatarFile(null)
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o perfil.",
        variant: "destructive"
      })
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
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

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <p className="text-muted-foreground">Carregando perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage 
                  src={avatarFile ? URL.createObjectURL(avatarFile) : profile.avatar_url} 
                  alt={profile.name} 
                />
                <AvatarFallback className="text-2xl">
                  {profile.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center cursor-pointer"
                     onClick={() => document.getElementById('avatar-upload')?.click()}>
                  <Camera className="w-6 h-6 text-white" />
                </div>
              )}
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-name">Nome</Label>
                      <Input
                        id="edit-name"
                        value={editData.name}
                        onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-age">Idade</Label>
                      <Input
                        id="edit-age"
                        type="number"
                        value={editData.age}
                        onChange={(e) => setEditData(prev => ({ ...prev, age: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="edit-city">Cidade</Label>
                    <Input
                      id="edit-city"
                      value={editData.city}
                      onChange={(e) => setEditData(prev => ({ ...prev, city: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-sport">Esporte Favorito</Label>
                    <select
                      id="edit-sport"
                      className="w-full px-3 py-2 bg-background border border-input rounded-md"
                      value={editData.favorite_sport}
                      onChange={(e) => setEditData(prev => ({ ...prev, favorite_sport: e.target.value }))}
                    >
                      {sports.map(sport => (
                        <option key={sport} value={sport}>
                          {sport.charAt(0).toUpperCase() + sport.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <h1 className="text-2xl font-bold">{profile.name}</h1>
                    {profile.is_premium && (
                      <Badge variant="secondary" className="bg-gradient-primary text-primary-foreground">
                        <Star className="w-3 h-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      {profile.age} anos
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {profile.city}
                    </div>
                    <div className="flex items-center">
                      <Trophy className="w-4 h-4 mr-1" />
                      {profile.favorite_sport}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              {isEditing ? (
                <>
                  <Button onClick={handleSaveProfile} size="sm">
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsEditing(false)
                      setAvatarFile(null)
                      setEditData({
                        name: profile.name,
                        age: profile.age.toString(),
                        city: profile.city,
                        favorite_sport: profile.favorite_sport
                      })
                    }}
                    size="sm"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Perfil
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs defaultValue="events" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="events">Próximos Eventos</TabsTrigger>
          <TabsTrigger value="photos">Galeria de Fotos</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : upcomingEvents.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">
                  Nenhum evento confirmado
                </h3>
                <p className="text-muted-foreground mb-4">
                  Explore eventos esportivos e confirme sua participação
                </p>
                <Button onClick={() => navigate('/explore')}>
                  Explorar Eventos
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <Card 
                  key={event.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/event/${event.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        {event.banner_url ? (
                          <img 
                            src={event.banner_url} 
                            alt={event.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className={`w-full h-full ${getSportColor(event.sport_type)} flex items-center justify-center`}>
                            <span className="text-white font-bold text-sm">
                              {event.sport_type.slice(0, 3).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{event.name}</h4>
                        <div className="flex items-center text-sm text-muted-foreground mt-1 space-x-4">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {format(new Date(event.date), 'dd/MM/yyyy', { locale: ptBR })}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {event.location}
                          </div>
                        </div>
                      </div>
                      
                      <Badge variant="secondary">
                        {event.sport_type}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="photos" className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : eventPhotos.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">
                  Nenhuma foto ainda
                </h3>
                <p className="text-muted-foreground mb-4">
                  Participe de eventos e capture seus melhores momentos
                </p>
                <Button onClick={() => navigate('/explore')}>
                  Encontrar Eventos
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {eventPhotos.map((photo) => (
                <div key={photo.id} className="aspect-square overflow-hidden rounded-lg group">
                  <img 
                    src={photo.photo_url} 
                    alt="Foto do evento"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform cursor-pointer"
                  />
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Premium Upgrade CTA */}
      {!profile.is_premium && (
        <Card className="bg-gradient-primary text-primary-foreground">
          <CardContent className="p-6 text-center">
            <Star className="w-12 h-12 mx-auto mb-4" />
            <h4 className="font-bold text-xl mb-2">Upgrade para Premium</h4>
            <p className="mb-4 opacity-90">
              Crie eventos, acesse estatísticas avançadas e muito mais!
            </p>
            <Button variant="secondary" className="font-semibold">
              Saiba Mais
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default Profile