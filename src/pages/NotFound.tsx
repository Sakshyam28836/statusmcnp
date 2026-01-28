import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    // Auto-redirect to home after a brief moment
    const timer = setTimeout(() => {
      navigate('/', { replace: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [location.pathname, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-foreground">Redirecting...</h1>
        <p className="text-muted-foreground">Taking you back home</p>
      </div>
    </div>
  );
};

export default NotFound;
