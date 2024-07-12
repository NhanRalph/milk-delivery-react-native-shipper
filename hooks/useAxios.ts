import { getToken } from "@/utils/tokenHelpers";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { AxiosInstance } from "axios";
import { useEffect } from "react";

const axiosInstance: AxiosInstance = axios.create({
  baseURL: "http://10.0.2.2:8000",
  // baseURL: "https://milk-delivery-api.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
});

// Function to refresh the token
const refreshAccessToken = async () => {
  try {
    const refreshToken = await getToken("refreshToken");
    console.log("Refresh Token: (useAxios.ts)", refreshToken);
    
    if (!refreshToken) {
      console.log("No refresh token available, skipping token refresh.");
      return null; // Return null if no refresh token
    }
    const response = await axios.post(
      "https://milk-delivery-api.onrender.com/api/auth/refreshToken",
      { refreshToken }
    );
    await AsyncStorage.setItem("accessToken", response.data.accessToken);
    return response.data.accessToken;
  } catch (error) {
    console.error("Error refreshing access token:", error);
    throw error;
  }
};

// Set up request interceptor
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await getToken("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const newAccessToken = await refreshAccessToken();
        if (!newAccessToken) {
          return Promise.reject(error); // If no new access token, reject error
        }
        axios.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${newAccessToken}`;
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error("Failed to refresh access token:", refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const callApi = async (
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  url: string,
  data?: any
) => {
  try {
    const response = await axiosInstance({
      method,
      url,
      data,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Custom hook to encapsulate Axios logic
export const useAxios = () => {
  useEffect(() => {
    const interceptor = axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const newAccessToken = await refreshAccessToken();
            if (!newAccessToken) {
              return Promise.reject(error); // If no new access token, reject error
            }
            axios.defaults.headers.common[
              "Authorization"
            ] = `Bearer ${newAccessToken}`;
            return axiosInstance(originalRequest);
          } catch (refreshError) {
            console.error("Failed to refresh access token:", refreshError);
            // Optionally handle logout or redirection to login page
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axiosInstance.interceptors.response.eject(interceptor);
    };
  }, []);

  return {
    callApi,
  };
};
