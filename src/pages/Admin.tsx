import { useState, useEffect, useCallback } from 'react';
import { NavLink } from '@/components/NavLink';
import {
  Home, Share2, UserCircle, CalendarDays, Shield, Search, LogIn, LogOut,
  Crown, Users, UserCheck, Trash2, Plus
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

type AppRole = 'admin' | 'moderator' | 'user';

interface UserRole {
  user_id: string;
  role: AppRole;
  email: string | null;
  display_name: string | null;
  assigned_at: string;
}

interface SearchResult {
  user_id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
}

const roleConfig: Record<AppRole, { label: string; icon: typeof Crown; color: string; bg: string }> = {
  admin: { label: 'Admin', icon: Crown, color: 'text-warning', bg: 'bg-warning/10 border-warning/30' },
  moderator: { label: 'Moderator', icon: Shield, color: 'text-primary', bg: 'bg-primary/10 border-primary/30' },
  user: { label: 'User', icon: UserCheck, color: 'text-muted-foreground', bg: 'bg-secondary border-border' },
};

export default function Admin() {
  const { toast } = useToast();
  const [user, setUser] = useState<{ id: string; email: string | undefined } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Role management state
  const [allRoles, setAllRoles] = useState<UserRole[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AppRole>('moderator');

  const checkAdminRole = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    setIsAdmin(!!data && !error);
  }, []);

  const fetchAllRoles = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_all_user_roles');
    if (!error && data) {
      setAllRoles(data as UserRole[]);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email });
        setTimeout(() => checkAdminRole(session.user.id), 0);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email });
        checkAdminRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [checkAdminRole]);

  useEffect(() => {
    if (isAdmin) fetchAllRoles();
  }, [isAdmin, fetchAllRoles]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
        if (error) throw error;
        toast({ title: 'Account created!', description: 'Check your email for verification.' });
        setAuthMode('login');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: 'Logged in successfully!' });
        setShowAuthDialog(false);
        setEmail('');
        setPassword('');
      }
    } catch (error: unknown) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'An error occurred', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    toast({ title: 'Logged out successfully' });
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    const { data, error } = await supabase.rpc('search_profiles_by_email', { search_email: searchQuery.trim() });
    if (!error && data) {
      setSearchResults(data as SearchResult[]);
    } else {
      toast({ title: 'Search failed', description: error?.message, variant: 'destructive' });
    }
    setSearching(false);
  };

  const assignRole = async (userId: string, role: AppRole) => {
    setLoading(true);
    const { error } = await supabase.from('user_roles').upsert(
      { user_id: userId, role },
      { onConflict: 'user_id,role' }
    );
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Role assigned!', description: `${role} role has been assigned.` });
      fetchAllRoles();
    }
    setLoading(false);
  };

  const removeRole = async (userId: string, role: AppRole) => {
    setLoading(true);
    const { error } = await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', role);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Role removed!', description: `${role} role has been removed.` });
      fetchAllRoles();
    }
    setLoading(false);
  };

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/social', icon: Share2, label: 'Social' },
    { to: '/staff', icon: UserCircle, label: 'Staff' },
    { to: '/events', icon: CalendarDays, label: 'Events' },
    { to: '/admin', icon: Shield, label: 'Admin' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border px-3 py-2">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all whitespace-nowrap" activeClassName="bg-primary/10 text-primary">
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
          </div>
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:inline truncate max-w-[120px]">{user.email}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-xs">
                <LogOut className="w-3.5 h-3.5 mr-1" /> Logout
              </Button>
            </div>
          ) : (
            <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs">
                  <LogIn className="w-3.5 h-3.5 mr-1" /> Admin Login
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[90vw] sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{authMode === 'login' ? 'Admin Login' : 'Create Account'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAuth} className="space-y-4">
                  <div>
                    <Label htmlFor="admin-email">Email</Label>
                    <Input id="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="admin-password">Password</Label>
                    <Input id="admin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Loading...' : authMode === 'login' ? 'Login' : 'Sign Up'}
                  </Button>
                  <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">or</span></div>
                  </div>
                  <Button type="button" variant="outline" className="w-full flex items-center gap-2" disabled={loading} onClick={async () => {
                    const { lovable } = await import('@/integrations/lovable/index');
                    const result = await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin });
                    if (result.error) toast({ title: 'Error', description: String(result.error), variant: 'destructive' });
                  }}>
                    <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Sign in with Google
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

      <div className="max-w-4xl mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
            <Shield className="w-7 h-7 text-primary" />
            Admin Panel
          </h1>
          <p className="text-sm text-muted-foreground">Manage user roles and permissions</p>
        </motion.div>

        {!user && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Admin Access Required</h2>
            <p className="text-muted-foreground mb-4">Please log in with an admin account to manage roles.</p>
            <Button onClick={() => setShowAuthDialog(true)}>
              <LogIn className="w-4 h-4 mr-2" /> Login
            </Button>
          </motion.div>
        )}

        {user && !isAdmin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <Shield className="w-16 h-16 mx-auto mb-4 text-destructive/30" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You don't have admin privileges to access this panel.</p>
          </motion.div>
        )}

        {user && isAdmin && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Search Users */}
            <div className="minecraft-border rounded-xl bg-card p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Search className="w-5 h-5 text-primary" />
                Search Users
              </h2>
              <div className="flex gap-2">
                <Input
                  placeholder="Search by email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={searching}>
                  <Search className="w-4 h-4 mr-1" />
                  {searching ? 'Searching...' : 'Search'}
                </Button>
              </div>

              <AnimatePresence>
                {searchResults.length > 0 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 space-y-2">
                    {searchResults.map((result) => {
                      const existingRoles = allRoles.filter(r => r.user_id === result.user_id).map(r => r.role);
                      return (
                        <motion.div
                          key={result.user_id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-secondary/50 border border-border"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{result.email || 'No email'}</p>
                            <p className="text-xs text-muted-foreground">{result.display_name || 'No name'}</p>
                            {existingRoles.length > 0 && (
                              <div className="flex gap-1 mt-1 flex-wrap">
                                {existingRoles.map(role => {
                                  const config = roleConfig[role];
                                  return (
                                    <span key={role} className={`text-[10px] px-2 py-0.5 rounded-full border ${config.bg} ${config.color}`}>
                                      {config.label}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                              <SelectTrigger className="w-[130px] h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="moderator">Moderator</SelectItem>
                                <SelectItem value="user">User</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              onClick={() => assignRole(result.user_id, selectedRole)}
                              disabled={loading || existingRoles.includes(selectedRole)}
                              className="text-xs h-8"
                            >
                              <Plus className="w-3 h-3 mr-1" /> Assign
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Current Roles */}
            <div className="minecraft-border rounded-xl bg-card p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Current Roles
                <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">{allRoles.length}</span>
              </h2>

              {allRoles.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No roles assigned yet.</p>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence>
                    {allRoles.map((ur, i) => {
                      const config = roleConfig[ur.role];
                      const RoleIcon = config.icon;
                      return (
                        <motion.div
                          key={`${ur.user_id}-${ur.role}`}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ delay: i * 0.03 }}
                          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border ${config.bg}`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-card ${config.color}`}>
                              <RoleIcon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{ur.email || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground">{ur.display_name || 'No name'} • {config.label}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRole(ur.user_id, ur.role)}
                            disabled={loading}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs self-end sm:self-auto"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                          </Button>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
