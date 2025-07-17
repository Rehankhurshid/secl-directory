import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Employee, LoginRequest, VerifyOtpRequest, UpdateProfileImageRequest } from "@shared/schema";

interface AuthState {
  employee: Employee | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface LoginResponse {
  success: boolean;
  sessionId: string;
  message: string;
}

interface VerifyOtpResponse {
  success: boolean;
  sessionToken: string;
  expiresAt: string;
  employee: Employee;
}

interface LogoutResponse {
  success: boolean;
  message: string;
}

interface ProfileImageResponse {
  success: boolean;
  employee: Employee;
}

export function useAuth(): AuthState {
  const { data: employee, isLoading, error } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const token = localStorage.getItem("sessionToken");
      const expiry = localStorage.getItem("sessionExpiry");
      
      if (!token) {
        console.log("No token found, user not authenticated");
        return null;
      }
      
      if (isSessionExpired()) {
        console.log("Session expired, clearing token");
        localStorage.removeItem("sessionToken");
        localStorage.removeItem("sessionExpiry");
        return null;
      }
      
      try {
        const response = await apiRequest<{ employee: Employee }>("/api/auth/me");
        console.log("Authentication successful:", response.employee?.name);
        return response.employee;
      } catch (error) {
        console.log("Authentication failed:", error);
        // If auth fails, clear the token
        localStorage.removeItem("sessionToken");
        localStorage.removeItem("sessionExpiry");
        return null; // Return null instead of throwing to prevent error state
      }
    },
    retry: false,
    staleTime: Infinity, // Never consider stale
    refetchOnWindowFocus: false,
    refetchInterval: false,
    refetchOnMount: false,
    refetchOnReconnect: false
  });

  return {
    employee: employee || null,
    isAuthenticated: !!employee,
    isLoading,
  };
}

export function useLogin() {
  return useMutation({
    mutationFn: async (data: LoginRequest): Promise<LoginResponse> => {
      return await apiRequest<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  });
}

export function useVerifyOtp() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: VerifyOtpRequest): Promise<VerifyOtpResponse> => {
      return await apiRequest<VerifyOtpResponse>("/api/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      // Store session token
      localStorage.setItem("sessionToken", data.sessionToken);
      localStorage.setItem("sessionExpiry", data.expiresAt);
      
      console.log("Session stored successfully for:", data.employee.name);
      
      // Update auth cache
      queryClient.setQueryData(["auth", "me"], data.employee);
      
      // Don't invalidate other queries to avoid unnecessary refetches
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (): Promise<LogoutResponse> => {
      const token = localStorage.getItem("sessionToken");
      if (!token) return { success: true, message: "Already logged out" };
      
      return await apiRequest<LogoutResponse>("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      // Clear local storage
      localStorage.removeItem("sessionToken");
      localStorage.removeItem("sessionExpiry");
      
      // Clear auth cache
      queryClient.setQueryData(["auth", "me"], null);
      
      // Only clear queries that need authentication
      queryClient.clear();
    },
  });
}

export function useUpdateProfileImage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: UpdateProfileImageRequest): Promise<ProfileImageResponse> => {
      const token = localStorage.getItem("sessionToken");
      if (!token) throw new Error("Not authenticated");
      
      console.log("Sending profile image update request:", {
        hasProfileImage: !!data.profileImage,
        profileImageLength: data.profileImage?.length,
        dataKeys: Object.keys(data),
        actualData: data
      });
      
      console.log("JSON stringified data:", JSON.stringify(data));
      
      return await apiRequest<ProfileImageResponse>("/api/auth/profile-image", {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      // Update the cached employee data
      queryClient.setQueryData(["auth", "me"], data.employee);
      
      // Update queries only if necessary
    },
  });
}

// Helper function to check if session is expired
export function isSessionExpired(): boolean {
  const expiry = localStorage.getItem("sessionExpiry");
  if (!expiry) return true;
  
  try {
    return new Date() >= new Date(expiry);
  } catch {
    // If date parsing fails, consider expired
    return true;
  }
}

// Helper function to get auth headers
export function getAuthHeaders(): { Authorization: string } | {} {
  const token = localStorage.getItem("sessionToken");
  if (!token || isSessionExpired()) {
    return {};
  }
  return { Authorization: `Bearer ${token}` };
}