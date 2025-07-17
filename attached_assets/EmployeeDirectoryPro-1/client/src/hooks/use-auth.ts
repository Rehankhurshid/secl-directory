import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi, getStoredToken, setStoredToken, removeStoredToken, type AuthUser } from "../lib/auth";
import { useToast } from "./use-toast";

export function useAuth() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const token = getStoredToken();
      if (!token) return null;
      
      try {
        const response = await authApi.getCurrentUser();
        return response.employee;
      } catch (error) {
        removeStoredToken();
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const loginMutation = useMutation({
    mutationFn: async ({ employeeId, otpCode }: { employeeId: string; otpCode: string }) => {
      return authApi.verifyOtp(employeeId, otpCode);
    },
    onSuccess: (data) => {
      setStoredToken(data.sessionToken);
      queryClient.setQueryData(["/api/auth/me"], data.employee);
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees/filter-options"] });
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.employee.name}!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const generateOtpMutation = useMutation({
    mutationFn: authApi.generateOtp,
    onSuccess: (data) => {
      toast({
        title: "OTP sent",
        description: `OTP sent to ${data.phone}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send OTP",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      removeStoredToken();
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.clear();
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    },
    onError: () => {
      // Even if logout fails on server, clear local state
      removeStoredToken();
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.clear();
    },
  });

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login: loginMutation.mutate,
    isLoginLoading: loginMutation.isPending,
    generateOtp: generateOtpMutation.mutate,
    isGeneratingOtp: generateOtpMutation.isPending,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
