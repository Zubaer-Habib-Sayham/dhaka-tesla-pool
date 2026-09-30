const toRadians = (degrees) => {
  return (degrees * Math.PI) / 180;
};

export const calculateDistanceKm = (firstZone, secondZone) => {
  const earthRadiusKm = 6371;

  const latitudeDifference = toRadians(
    secondZone.latitude - firstZone.latitude,
  );

  const longitudeDifference = toRadians(
    secondZone.longitude - firstZone.longitude,
  );

  const firstLatitude = toRadians(firstZone.latitude);
  const secondLatitude = toRadians(secondZone.latitude);

  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDifference / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
};

const calculateDirectionSimilarity = (firstRide, secondRide) => {
  const firstLatitudeDifference =
    Number(firstRide.destinationLatitude) - Number(firstRide.pickupLatitude);

  const firstLongitudeDifference =
    Number(firstRide.destinationLongitude) - Number(firstRide.pickupLongitude);

  const secondLatitudeDifference =
    Number(secondRide.destinationLatitude) - Number(secondRide.pickupLatitude);

  const secondLongitudeDifference =
    Number(secondRide.destinationLongitude) -
    Number(secondRide.pickupLongitude);

  const firstMagnitude = Math.sqrt(
    firstLatitudeDifference ** 2 + firstLongitudeDifference ** 2,
  );

  const secondMagnitude = Math.sqrt(
    secondLatitudeDifference ** 2 + secondLongitudeDifference ** 2,
  );

  if (firstMagnitude === 0 || secondMagnitude === 0) {
    return 0;
  }

  return (
    (firstLatitudeDifference * secondLatitudeDifference +
      firstLongitudeDifference * secondLongitudeDifference) /
    (firstMagnitude * secondMagnitude)
  );
};

export const areRoutesCompatible = ({ firstRide, secondRide }) => {
  if (!firstRide.shareRide || !secondRide.shareRide) {
    return false;
  }

  const pickupDistanceKm = calculateDistanceKm(
    {
      latitude: firstRide.pickupLatitude,
      longitude: firstRide.pickupLongitude,
    },
    {
      latitude: secondRide.pickupLatitude,
      longitude: secondRide.pickupLongitude,
    },
  );

  const MAX_PICKUP_DISTANCE_KM = 3;

  if (pickupDistanceKm > MAX_PICKUP_DISTANCE_KM) {
    return false;
  }

  const directionSimilarity = calculateDirectionSimilarity(
    firstRide,
    secondRide,
  );

  const MIN_DIRECTION_SIMILARITY = 0.5;

  return directionSimilarity >= MIN_DIRECTION_SIMILARITY;
};
