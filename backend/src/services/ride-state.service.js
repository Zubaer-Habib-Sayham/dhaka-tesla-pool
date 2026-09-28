const ALLOWED_TRANSITIONS = {
  REQUESTED: ["MATCHED", "CANCELLED"],
  MATCHED: ["DRIVER_ARRIVED", "CANCELLED"],
  DRIVER_ARRIVED: ["STARTED"],
  STARTED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

export const validateRideTransition = (fromStatus, toStatus) => {
  const allowedStatuses = ALLOWED_TRANSITIONS[fromStatus] || [];

  if (!allowedStatuses.includes(toStatus)) {
    const error = new Error(
      `Ride cannot move from ${fromStatus} to ${toStatus}.`,
    );

    error.statusCode = 409;
    error.code = "INVALID_RIDE_TRANSITION";

    throw error;
  }
};

export const getAllowedNextStatuses = (status) => {
  return ALLOWED_TRANSITIONS[status] || [];
};
