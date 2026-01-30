import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { useServerStatus } from '@/hooks/useServerStatus';
import { NavLink } from '@/components/NavLink';
import { Home, Share2, Plus, Trash2, Edit, LogIn, LogOut, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface StaffMember {
  id: string;
  username: string;
  game_name: string;
  discord_name: string | null;
  email: string | null;
  profile_image_url: string | null;
  role: string;
  tiktok_url: string | null;
  youtube_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
}

const Staff = () => {
  const { status, lastChecked, isLoading, refetch, notificationsEnabled, enableNotifications } = useServerStatus(10000);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string | undefined } | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showStaffDialog, setShowStaffDialog] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    username: '',
    game_name: '',
    discord_name: '',
    email: '',
    role: 'Staff',
    tiktok_url: '',
    youtube_url: '',
    instagram_url: '',
    twitter_url: ''
  });

  useEffect(() => {
    fetchStaffMembers();
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email });
        checkAdminRole(session.user.id);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    });

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

  const fetchStaffMembers = async () => {
    const { data, error } = await supabase
      .from('staff_members')
      .select('*')
      .order('created_at', { ascending: true });

    if (!error && data) {
      setStaffMembers(data);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin }
        });
        if (error) throw error;
        toast({ title: 'Account created!', description: 'You can now log in.' });
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

  const handleSubmitStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingStaff) {
        const { error } = await supabase
          .from('staff_members')
          .update({
            username: formData.username,
            game_name: formData.game_name,
            discord_name: formData.discord_name || null,
            email: formData.email || null,
            role: formData.role,
            tiktok_url: formData.tiktok_url || null,
            youtube_url: formData.youtube_url || null,
            instagram_url: formData.instagram_url || null,
            twitter_url: formData.twitter_url || null
          })
          .eq('id', editingStaff.id);

        if (error) throw error;
        toast({ title: 'Staff member updated!' });
      } else {
        const { error } = await supabase
          .from('staff_members')
          .insert({
            username: formData.username,
            game_name: formData.game_name,
            discord_name: formData.discord_name || null,
            email: formData.email || null,
            role: formData.role,
            tiktok_url: formData.tiktok_url || null,
            youtube_url: formData.youtube_url || null,
            instagram_url: formData.instagram_url || null,
            twitter_url: formData.twitter_url || null,
            created_by: user?.id
          });

        if (error) throw error;
        toast({ title: 'Staff member added!' });
      }

      setShowStaffDialog(false);
      setEditingStaff(null);
      resetForm();
      fetchStaffMembers();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    const { error } = await supabase.from('staff_members').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Staff member deleted' });
      fetchStaffMembers();
    }
  };

  const handleEdit = (staff: StaffMember) => {
    setEditingStaff(staff);
    setFormData({
      username: staff.username,
      game_name: staff.game_name,
      discord_name: staff.discord_name || '',
      email: staff.email || '',
      role: staff.role,
      tiktok_url: staff.tiktok_url || '',
      youtube_url: staff.youtube_url || '',
      instagram_url: staff.instagram_url || '',
      twitter_url: staff.twitter_url || ''
    });
    setShowStaffDialog(true);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      game_name: '',
      discord_name: '',
      email: '',
      role: 'Staff',
      tiktok_url: '',
      youtube_url: '',
      instagram_url: '',
      twitter_url: ''
    });
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

      <main className="max-w-6xl mx-auto px-4 pb-12">
        {/* Mobile-friendly navigation */}
        <nav className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <NavLink to="/" className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-full text-xs sm:text-sm font-medium transition-all">
              <Home className="w-3 h-3 sm:w-4 sm:h-4" />
              Home
            </NavLink>
            <NavLink to="/social" className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-full text-xs sm:text-sm font-medium transition-all">
              <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
              Social Media
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
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
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

        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Our Staff</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Meet the amazing team behind MCNP Network</p>
        </div>

        {isAdmin && (
          <div className="flex justify-center mb-6 sm:mb-8">
            <Dialog open={showStaffDialog} onOpenChange={(open) => {
              setShowStaffDialog(open);
              if (!open) {
                setEditingStaff(null);
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button className="text-sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Staff Member
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[90vw] sm:max-w-md max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmitStaff} className="space-y-3 sm:space-y-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required />
                  </div>
                  <div>
                    <Label htmlFor="game_name">In-Game Name</Label>
                    <Input id="game_name" value={formData.game_name} onChange={(e) => setFormData({ ...formData, game_name: e.target.value })} required />
                  </div>
                  <div>
                    <Label htmlFor="discord_name">Discord Name</Label>
                    <Input id="discord_name" value={formData.discord_name} onChange={(e) => setFormData({ ...formData, discord_name: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="staff@mcnpnetwork.com" />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Input id="role" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} placeholder="e.g., Admin, Moderator, Helper" />
                  </div>
                  <div>
                    <Label htmlFor="tiktok_url">TikTok URL</Label>
                    <Input id="tiktok_url" value={formData.tiktok_url} onChange={(e) => setFormData({ ...formData, tiktok_url: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="youtube_url">YouTube URL</Label>
                    <Input id="youtube_url" value={formData.youtube_url} onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="instagram_url">Instagram URL</Label>
                    <Input id="instagram_url" value={formData.instagram_url} onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="twitter_url">Twitter/X URL</Label>
                    <Input id="twitter_url" value={formData.twitter_url} onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Saving...' : editingStaff ? 'Update' : 'Add Staff Member'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {staffMembers.length === 0 ? (
          <div className="minecraft-border rounded-xl bg-card p-8 sm:p-12 text-center">
            <User className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">No Staff Members Yet</h3>
            <p className="text-sm sm:text-base text-muted-foreground">Staff information will appear here once added by an admin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {staffMembers.map((staff) => (
              <div key={staff.id} className="minecraft-border rounded-xl bg-card p-4 sm:p-6 relative">
                {isAdmin && (
                  <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex gap-1.5 sm:gap-2">
                    <button onClick={() => handleEdit(staff)} className="p-1.5 sm:p-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-all">
                      <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                    <button onClick={() => handleDeleteStaff(staff.id)} className="p-1.5 sm:p-2 bg-destructive/20 hover:bg-destructive/30 rounded-lg transition-all text-destructive">
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                )}
                
                <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <img 
                    src={`https://mc-heads.net/avatar/${staff.game_name}/64`}
                    alt={staff.game_name}
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg"
                  />
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-foreground truncate">{staff.username}</h3>
                    <p className="text-sm sm:text-base text-primary font-medium">{staff.role}</p>
                  </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">In-Game:</span> {staff.game_name}
                  </p>
                  {staff.discord_name && (
                    <p className="text-muted-foreground truncate">
                      <span className="font-medium text-foreground">Discord:</span> {staff.discord_name}
                    </p>
                  )}
                  {staff.email && isAdmin && (
                    <p className="text-muted-foreground truncate">
                      <span className="font-medium text-foreground">Email:</span> {staff.email}
                    </p>
                  )}
                </div>

                {(staff.tiktok_url || staff.youtube_url || staff.instagram_url || staff.twitter_url) && (
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border">
                    {staff.youtube_url && (
                      <a href={staff.youtube_url} target="_blank" rel="noopener noreferrer" className="p-1.5 sm:p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-all text-sm" title="YouTube">
                        🎬
                      </a>
                    )}
                    {staff.tiktok_url && (
                      <a href={staff.tiktok_url} target="_blank" rel="noopener noreferrer" className="p-1.5 sm:p-2 bg-pink-500/20 hover:bg-pink-500/30 rounded-lg transition-all text-sm" title="TikTok">
                        🎵
                      </a>
                    )}
                    {staff.instagram_url && (
                      <a href={staff.instagram_url} target="_blank" rel="noopener noreferrer" className="p-1.5 sm:p-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg transition-all text-sm" title="Instagram">
                        📸
                      </a>
                    )}
                    {staff.twitter_url && (
                      <a href={staff.twitter_url} target="_blank" rel="noopener noreferrer" className="p-1.5 sm:p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-all text-sm" title="Twitter/X">
                        🐦
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <footer className="text-center py-6 sm:py-8 border-t border-border mt-8">
          <p className="text-primary font-medium text-sm sm:text-base">Powered by MCNP Network</p>
          <p className="text-muted-foreground/60 text-xs mt-2">
            Made by Sakshyxm • © {new Date().getFullYear()} MCNP Network
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Staff;
