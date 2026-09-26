export const getHealth = (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "dhaka-tesla-pool-api",
  });
};
