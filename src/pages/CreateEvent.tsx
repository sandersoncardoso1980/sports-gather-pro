import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  ArrowLeft,
  Upload,
  MapPin,
  Calendar,
  Clock,
  Users,
  Star,
  Crown
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'

const CreateEvent = () => {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(false)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    date: '',
    time: '',
    sport_type: 'futebol',
    max_participants: ''
  })

  const sports = [
    'futebol', 'futsal', 'volei', 'basquete', 'ciclismo', 
    'caminhada', 'corrida', 'tenis', 'natacao', 'outros'
  ]

  // Remove monthly event count restriction
  const [monthlyEventCount, setMonthlyEventCount] = useState(0)

  useEffect(() => {
    checkMonthlyEventLimit()
  }, [profile])

  const checkMonthlyEventLimit = async () => {
    if (!profile) return

    try {
      // Mock count since we don't have events table yet
      const eventCount = 0 // This would be a real query in production
      setMonthlyEventCount(eventCount)
    } catch (error) {
      console.error('Error checking event limit:', error)
    }
  }

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setBannerFile(file)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const uploadBanner = async (file: File, eventId: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${eventId}-banner.${fileExt}`
    const filePath = `event-banners/${fileName}`

    const { error } = await supabase.storage
      .from('events')
      .upload(filePath, file, { upsert: true })

    if (error) {
      console.error('Error uploading banner:', error)
      return null
    }

    const { data } = supabase.storage
      .from('events')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!profile) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      // Create event
      const eventData = {
        name: formData.name,
        description: formData.description,
        location: formData.location,
        date: formData.date,
        time: formData.time,
        sport_type: formData.sport_type,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        creator_id: profile.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        latitude: 0, // TODO: Implement geolocation
        longitude: 0 // TODO: Implement geolocation
      }

      const { data: eventResult, error: eventError } = await supabase
        .from('events')
        .insert(eventData)
        .select()
        .single()

      if (eventError) throw eventError

      // Upload banner if provided
      if (bannerFile && eventResult) {
        const bannerUrl = await uploadBanner(bannerFile, eventResult.id)
        if (bannerUrl) {
          await supabase
            .from('events')
            .update({ banner_url: bannerUrl })
            .eq('id', eventResult.id)
        }
      }

      toast({
        title: "Evento criado!",
        description: "Seu evento foi criado com sucesso.",
      })

      navigate(`/event/${eventResult.id}`)
    } catch (error) {
      console.error('Error creating event:', error)
      toast({
        title: "Erro",
        description: "Não foi possível criar o evento. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Get tomorrow's date as minimum
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
          <div>
            <h1 className="text-2xl font-bold">Criar Evento</h1>
            <p className="text-muted-foreground">
              Organize um evento esportivo na sua cidade
            </p>
          </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Evento *</Label>
              <Input
                id="name"
                placeholder="Ex: Pelada de Futebol no Parque"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição *</Label>
              <Textarea
                id="description"
                placeholder="Descreva seu evento, regras, o que levar..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                required
              />
            </div>

            <div>
              <Label htmlFor="sport">Tipo de Esporte *</Label>
              <select
                id="sport"
                className="w-full px-3 py-2 bg-background border border-input rounded-md"
                value={formData.sport_type}
                onChange={(e) => handleInputChange('sport_type', e.target.value)}
              >
                {sports.map(sport => (
                  <option key={sport} value={sport}>
                    {sport.charAt(0).toUpperCase() + sport.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="banner">Banner do Evento (opcional)</Label>
              <div className="space-y-2">
                <Input
                  id="banner"
                  type="file"
                  accept="image/*"
                  onChange={handleBannerChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('banner')?.click()}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {bannerFile ? bannerFile.name : 'Escolher imagem'}
                </Button>
                {bannerFile && (
                  <div className="mt-2">
                    <img 
                      src={URL.createObjectURL(bannerFile)} 
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-md"
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data e Local</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Data *</Label>
                <Input
                  id="date"
                  type="date"
                  min={minDate}
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="time">Horário *</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="location">Local *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="location"
                  placeholder="Ex: Quadra do Parque Vila Lobos, São Paulo"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configurações Adicionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="max_participants">Limite de Participantes (opcional)</Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="max_participants"
                  type="number"
                  min="2"
                  max="100"
                  placeholder="Deixe vazio para sem limite"
                  value={formData.max_participants}
                  onChange={(e) => handleInputChange('max_participants', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-primary hover:opacity-90 shadow-glow"
          >
            {loading ? 'Criando...' : 'Criar Evento'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default CreateEvent