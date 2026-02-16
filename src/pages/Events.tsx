import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { useServerStatus } from '@/hooks/useServerStatus';
import { NavLink } from '@/components/NavLink';
import { Home, Share2, UserCircle, Plus, Trash2, CalendarDays, Trophy, Clock, LogIn, LogOut, User, ImagePlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface Event {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  prize_pool: string | null;
  start_date: string | null;
  end_date: string | null;
  details: string | null;
  created_at: string;
}

const Events = () => {
  const { status, lastChecked, isLoading, refetch, notificationsEnabled, enableNotifications } = useServerStatus(10000);
  const [events, setEvents] = useState<Event[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string | undefined } | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    prize_pool: '',
    start_date: '',
    end_date: '',
    details: '',
  });

  useEffect(() => {
    fetchEvents();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email });
        checkAdminRole(session.user.id);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    });
    checkAuth();
    return () => subscription.unsubscribe();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser({ id: session.user.id, email: session.user.email });
      checkAdminRole(session.user.id);
    }
  };

  const checkAdminRole = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    setIsAdmin(!!data && !error);
  };

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('start_date', { ascending: false });
    if (!error && data) setEvents(data);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin }
        });
        if (error) throw error;
        toast({ title: 'Account created!', description: 'Check your email for verification.' });
        setAuthMode('login');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: 'Logged in successfully!' });
        setShowAuthDialog(false);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: 'Logged out successfully' });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    setLoading(true);

    try {
      let imageUrl: string | null = null;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('event-images')
          .upload(fileName, imageFile);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('event-images')
          .getPublicUrl(fileName);
        imageUrl = publicUrl;
      }

      const { error } = await supabase.from('events').insert({
        title: formData.title,
        description: formData.description || null,
        image_url: imageUrl,
        prize_pool: formData.prize_pool || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        details: formData.details || null,
        created_by: user?.id,
      });

      if (error) throw error;
      toast({ title: 'Event created!' });
      setShowEventDialog(false);
      resetForm();
      fetchEvents();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Event deleted' });
      fetchEvents();
    }
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', prize_pool: '', start_date: '', end_date: '', details: '' });
    setImageFile(null);
    setImagePreview(null);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'TBA';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const getEventStatus = (start: string | null, end: string | null) => {
    if (!start) return { label: 'Upcoming', color: 'bg-primary/20 text-primary' };
    const now = new Date();
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : null;
    if (now < startDate) return { label: 'Upcoming', color: 'bg-primary/20 text-primary' };
    if (endDate && now > endDate) return { label: 'Ended', color: 'bg-muted text-muted-foreground' };
    return { label: 'Live Now', color: 'bg-success/20 text-success' };
  };

  return (
    <div className="min-h-screen bg-background bg-grid-pattern">
      <Header
        status={status}
        lastChecked={lastChecked}
        onRefresh={refetch}
        isLoading={isLoading}
        notificationsEnabled={notificationsEnabled}
        onEnableNotifications={enableNotifications}
      />

      <main className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 pb-8 sm:pb-12">
        {/* Navigation */}
        <nav className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <NavLink to="/" className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-secondary hover:bg-secondary/80 rounded-full text-xs sm:text-sm font-medium transition-all hover:scale-105">
              <Home className="w-3 h-3 sm:w-4 sm:h-4" />
              Home
            </NavLink>
            <NavLink to="/social" className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-secondary hover:bg-secondary/80 rounded-full text-xs sm:text-sm font-medium transition-all hover:scale-105">
              <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
              Social Media
            </NavLink>
            <NavLink to="/staff" className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-secondary hover:bg-secondary/80 rounded-full text-xs sm:text-sm font-medium transition-all hover:scale-105">
              <UserCircle className="w-3 h-3 sm:w-4 sm:h-4" />
              Staff
            </NavLink>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {user ? (
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <span className="text-muted-foreground text-xs sm:text-sm flex items-center gap-1 sm:gap-2 truncate max-w-[150px] sm:max-w-none">
                  <User className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate">{user.email}</span>
                  {isAdmin && <span className="text-[10px] sm:text-xs bg-primary/20 text-primary px-1.5 sm:px-2 py-0.5 rounded flex-shrink-0">Admin</span>}
                </span>
                <Button variant="outline" size="sm" onClick={handleLogout} className="text-xs sm:text-sm">
                  <LogOut className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                    <LogIn className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Admin Login
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[90vw] sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>{authMode === 'login' ? 'Admin Login' : 'Create Account'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                      <Label htmlFor="auth-email">Email</Label>
                      <Input id="auth-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div>
                      <Label htmlFor="auth-password">Password</Label>
                      <Input id="auth-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Loading...' : authMode === 'login' ? 'Login' : 'Sign Up'}
                    </Button>
                    <p className="text-center text-sm text-muted-foreground">
                      {authMode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                      <button type="button" className="text-primary underline" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}>
                        {authMode === 'login' ? 'Sign Up' : 'Login'}
                      </button>
                    </p>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </nav>

        {/* Page Title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 sm:mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
            <CalendarDays className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
            Events
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">Tournaments, competitions, and community events</p>
        </motion.div>

        {/* Admin: Create Event */}
        {isAdmin && (
          <div className="flex justify-center mb-6 sm:mb-8">
            <Dialog open={showEventDialog} onOpenChange={(open) => {
              setShowEventDialog(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="text-sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[90vw] sm:max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Event</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmitEvent} className="space-y-3 sm:space-y-4">
                  <div>
                    <Label htmlFor="evt-title">Event Title *</Label>
                    <Input id="evt-title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required placeholder="e.g., PvP Tournament Season 2" />
                  </div>
                  <div>
                    <Label htmlFor="evt-desc">Description</Label>
                    <Textarea id="evt-desc" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Brief event description..." rows={3} />
                  </div>
                  <div>
                    <Label htmlFor="evt-image">Event Image</Label>
                    <div className="mt-1">
                      <label htmlFor="evt-image-input" className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg cursor-pointer transition-colors text-sm">
                        <ImagePlus className="w-4 h-4" />
                        {imageFile ? imageFile.name : 'Choose image...'}
                      </label>
                      <input id="evt-image-input" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </div>
                    {imagePreview && (
                      <img src={imagePreview} alt="Preview" className="mt-2 rounded-lg max-h-40 object-cover w-full" />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="evt-prize">Prize Pool</Label>
                    <Input id="evt-prize" value={formData.prize_pool} onChange={(e) => setFormData({ ...formData, prize_pool: e.target.value })} placeholder="e.g., $50 + In-game items" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="evt-start">Start Date</Label>
                      <Input id="evt-start" type="datetime-local" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="evt-end">End Date</Label>
                      <Input id="evt-end" type="datetime-local" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="evt-details">Additional Details</Label>
                    <Textarea id="evt-details" value={formData.details} onChange={(e) => setFormData({ ...formData, details: e.target.value })} placeholder="Rules, requirements, registration info..." rows={4} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Event'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Event List */}
        {events.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="minecraft-border rounded-xl bg-card p-8 sm:p-12 text-center card-glow"
          >
            <CalendarDays className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">No Events Yet</h3>
            <p className="text-sm sm:text-base text-muted-foreground">Stay tuned! Exciting events will be posted here soon.</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {events.map((event, index) => {
              const eventStatus = getEventStatus(event.start_date, event.end_date);
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className="minecraft-border rounded-xl bg-card overflow-hidden card-glow relative group"
                >
                  {/* Event Image */}
                  {event.image_url && (
                    <div className="relative h-40 sm:h-52 overflow-hidden">
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                      <span className={`absolute top-3 right-3 text-[10px] sm:text-xs font-semibold px-2 py-1 rounded-full ${eventStatus.color}`}>
                        {eventStatus.label}
                      </span>
                    </div>
                  )}

                  <div className="p-4 sm:p-5">
                    {/* Status badge if no image */}
                    {!event.image_url && (
                      <span className={`inline-block text-[10px] sm:text-xs font-semibold px-2 py-1 rounded-full mb-3 ${eventStatus.color}`}>
                        {eventStatus.label}
                      </span>
                    )}

                    {/* Admin delete */}
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="absolute top-3 left-3 p-1.5 sm:p-2 bg-destructive/80 hover:bg-destructive rounded-lg transition-all text-destructive-foreground z-10"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    )}

                    <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">{event.title}</h3>

                    {event.description && (
                      <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
                    )}

                    <div className="flex flex-wrap gap-3 mb-3 text-xs sm:text-sm">
                      {event.prize_pool && (
                        <div className="flex items-center gap-1.5 text-warning">
                          <Trophy className="w-3.5 h-3.5" />
                          <span className="font-medium">{event.prize_pool}</span>
                        </div>
                      )}
                      {event.start_date && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatDate(event.start_date)}</span>
                        </div>
                      )}
                    </div>

                    {event.end_date && (
                      <p className="text-[10px] sm:text-xs text-muted-foreground mb-3">
                        Ends: {formatDate(event.end_date)}
                      </p>
                    )}

                    {event.details && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-line">{event.details}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center py-6 sm:py-8 border-t border-border mt-8 sm:mt-12"
        >
          <p className="text-primary font-medium text-xs sm:text-sm">Powered by MCNP Network</p>
          <p className="text-muted-foreground/60 text-[10px] sm:text-xs mt-1.5">
            Made by Sakshyxm • © {new Date().getFullYear()} MCNP Network
          </p>
        </motion.footer>
      </main>
    </div>
  );
};

export default Events;
