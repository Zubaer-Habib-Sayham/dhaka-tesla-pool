const API_BASE_URL = "http://localhost:5000/api";

const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem("dhaka_tesla_pool_token");

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error?.message || "Something went wrong.");

    error.status = response.status;
    error.code = data.error?.code;

    throw error;
  }

  return data;
};

export const registerPassenger = async (userData) => {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });
};

export const loginPassenger = async (credentials) => {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
};

export const getZones = async () => {
  return request("/zones");
};

export const estimateFare = async (rideData) => {
  return request("/rides/estimate", {
    method: "POST",
    body: JSON.stringify(rideData),
  });
};

export const createRide = async (rideData) => {
  return request("/rides", {
    method: "POST",
    body: JSON.stringify(rideData),
  });
};

export const getMyRides = async () => {
  return request("/rides");
};

export const getMyRide = async (rideId) => {
  return request(`/rides/${rideId}`);
};

export const cancelRide = async (rideId) => {
  return request(`/rides/${rideId}/cancel`, {
    method: "POST",
  });
};
