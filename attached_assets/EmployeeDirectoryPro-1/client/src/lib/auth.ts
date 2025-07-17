import { apiRequest } from "./queryClient";

export interface AuthUser {
  id: number;
  employeeId: string;
  name: string;
  email: string;
  designation: string;
  department: string;
  role: string;
  profileImage?: string;
}

export interface AuthResponse {
  sessionToken: string;
  employee: AuthUser;
}

export const authApi = {
  generateOtp: async (employeeId: string): Promise<{ message: string; phone: string; devOtp?: string }> => {
    const response = await apiRequest("POST", "/api/auth/generate-otp", { employeeId });
    return response.json();
  },

  verifyOtp: async (employeeId: string, otpCode: string): Promise<AuthResponse> => {
    const response = await apiRequest("POST", "/api/auth/verify-otp", { employeeId, otpCode });
    return response.json();
  },

  getCurrentUser: async (): Promise<{ employee: AuthUser }> => {
    const response = await apiRequest("GET", "/api/auth/me");
    return response.json();
  },

  logout: async () => {
    const response = await apiRequest("POST", "/api/auth/logout");
    return response.json();
  }
};

export const getStoredToken = (): string | null => {
  return localStorage.getItem("sessionToken");
};

export const setStoredToken = (token: string): void => {
  localStorage.setItem("sessionToken", token);
};

export const removeStoredToken = (): void => {
  localStorage.removeItem("sessionToken");
};
