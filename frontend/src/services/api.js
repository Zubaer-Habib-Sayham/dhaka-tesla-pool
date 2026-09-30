import { getToken, getCurrentUser, saveAuth } from "./auth";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const DEMO_KEY = "dhaka_tesla_pool_demo_rides_v1";
const active = (ride) => !["COMPLETED", "CANCELLED"].includes(ride.status);
const demoZones = [
  { id: 1, name: "Banani", latitude: 23.7937, longitude: 90.4066 },
  { id: 2, name: "Mohakhali", latitude: 23.7772, longitude: 90.3996 },
  { id: 3, name: "Gulshan 1", latitude: 23.7806, longitude: 90.4169 },
  { id: 4, name: "Dhanmondi", latitude: 23.7461, longitude: 90.3742 },
  { id: 5, name: "Mirpur", latitude: 23.8223, longitude: 90.3654 },
  { id: 6, name: "Uttara", latitude: 23.8759, longitude: 90.3795 },
  { id: 7, name: "Farmgate", latitude: 23.7577, longitude: 90.3897 },
  { id: 8, name: "Bashundhara", latitude: 23.8151, longitude: 90.4255 },
];
export const isDemoMode = () => getToken() === "demo-session";
const demoUser = (role) => role === "DRIVER"
  ? { id: "demo-driver", name: "Jashim", role, email: "jashim@example.com" }
  : { id: "demo-passenger", name: "Nusrat", role, email: "nusrat@example.com" };
export const startDemo = () => {
  const now = new Date().toISOString();
  const sample = (id, passengerId, name, status, destination) => ({
    id, passenger_id: passengerId, passenger_name: name, pickup_zone_id: 1,
    pickup_zone_name: "Banani", destination_zone_id: destination,
    destination_zone_name: demoZones.find((z) => z.id === destination).name,
    requested_seats: 1, share_ride: true, status,
    fare_amount: demoFare({ pickupZoneId: 1, destinationZoneId: destination }).fareAmount, payment_method: "CASH",
    payment_status: "PENDING", created_at: now, updated_at: now,
    pool_id: status === "MATCHED" ? 1 : null, tesla_name: status === "MATCHED" ? "Bullet" : null,
    history: [{ id: `${id}-requested`, to_status: "REQUESTED", created_at: now },
      ...(status === "MATCHED" ? [{ id: `${id}-matched`, to_status: "MATCHED", created_at: now }] : [])],
  });
  sessionStorage.setItem(DEMO_KEY, JSON.stringify({ online: true, rides: [sample(101, "demo-passenger", "Nusrat", "MATCHED", 2), sample(102, "demo-rafiq", "Rafiq", "REQUESTED", 3)] }));
  const result = { token: "demo-session", user: demoUser("DRIVER") };
  saveAuth(result); return result;
};
export const switchDemoRole = () => {
  const result = { token: "demo-session", user: demoUser(getCurrentUser().role === "DRIVER" ? "PASSENGER" : "DRIVER") };
  saveAuth(result); return result;
};
const demoFare = (data) => {
  const from = demoZones.find((z) => z.id === Number(data.pickupZoneId));
  const to = demoZones.find((z) => z.id === Number(data.destinationZoneId));
  if (!from || !to || from.id === to.id) throw new Error("Choose two different areas.");
  const rad = (n) => n * Math.PI / 180;
  const a = Math.sin(rad(to.latitude - from.latitude) / 2) ** 2 + Math.cos(rad(from.latitude)) * Math.cos(rad(to.latitude)) * Math.sin(rad(to.longitude - from.longitude) / 2) ** 2;
  const km = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceCharge = Math.ceil(km * 20);
  const poolDiscount = data.shareRide === false ? 0 : 20;
  return { baseFare: 50, distanceCharge, distanceKm: Number(km.toFixed(2)), poolDiscount, fareAmount: Math.max(50, 50 + distanceCharge - poolDiscount) };
};
const demoRequest = (endpoint, options) => {
  const state = JSON.parse(sessionStorage.getItem(DEMO_KEY));
  if (!state) throw new Error("Test session expired. Exit and start the test again.");
  const user = getCurrentUser();
  const data = options.body ? JSON.parse(options.body) : {};
  const persist = () => sessionStorage.setItem(DEMO_KEY, JSON.stringify(state));
  if (endpoint === "/zones") return { zones: demoZones };
  if (endpoint === "/rides/estimate") return { fare: demoFare(data) };
  if (endpoint === "/driver/me") return { driver: { driver_name: "Jashim", tesla_name: "Bullet", capacity: 3, tesla_status: state.online ? "ONLINE" : "OFFLINE" } };
  if (["/driver/online", "/driver/offline"].includes(endpoint)) {
    if (endpoint.endsWith("offline") && state.rides.some((r) => r.pool_id && active(r))) throw new Error("Complete your active rides before going offline.");
    state.online = endpoint.endsWith("online"); persist();
    return { driver: { driver_name: "Jashim", tesla_name: "Bullet", capacity: 3, tesla_status: state.online ? "ONLINE" : "OFFLINE" } };
  }
  if (endpoint === "/driver/requests") return { rides: state.rides.filter((r) => r.status === "REQUESTED") };
  if (endpoint === "/driver/rides") return { rides: state.rides.filter((r) => r.pool_id) };
  if (endpoint === "/rides" && options.method === "POST") {
    if (state.rides.some((r) => r.passenger_id === user.id && active(r))) throw new Error("You already have an active ride. Complete or cancel it first.");
    const fare = demoFare(data);
    const now = new Date().toISOString();
    const ride = { id: Date.now(), passenger_id: user.id, passenger_name: user.name,
      pickup_zone_id: Number(data.pickupZoneId), destination_zone_id: Number(data.destinationZoneId),
      pickup_zone_name: demoZones.find((z) => z.id === Number(data.pickupZoneId)).name,
      destination_zone_name: demoZones.find((z) => z.id === Number(data.destinationZoneId)).name,
      requested_seats: Number(data.requestedSeats), share_ride: data.shareRide !== false,
      payment_method: data.paymentMethod, payment_status: "PENDING", fare_amount: fare.fareAmount,
      status: "REQUESTED", created_at: now, updated_at: now,
      history: [{ id: now, to_status: "REQUESTED", created_at: now }] };
    state.rides.unshift(ride); persist(); return { ride };
  }
  if (endpoint === "/rides") return { rides: state.rides.filter((r) => r.passenger_id === user.id) };
  const match = endpoint.match(/^\/(?:driver\/)?rides\/(\d+)(?:\/(cancel|accept|arrive|start|complete))?$/);
  if (match) {
    const ride = state.rides.find((r) => String(r.id) === match[1]);
    const action = match[2];
    if (!ride || (user.role === "PASSENGER" && ride.passenger_id !== user.id)) throw new Error("Ride not found.");
    if (!action) return { ride, history: ride.history };
    const transitions = { accept: ["REQUESTED", "MATCHED"], arrive: ["MATCHED", "DRIVER_ARRIVED"], start: ["DRIVER_ARRIVED", "STARTED"], complete: ["STARTED", "COMPLETED"] };
    if (action === "cancel") {
      if (!["REQUESTED", "MATCHED"].includes(ride.status)) throw new Error("This ride can no longer be cancelled.");
      ride.status = "CANCELLED";
    } else {
      if (!state.online) throw new Error("Go online before managing rides.");
      const [from, to] = transitions[action];
      if (ride.status !== from) throw new Error("Ride status has changed. Refresh and try again.");
      if (action === "accept") {
        const members = state.rides.filter((r) => r.pool_id && active(r));
        if (members.reduce((n, r) => n + r.requested_seats, 0) + ride.requested_seats > 3) throw new Error("Not enough seats in Bullet.");
        if (members.some((r) => !r.share_ride) || (members.length && !ride.share_ride)) throw new Error("A private ride cannot join an active pool.");
        if (members.some((r) => r.pickup_zone_id !== ride.pickup_zone_id)) throw new Error("This test route cannot join Bullet’s current pool.");
        ride.pool_id = members[0]?.pool_id || Date.now(); ride.tesla_name = "Bullet";
      } else if (!ride.pool_id) throw new Error("This ride is not assigned to you.");
      ride.status = to;
    }
    ride.updated_at = new Date().toISOString();
    ride.history.push({ id: `${ride.id}-${ride.status}`, to_status: ride.status, created_at: ride.updated_at });
    persist(); return { ride };
  }
  throw new Error("This action is unavailable in test mode.");
};
const request = async (endpoint, options = {}) => {
  if (isDemoMode()) return demoRequest(endpoint, options);
  const token = getToken();
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
  } catch { throw new Error("Cannot reach the server. Check that the backend is running on port 5000."); }
  const data = await response.json();
  if (!response.ok) {
    const fields = Object.values(data.error?.fields || {}).flat().join(" ");
    const error = new Error(fields || data.error?.message || "Something went wrong.");
    error.status = response.status; error.code = data.error?.code; throw error;
  }
  return data;
};
const post = (endpoint, data) => request(endpoint, { method: "POST", ...(data ? { body: JSON.stringify(data) } : {}) });
export const registerPassenger = (data) => post("/auth/register", data);
export const loginPassenger = (data) => post("/auth/login", data);
export const getZones = () => request("/zones");
export const estimateFare = (data) => post("/rides/estimate", data);
export const createRide = (data) => post("/rides", data);
export const getMyRides = () => request("/rides");
export const getMyRide = (id) => request(`/rides/${id}`);
export const cancelRide = (id) => post(`/rides/${id}/cancel`);
export const getDriverProfile = () => request("/driver/me");
export const getDriverRequests = () => request("/driver/requests");
export const getDriverRides = () => request("/driver/rides");
export const setDriverAvailability = (online) => post(`/driver/${online ? "online" : "offline"}`);
export const updateDriverRide = (id, action) => post(`/driver/rides/${id}/${action}`);
