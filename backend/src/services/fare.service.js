const BASE_FARE = 50;
const FARE_PER_KM = 20;
const POOL_DISCOUNT = 20;

const toRadians = (degrees) => {
  return (degrees * Math.PI) / 180;
};

const calculateDistanceKm = (pickupZone, destinationZone) => {
  const earthRadiusKm = 6371;

  const latitudeDifference = toRadians(
    destinationZone.latitude - pickupZone.latitude,
  );

  const longitudeDifference = toRadians(
    destinationZone.longitude - pickupZone.longitude,
  );

  const pickupLatitude = toRadians(pickupZone.latitude);
  const destinationLatitude = toRadians(destinationZone.latitude);

  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(pickupLatitude) *
      Math.cos(destinationLatitude) *
      Math.sin(longitudeDifference / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
};

export const calculateFare = ({
  pickupZone,
  destinationZone,
  requestedSeats,
  isPooled = false,
}) => {
  if (pickupZone.id === destinationZone.id) {
    const error = new Error("Pickup and destination cannot be the same zone.");

    error.statusCode = 400;
    error.code = "INVALID_ROUTE";

    throw error;
  }

  const distanceKm = calculateDistanceKm(pickupZone, destinationZone);

  const distanceCharge = Math.ceil(distanceKm * FARE_PER_KM);

  const subtotal = BASE_FARE + distanceCharge;

  const poolDiscount = isPooled ? POOL_DISCOUNT : 0;

  const fareAmount = Math.max(BASE_FARE, subtotal - poolDiscount);

  return {
    baseFare: BASE_FARE,
    distanceKm: Number(distanceKm.toFixed(2)),
    distanceCharge,
    poolDiscount,
    requestedSeats,
    fareAmount,
  };
};
