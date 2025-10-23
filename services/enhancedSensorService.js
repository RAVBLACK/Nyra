import { Accelerometer, Gyroscope, Magnetometer } from 'expo-sensors';
import { harModelService } from './harModelService';

class EnhancedSensorService {
  constructor() {
    this.isActive = false;
    this.sensorSubscriptions = [];
    this.sensorData = {
      accelerometer: { x: 0, y: 0, z: 0 },
      gyroscope: { x: 0, y: 0, z: 0 },
      magnetometer: { x: 0, y: 0, z: 0 }
    };
    this.dataBuffer = [];
    this.callbacks = [];
    this.samplingRate = 50; // 50Hz sampling rate
    this.lastUpdate = 0;
  }

  async startMonitoring() {
    if (this.isActive) {
      console.log('⚠️ Sensor monitoring already active');
      return;
    }

    try {
      console.log('🚀 Starting enhanced sensor monitoring...');

      // Initialize HAR model
      await harModelService.initialize();

      // Set sensor update intervals
      Accelerometer.setUpdateInterval(1000 / this.samplingRate); // 20ms for 50Hz
      Gyroscope.setUpdateInterval(1000 / this.samplingRate);
      Magnetometer.setUpdateInterval(1000 / this.samplingRate);

      // Subscribe to accelerometer
      const accelSubscription = Accelerometer.addListener(data => {
        this.sensorData.accelerometer = data;
        this.processSensorData();
      });

      // Subscribe to gyroscope
      const gyroSubscription = Gyroscope.addListener(data => {
        this.sensorData.gyroscope = data;
        this.processSensorData();
      });

      // Subscribe to magnetometer
      const magSubscription = Magnetometer.addListener(data => {
        this.sensorData.magnetometer = data;
        this.processSensorData();
      });

      this.sensorSubscriptions = [accelSubscription, gyroSubscription, magSubscription];
      this.isActive = true;

      console.log('✅ Enhanced sensor monitoring started');
      console.log(`📊 Sampling rate: ${this.samplingRate}Hz`);

    } catch (error) {
      console.error('❌ Failed to start enhanced sensor monitoring:', error);
      throw error;
    }
  }

  async processSensorData() {
    const now = Date.now();
    
    // Throttle processing to maintain consistent sampling rate
    if (now - this.lastUpdate < 1000 / this.samplingRate) {
      return;
    }
    
    this.lastUpdate = now;

    // Combine all sensor data into a single array
    const combinedData = [
      this.sensorData.accelerometer.x,
      this.sensorData.accelerometer.y, 
      this.sensorData.accelerometer.z,
      this.sensorData.gyroscope.x,
      this.sensorData.gyroscope.y,
      this.sensorData.gyroscope.z,
      this.sensorData.magnetometer.x,
      this.sensorData.magnetometer.y,
      this.sensorData.magnetometer.z
    ];

    // Add timestamp and magnitude calculations
    const processedData = {
      timestamp: now,
      raw: combinedData,
      accelerometer: {
        ...this.sensorData.accelerometer,
        magnitude: Math.sqrt(
          Math.pow(this.sensorData.accelerometer.x, 2) +
          Math.pow(this.sensorData.accelerometer.y, 2) +
          Math.pow(this.sensorData.accelerometer.z, 2)
        )
      },
      gyroscope: {
        ...this.sensorData.gyroscope,
        magnitude: Math.sqrt(
          Math.pow(this.sensorData.gyroscope.x, 2) +
          Math.pow(this.sensorData.gyroscope.y, 2) +
          Math.pow(this.sensorData.gyroscope.z, 2)
        )
      },
      magnetometer: {
        ...this.sensorData.magnetometer,
        magnitude: Math.sqrt(
          Math.pow(this.sensorData.magnetometer.x, 2) +
          Math.pow(this.sensorData.magnetometer.y, 2) +
          Math.pow(this.sensorData.magnetometer.z, 2)
        )
      }
    };

    // Add to buffer
    this.dataBuffer.push(processedData);

    // Keep buffer at manageable size
    if (this.dataBuffer.length > 1000) {
      this.dataBuffer = this.dataBuffer.slice(-500);
    }

    // Predict activity using HAR model
    try {
      const prediction = await harModelService.predictActivity(combinedData);
      
      if (prediction) {
        processedData.prediction = prediction;
        
        // Check for anomalies
        if (prediction.anomaly) {
          console.log(`🚨 ANOMALY DETECTED: ${prediction.anomaly.type}`);
          console.log(`   Severity: ${prediction.anomaly.severity}`);
          console.log(`   Message: ${prediction.anomaly.message}`);
          
          // Notify callbacks about anomaly
          this.notifyCallbacks({
            type: 'anomaly',
            data: processedData,
            anomaly: prediction.anomaly
          });
        }

        // Notify callbacks about activity update
        this.notifyCallbacks({
          type: 'activity',
          data: processedData,
          prediction
        });
      }
    } catch (error) {
      console.error('❌ Activity prediction error:', error);
    }

    // Notify callbacks about sensor data
    this.notifyCallbacks({
      type: 'sensor',
      data: processedData
    });
  }

  // Add callback for real-time updates
  addCallback(callback) {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  // Notify all callbacks
  notifyCallbacks(event) {
    this.callbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('❌ Callback error:', error);
      }
    });
  }

  // Stop monitoring
  stopMonitoring() {
    if (!this.isActive) {
      console.log('⚠️ Sensor monitoring already stopped');
      return;
    }

    console.log('🛑 Stopping enhanced sensor monitoring...');

    // Unsubscribe from all sensors
    this.sensorSubscriptions.forEach(subscription => {
      subscription && subscription.remove();
    });

    this.sensorSubscriptions = [];
    this.isActive = false;
    this.dataBuffer = [];
    this.callbacks = [];

    // Reset HAR model
    harModelService.reset();

    console.log('✅ Enhanced sensor monitoring stopped');
  }

  // Get recent sensor data
  getRecentData(seconds = 10) {
    const cutoffTime = Date.now() - seconds * 1000;
    return this.dataBuffer.filter(data => data.timestamp > cutoffTime);
  }

  // Get current activity
  getCurrentActivity() {
    return harModelService.getModelInfo();
  }

  // Get activity statistics
  getActivityStats(minutes = 5) {
    return harModelService.getActivityStats(minutes);
  }

  // Check if monitoring is active
  isMonitoring() {
    return this.isActive;
  }

  // Get service status
  getStatus() {
    return {
      isActive: this.isActive,
      samplingRate: this.samplingRate,
      bufferSize: this.dataBuffer.length,
      callbackCount: this.callbacks.length,
      harModel: harModelService.getModelInfo(),
      lastUpdate: this.lastUpdate
    };
  }
}

// Export singleton instance
export const enhancedSensorService = new EnhancedSensorService();