import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import supabase from './lib/supabase';
import { apiFetch } from './lib/api';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Debts from './pages/Debts';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [theme, setTheme] = useState('light');
  const [loading, setLoading] = useState(true);

  // Auth Listener
  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile();
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await apiFetch('/api/settings');
      setProfile(data);
      if (data?.theme) {
        setTheme(data.theme);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle Theme helper
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    // Save to profile in DB (fire and forget)
    if (user) {
      apiFetch('/api/settings', {
        method: 'PUT',
        body: JSON.stringify({
          ...profile,
          theme: newTheme
        })
      }).then(updated => setProfile(updated))
        .catch(err => console.error('Error updating theme in DB:', err));
    }
  };

  // Apply Theme class to root document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 dark:text-slate-400 font-semibold text-sm">جاري تحميل منصة ثروتي...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {user ? (
        // Authenticated Layout
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300" dir="rtl">
          <Sidebar user={user} profile={profile} theme={theme} toggleTheme={toggleTheme} />
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <Routes>
              <Route path="/" element={<Dashboard profile={profile} />} />
              <Route path="/transactions" element={<Transactions profile={profile} />} />
              <Route path="/debts" element={<Debts profile={profile} />} />
              <Route path="/reports" element={<Reports profile={profile} />} />
              <Route path="/profile" element={<Profile profile={profile} setProfile={setProfile} theme={theme} setTheme={setTheme} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      ) : (
        // Unauthenticated Layout
        <div dir="rtl">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      )}
    </BrowserRouter>
  );
}
