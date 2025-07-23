-- Configuração das tabelas para o Sports Gather Pro
-- Execute este script no SQL Editor do seu projeto Supabase

-- 1. Criar tabela de perfis
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  age INTEGER DEFAULT 25,
  city TEXT DEFAULT 'São Paulo',
  favorite_sport TEXT DEFAULT 'futebol',
  avatar_url TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela de eventos
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  latitude DECIMAL DEFAULT 0,
  longitude DECIMAL DEFAULT 0,
  date DATE NOT NULL,
  time TIME NOT NULL,
  sport_type TEXT NOT NULL DEFAULT 'futebol',
  max_participants INTEGER,
  banner_url TEXT,
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar tabela de participantes dos eventos
CREATE TABLE IF NOT EXISTS event_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  checked_in BOOLEAN DEFAULT FALSE,
  checked_in_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(event_id, user_id)
);

-- 4. Criar tabela de fotos dos eventos
CREATE TABLE IF NOT EXISTS event_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  photo_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Criar tabela de anúncios
CREATE TABLE IF NOT EXISTS advertisements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  banner_url TEXT NOT NULL,
  link_url TEXT,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Configurar RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;

-- 7. Criar políticas de segurança para profiles
CREATE POLICY "Usuários podem ver todos os perfis" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Usuários podem inserir seu próprio perfil" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 8. Criar políticas de segurança para events
CREATE POLICY "Todos podem ver eventos" ON events
  FOR SELECT USING (true);

CREATE POLICY "Usuários autenticados podem criar eventos" ON events
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Criadores podem atualizar seus eventos" ON events
  FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Criadores podem deletar seus eventos" ON events
  FOR DELETE USING (auth.uid() = creator_id);

-- 9. Criar políticas de segurança para event_participants
CREATE POLICY "Todos podem ver participantes" ON event_participants
  FOR SELECT USING (true);

CREATE POLICY "Usuários podem se inscrever em eventos" ON event_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem cancelar sua participação" ON event_participants
  FOR DELETE USING (auth.uid() = user_id);

-- 10. Criar políticas de segurança para event_photos
CREATE POLICY "Todos podem ver fotos" ON event_photos
  FOR SELECT USING (true);

CREATE POLICY "Usuários autenticados podem adicionar fotos" ON event_photos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias fotos" ON event_photos
  FOR DELETE USING (auth.uid() = user_id);

-- 11. Criar políticas de segurança para advertisements
CREATE POLICY "Todos podem ver anúncios ativos" ON advertisements
  FOR SELECT USING (is_active = true);

-- 12. Criar bucket de storage para eventos (execute no painel do Supabase Storage)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('events', 'events', true);

-- 13. Criar política de storage para eventos
-- CREATE POLICY "Usuários autenticados podem fazer upload" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'events' AND auth.role() = 'authenticated');

-- CREATE POLICY "Todos podem ver arquivos de eventos" ON storage.objects
--   FOR SELECT USING (bucket_id = 'events');

-- 14. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 15. Criar triggers para atualizar updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

