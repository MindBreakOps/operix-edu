import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface Workspace {
  id: string;
  name: string;
  domain: string;
  operix_edu_active: boolean;
  sub_status: string;
  sub_end_date: string;
}

interface TenantContextType {
  workspace: Workspace | null;
  isLoading: boolean;
}

const TenantContext = createContext<TenantContextType>({ workspace: null, isLoading: true });

export const TenantProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
	const fetchWorkspace = async () => {
	  if (!user) {
		setWorkspace(null);
		setIsLoading(false);
		return;
	  }

	  // جلب مساحة العمل المرتبطة بملف المستخدم (Profile)
	  // نفترض أن جدول profiles يحتوي على workspace_id
	  const { data: profile } = await supabase
		.from('profiles')
		.select('workspace_id')
		.eq('id', user.id)
		.single();

	  if (profile?.workspace_id) {
		const { data: wsData } = await supabase
		  .from('workspaces')
		  .select('*')
		  .eq('id', profile.workspace_id)
		  .single();
		
		setWorkspace(wsData);
	  }
	  setIsLoading(false);
	};

	fetchWorkspace();
  }, [user]);

  return (
	<TenantContext.Provider value={{ workspace, isLoading }}>
	  {children}
	</TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);