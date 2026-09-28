import {
  getDriverProfile,
  setDriverOnline,
  setDriverOffline,
  getDriverRequests,
} from "../services/driver.service.js";

export const getMe = async (req, res, next) => {
  try {
    const driver = await getDriverProfile(req.user.userId);

    res.status(200).json({
      driver,
    });
  } catch (error) {
    next(error);
  }
};

export const goOnline = async (req, res, next) => {
  try {
    const driver = await setDriverOnline(req.user.userId);

    res.status(200).json({
      message: "Tesla is now online.",
      driver,
    });
  } catch (error) {
    next(error);
  }
};

export const goOffline = async (req, res, next) => {
  try {
    const driver = await setDriverOffline(req.user.userId);

    res.status(200).json({
      message: "Tesla is now offline.",
      driver,
    });
  } catch (error) {
    next(error);
  }
};

export const getRequests = async (req, res, next) => {
  try {
    const rides = await getDriverRequests();

    res.status(200).json({
      rides,
    });
  } catch (error) {
    next(error);
  }
};
