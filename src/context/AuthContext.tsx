import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

// Define Role UUIDs
export const ROLES = {
  ADMIN: '16c63ddf-3059-4d8d-9c9d-1c56f263bee6',
  TEACHER: 'b11a322b-749e-45f5-ba33-d395212bed9b',
  ACCOUNTANT: '7b4e1424-b3e8-48ab-8425-26cc4cbd8042',
};

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userRole: string | null; // Added to globally track the real database role
  isLoading: boolean;
  refreshUserSession: () => Promise<void>; 
}

const AuthContext = createContext<AuthContextType>({ 
  session: null, 
  user: null, 
  userRole: null,
  isLoading: true,
  refreshUserSession: async () => {} 
});

// ---------- 1. Pro Tiny Loading Screen ----------
export const ProLoader = () => (
  <div style={loaderStyles.container}>
	<div className="opx-pro-spinner"></div>
	<style>{`
	  .opx-pro-spinner {
		width: 38px;
		height: 38px;
		border: 4px solid rgba(79, 125, 243, 0.15);
		border-top: 4px solid #4f7df3;
		border-radius: 50%;
		animation: opx-spin 0.75s linear infinite;
		box-shadow: 0 0 15px rgba(79, 125, 243, 0.1);
	  }
	  @keyframes opx-spin { 
		0% { transform: rotate(0deg); } 
		100% { transform: rotate(360deg); } 
	  }
	`}</style>
  </div>
);

const loaderStyles: { [key: string]: React.CSSProperties } = {
  container: {
	display: 'flex',
	justifyContent: 'center',
	alignItems: 'center',
	height: '100vh',
	width: '100vw',
	backgroundColor: '#f8fafc', // Clean background to avoid color bugs
	position: 'fixed',
	top: 0,
	left: 0,
	zIndex: 9999, // Ensures no hidden visual contents bleed through
  }
};

// ---------- 2. Auth Provider ----------
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const verifyDeviceAndSetSession = async (currentSession: Session | null, mounted: boolean = true) => {
	if (!currentSession?.user) {
	  if (mounted) {
		setSession(null);
		setUser(null);
		setUserRole(null);
		setIsLoading(false);
	  }
	  return;
	}

	const localDeviceId = localStorage.getItem('opx_device_id');
	let isTrusted = false;

	if (localDeviceId) {
	  try {
		const { data } = await supabase
		  .from('trusted_devices')
		  .select('id')
		  .eq('device_identifier', localDeviceId)
		  .single();
		  
		if (data) isTrusted = true;
	  } catch (err) {
		console.error("Device verification failed:", err);
	  }
	}

	if (mounted) {
	  setSession(currentSession);
	  
	  if (isTrusted) {
		setUser(currentSession.user);
		
		// Fetch the REAL role directly from the database to guarantee accuracy[cite: 4]
		const { data: profile } = await supabase
		  .from('profiles')
		  .select('role_id')
		  .eq('id', currentSession.user.id)
		  .single();
		  
		setUserRole(profile?.role_id || null);
	  } else {
		setUser(null);
		setUserRole(null);
	  }
	  
	  setIsLoading(false);
	}
  };

  const refreshUserSession = useCallback(async () => {
	setIsLoading(true);
	const { data, error } = await supabase.auth.refreshSession();
	
	if (error) {
	  console.error("Failed to refresh session:", error);
	  setIsLoading(false);
	  return;
	}

	if (data.session) {
	  await verifyDeviceAndSetSession(data.session, true);
	}
  }, []);

  useEffect(() => {
	let mounted = true;

	supabase.auth.getSession().then(({ data: { session } }) => {
	  verifyDeviceAndSetSession(session, mounted);
	});

	const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
	  verifyDeviceAndSetSession(session, mounted);
	});

	return () => {
	  mounted = false;
	  subscription.unsubscribe();
	};
  }, []);

  return (
	<AuthContext.Provider value={{ session, user, userRole, isLoading, refreshUserSession }}>
	  {/* Conditionally render the app or the loading screen */}
	  {isLoading ? <ProLoader /> : children}
	</AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

// ---------- 3. Role Guard Component ----------
export const RoleGuard = ({ allowedRoles, children }: { allowedRoles: string[], children: React.ReactNode }) => {
  const { userRole, isLoading } = useAuth();

  if (isLoading) return <ProLoader />;

  // Block access if the user's role is missing or not in the allowed list
  if (!userRole || !allowedRoles.includes(userRole)) {
	return (
	  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e4e8f0', margin: '20px' }}>
		<h2 style={{ color: '#0f172a', fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>الوصول مرفوض</h2>
		<p style={{ color: '#64748b', fontSize: '0.95rem' }}>عذراً، ليس لديك الصلاحيات اللازمة لعرض هذه الصفحة.</p>
	  </div>
	);
  }

  return <>{children}</>;
};