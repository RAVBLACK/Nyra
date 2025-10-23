export class AnomalyDetector {
  constructor() {
    this.threshold = 3.5; // Threshold for detecting a fall (in Gs)
    this.zeroThreshold = 0.2; // Near-zero threshold for detecting abrupt stops
    this.zeroDuration = 2000; // Duration (in ms) to confirm an abrupt stop
    this.lastNormalTime = null;
  }

  // Calculate the magnitude of the acceleration vector
  calculateMagnitude(x, y, z) {
    return Math.sqrt(x ** 2 + y ** 2 + z ** 2);
  }

  // Process accelerometer data and detect anomalies
  processData(x, y, z) {
    const magnitude = this.calculateMagnitude(x, y, z);

    // Detect a potential fall
    if (magnitude > this.threshold) {
      return "FALL";
    }

    // Detect an abrupt stop
    if (magnitude < this.zeroThreshold) {
      if (!this.lastNormalTime) {
        this.lastNormalTime = Date.now();
      } else if (Date.now() - this.lastNormalTime > this.zeroDuration) {
        this.lastNormalTime = null;
        return "STOP";
      }
    } else {
      // Reset the timer if the magnitude is normal
      this.lastNormalTime = null;
    }

    // No anomaly detected
    return null;
  }
}

export default new AnomalyDetector();