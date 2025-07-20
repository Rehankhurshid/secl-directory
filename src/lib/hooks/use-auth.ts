import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

interface Employee {
  id: number;
  empCode: string;
  name: string;
  department: string | null;
  designation: string | null;
  emailId: string | null;
  role?: string;
  profileImage?: string;
}

interface AuthState {
  employee: Employee | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

async function fetchCurrentUser(): Promise<Employee | null> {
  const token = localStorage.getItem('sessionToken');
  const expiry = localStorage.getItem('sessionExpiry');
  
  console.log('Fetching current user - Token:', token ? 'exists' : 'missing');
  
  if (!token) {
    console.log('No session token found');
    return null;
  }
  
  // Check if session is expired
  if (expiry && new Date(expiry) < new Date()) {
    console.log('Session expired, clearing tokens');
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('sessionExpiry');
    return null;
  }
  
  try {
    const response = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      console.log('Auth API returned error:', response.status);
      // Don't clear the token immediately - let the user retry
      if (response.status === 401) {
        // Only clear for unauthorized (invalid token)
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('sessionExpiry');
      }
      return null;
    }
    
    const data = await response.json();
    console.log('Successfully fetched user:', data.employee?.name);
    return data.employee;
  } catch (error) {
    console.error('Failed to fetch current user:', error);
    return null;
  }
}

export function useAuth(): AuthState {
  const { data: employee, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchCurrentUser,
    retry: false,
    staleTime: Infinity, // Never consider stale - manual invalidation only
  });

  return {
    employee: employee || null,
    isAuthenticated: !!employee,
    isLoading,
  };
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('sessionToken');
      
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
      
      // Clear local storage
      localStorage.removeItem('sessionToken');
      localStorage.removeItem('sessionExpiry');
    },
    onSuccess: () => {
      // Clear auth cache
      queryClient.setQueryData(['auth', 'me'], null);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      
      // Redirect to login
      router.push('/login');
    },
  });
}