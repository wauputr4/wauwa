const throttle = {};

const throttleHelper = (req, res, next) => {
  const ip = req.ip; // Assuming the IP address is available in req.ip -> key

  // Check if the IP address is already throttled
  if (throttle[ip]) {
    const currentTime = new Date().getTime();
    const elapsedTime = currentTime - throttle[ip].timestamp;

    // If the elapsed time is less than one hour and the request count exceeds the maximum limit
    if (elapsedTime < 3600000 && throttle[ip].count >= 500) {
      return res.status(429).json({
        status: false,
        message: "Too many requests from this IP. Please try again later.",
      });
    }

    // If the elapsed time is more than one hour, reset the throttle
    if (elapsedTime >= 3600000) {
      throttle[ip].count = 0;
    }
  } else {
    // If the IP address is not throttled, create a new throttle entry
    throttle[ip] = {
      count: 0,
      timestamp: new Date().getTime(),
    };
  }

  // Increment the request count for the IP address
  throttle[ip].count++;

  next();
};

module.exports = throttleHelper;
