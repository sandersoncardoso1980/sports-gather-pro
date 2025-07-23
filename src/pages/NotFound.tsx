import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-surface">
      <div className="text-center space-y-6 max-w-md px-4">
        <div className="w-24 h-24 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto shadow-glow">
          <MapPin className="w-12 h-12 text-primary-foreground" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">404</h1>
          <h2 className="text-xl font-semibold text-foreground">Página não encontrada</h2>
          <p className="text-muted-foreground">
            Ops! A página que você está procurando não existe ou foi movida.
          </p>
        </div>
        <Button 
          onClick={() => navigate('/')}
          className="bg-gradient-primary hover:opacity-90 shadow-glow"
        >
          <Home className="w-4 h-4 mr-2" />
          Voltar ao Início
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
