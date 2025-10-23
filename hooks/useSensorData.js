import { useState, useEffect } from "react";
import { Accelerometer } from "expo-sensors";

const useSensorData = (callback) => {
  const [subscription, setSubscription] = useState(null);
  const [isListening, setIsListening] = useState(false);

  // Start listening to accelerometer data
  const start = () => {
    if (!subscription) {
      const sub = Accelerometer.addListener((data) => {
        const { x, y, z } = data;
        callback(x, y, z); // Pass sensor data to the provided callback
      });
      setSubscription(sub);
      setIsListening(true);
      Accelerometer.setUpdateInterval(100); // Update interval: 100ms
    }
  };

  // Stop listening to accelerometer data
  const stop = () => {
    if (subscription) {
      subscription.remove();
      setSubscription(null);
      setIsListening(false);
    }
  };

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => stop();
  }, []);

  return { start, stop, isListening };
};

export default useSensorData;