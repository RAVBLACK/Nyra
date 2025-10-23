// Enhanced HAR Model Service with Real Step Detection and Advanced Pattern Analysis
import * as Location from 'expo-location';

// Activity types the model can detect
const ACTIVITY_LABELS = {
  IDLE: 'IDLE',
  STANDING: 'STANDING', 
  WALKING: 'WALKING',
  RUNNING: 'RUNNING',
  SUDDEN_STOP: 'SUDDEN_STOP'
};

// Emergency activities that should trigger alerts
const EMERGENCY_ACTIVITIES = new Set(['SUDDEN_STOP']);

class HARModelService {
  constructor() {
    this.isInitialized = false;
    this.activityHistory = [];
    this.currentActivity = null;
    this.confidence = 0;
    this.windowSize = 128;
    this.sensorData = [];
    this.lastHighActivityTime = null;
    this.lastHighActivityLevel = 0;
    this.locationPermission = false;
    this.lastKnownLocation = null;
    
    // Enhanced data structures for advanced pattern recognition
    this.magnitudeHistory = [];
    this.stepHistory = [];
    this.orientationHistory = [];
    this.frequencyData = [];
    this.orientationStability = 0.5;
    this.cadencePattern = [];
    
    // Activity signatures for better classification
    this.activitySignatures = {
      IDLE: { stepFreq: [0, 0.5], variance: [0, 0.1], orientation: 'any' },
      STANDING: { stepFreq: [0, 1], variance: [0.05, 0.3], orientation: 'upright' },
      WALKING: { stepFreq: [1.5, 2.8], variance: [0.3, 1.5], orientation: 'upright' },
      RUNNING: { stepFreq: [2.5, 5], variance: [1.2, 4], orientation: 'upright' },
      SUDDEN_STOP: { stepFreq: [0, 0.3], variance: [0.8, 3], orientation: 'any' }
    };
  }

  async initialize() {
    try {
      console.log('🔧 Initializing Enhanced HAR Model Service...');
      
      // Request location permissions for GPS-enhanced detection
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        this.locationPermission = true;
        console.log('✅ Location permission granted');
      } else {
        console.warn('⚠️ Location permission denied - GPS features disabled');
      }

      this.isInitialized = true;
      console.log('✅ Enhanced HAR Model Service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ HAR Model initialization failed:', error);
      return false;
    }
  }

  async getCurrentGPSData() {
    if (!this.locationPermission) return null;

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        maximumAge: 5000,
      });

      this.lastKnownLocation = location;
      return {
        speed: location.coords.speed || 0, // m/s
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.warn('⚠️ GPS data unavailable:', error.message);
      return null;
    }
  }

  // Enhanced activity prediction with GPS and time context
  async predictActivity(sensorData) {
    if (!this.isInitialized) {
      console.warn('⚠️ HAR Model not initialized');
      return null;
    }

    try {
      // Add sensor data to buffer
      this.sensorData.push(sensorData);
      
      if (this.sensorData.length > this.windowSize) {
        this.sensorData = this.sensorData.slice(-this.windowSize);
      }

      if (this.sensorData.length < 8) {
        return null;
      }

      // Get GPS data
      const gpsData = await this.getCurrentGPSData();
      
      // Time context
      const now = new Date();
      const hour = now.getHours();
      const isNight = hour < 6 || hour > 22;
      const isLateNight = hour >= 23 || hour <= 4; // Extra dangerous hours
      
      // Use balanced window for analysis (increased for better accuracy)
      const recentData = this.sensorData.slice(-20);
      
      // Calculate accelerometer metrics with improved precision
      const accelMagnitudes = recentData.map(d => Math.sqrt(d[0]**2 + d[1]**2 + d[2]**2));
      const avgAccelMagnitude = accelMagnitudes.reduce((sum, val) => sum + val, 0) / accelMagnitudes.length;
      const maxAccelMagnitude = Math.max(...accelMagnitudes);
      const minAccelMagnitude = Math.min(...accelMagnitudes);
      const accelRange = maxAccelMagnitude - minAccelMagnitude;
      
      // Calculate gyroscope metrics
      const gyroMagnitudes = recentData.map(d => Math.sqrt(d[3]**2 + d[4]**2 + d[5]**2));
      const avgGyroMagnitude = gyroMagnitudes.reduce((sum, val) => sum + val, 0) / gyroMagnitudes.length;
      
      // Calculate variance and standard deviation for better pattern recognition
      const accelVariance = this.calculateVariance(accelMagnitudes);
      const accelStdDev = Math.sqrt(accelVariance);
      const gyroVariance = this.calculateVariance(gyroMagnitudes);
      const gyroStdDev = Math.sqrt(gyroVariance);
      
      // ADVANCED PATTERN ANALYSIS
      const currentMagnitude = accelMagnitudes[accelMagnitudes.length - 1];
      const stepFrequency = this.detectSteps(currentMagnitude, Date.now());
      
      // Enhanced orientation analysis
      const orientationData = this.analyzeOrientation({
        x: sensorData[0], y: sensorData[1], z: sensorData[2]
      });
      
      // Frequency domain analysis for rhythm detection
      this.frequencyData.push(currentMagnitude);
      if (this.frequencyData.length > 64) {
        this.frequencyData = this.frequencyData.slice(-64);
      }
      
      const frequencyAnalysis = this.analyzeFrequencyDomain(this.frequencyData);
      const rhythmicity = this.calculateRhythmicity(accelMagnitudes);
      
      // Enhanced movement intensity calculation
      const movementIntensity = (accelRange * 0.8) + (accelStdDev * 1.5) + (accelVariance * 0.7);
      const gyroActivity = (avgGyroMagnitude * 2.5) + (gyroVariance * 0.6) + (gyroStdDev * 1.0);
      const totalMovement = movementIntensity + (gyroActivity * 0.5);
      
      // Step-based activity indicators
      const walkingIndicator = stepFrequency * 2 + rhythmicity + orientationData.stability;
      const runningIndicator = stepFrequency * 1.5 + (frequencyAnalysis.dominantFreq > 2 ? 2 : 0) + 
                               (avgAccelMagnitude * 0.8) + (accelRange * 1.5);
      const stillnessIndicator = 1 / (1 + totalMovement); // Inverse relationship
      
      // GPS-enhanced detection (less sensitive)
      const gpsSpeed = gpsData ? gpsData.speed : 0; // m/s
      const isMovingByGPS = gpsSpeed > 0.8; // Higher GPS threshold for movement
      const gpsMovementScore = Math.min(gpsSpeed * 2.0, 6); // More conservative GPS conversion
      
      // SIGNATURE-BASED CLASSIFICATION using step patterns and orientation
      let detectedActivity = 'UNKNOWN';
      let activityConfidence = 0;
      
      // Check against activity signatures
      for (const [activity, signature] of Object.entries(this.activitySignatures)) {
        let score = 0;
        
        // Step frequency matching
        if (stepFrequency >= signature.stepFreq[0] && stepFrequency <= signature.stepFreq[1]) {
          score += 30;
        }
        
        // Variance matching
        if (accelVariance >= signature.variance[0] && accelVariance <= signature.variance[1]) {
          score += 25;
        }
        
        // Orientation requirements
        if (signature.orientation === 'upright' && orientationData.isUpright) {
          score += 20;
        } else if (signature.orientation === 'any') {
          score += 15;
        }
        
        // Additional pattern matching
        if (activity === 'WALKING' && frequencyAnalysis.dominantFreq >= 1.5 && frequencyAnalysis.dominantFreq <= 3) {
          score += 15;
        }
        
        if (activity === 'RUNNING' && frequencyAnalysis.dominantFreq >= 2.5 && frequencyAnalysis.dominantFreq <= 5) {
          score += 15;
        }
        
        // GPS validation
        if (isMovingByGPS && (activity === 'WALKING' || activity === 'RUNNING')) {
          score += 10;
        } else if (!isMovingByGPS && (activity === 'IDLE' || activity === 'STANDING')) {
          score += 10;
        }
        
        // Update best match
        if (score > activityConfidence) {
          activityConfidence = score;
          detectedActivity = activity;
        }
      }
      
      // Convert confidence to percentage  
      const finalConfidence = Math.min(activityConfidence / 100, 1.0);
      
      // Update current activity and confidence
      this.currentActivity = detectedActivity;
      this.confidence = finalConfidence;
      
      // Special case: Sudden stop detection
      const currentTime = Date.now();
      if (this.lastHighActivityTime) {
        const timeSinceHighActivity = currentTime - this.lastHighActivityTime;
        const hadRecentHighActivity = timeSinceHighActivity < 2000; // 2 seconds
        const significantDrop = this.lastHighActivityLevel > 3.0 && totalMovement < 0.5;
        const gpsStoppedSudden = gpsData && this.lastGPSSpeed > 2.0 && gpsSpeed < 0.5;
        
        if ((hadRecentHighActivity && significantDrop) || gpsStoppedSudden) {
          this.currentActivity = 'SUDDEN_STOP';
          this.confidence = 0.95;
          console.log(`🚨 SUDDEN_STOP detected! Movement drop: ${this.lastHighActivityLevel?.toFixed(2)} -> ${totalMovement.toFixed(2)}`);
        }
      }
      
      // Track high activity for sudden stop detection
      if (totalMovement > 2.5 || stepFrequency > 2.0) {
        this.lastHighActivityTime = currentTime;
        this.lastHighActivityLevel = totalMovement;
      }
      
      console.log(`🎯 Activity Analysis:
        Detected: ${this.currentActivity} (${(this.confidence * 100).toFixed(1)}%)
        Step Freq: ${stepFrequency.toFixed(1)}/min | Dominant Freq: ${frequencyAnalysis.dominantFreq.toFixed(1)}Hz
        Orientation: ${orientationData.isUpright ? 'Upright' : 'Tilted'} | Stability: ${orientationData.stability.toFixed(2)}
        Movement: ${totalMovement.toFixed(2)} | GPS: ${gpsSpeed.toFixed(1)}m/s | Variance: ${accelVariance.toFixed(3)}`);

      // Store GPS speed for next comparison
      this.lastGPSSpeed = gpsSpeed;

      const previousActivity = this.currentActivity;

      // Enhanced history tracking with detailed metrics
      this.activityHistory.push({
        activity: this.currentActivity,
        confidence: this.confidence,
        timestamp: new Date().toISOString(),
        avgAccelMagnitude,
        avgGyroMagnitude,
        accelVariance,
        accelStdDev,
        gyroVariance,
        movementIntensity,
        totalMovement,
        accelRange,
        stepFrequency,
        rhythmicity,
        walkingIndicator,
        runningIndicator,
        stillnessIndicator,
        orientationData,
        frequencyAnalysis,
        lastHighActivityLevel: this.lastHighActivityLevel,
        gpsSpeed,
        gpsMovementScore,
        isMovingByGPS,
        isNight,
        isLateNight,
        location: gpsData ? { lat: gpsData.latitude, lng: gpsData.longitude } : null
      });

      if (this.activityHistory.length > 1000) {
        this.activityHistory = this.activityHistory.slice(-500);
      }

      // Enhanced activity display logging
      console.log(`
🎯 ACTIVITY DETECTED: ${this.currentActivity.toUpperCase()} (${(this.confidence * 100).toFixed(1)}% confidence)
📊 Movement Score: ${totalMovement.toFixed(2)} | GPS Speed: ${gpsSpeed.toFixed(1)} m/s
🚶 Step Frequency: ${stepFrequency.toFixed(1)}/min | Rhythmicity: ${rhythmicity.toFixed(2)}
🧭 Orientation: ${orientationData.isUpright ? 'Upright' : 'Tilted'} | Stability: ${orientationData.stability.toFixed(2)}
${isNight ? '🌙 NIGHT MODE' : '☀️ DAY MODE'}
${previousActivity && previousActivity !== this.currentActivity ? `📈 Changed from: ${previousActivity}` : ''}
      `);

      // Check for anomalies
      const anomaly = this.detectAnomaly(previousActivity, this.currentActivity, this.confidence);

      // Enhanced probabilities
      const probabilities = {};
      Object.values(ACTIVITY_LABELS).forEach(act => {
        probabilities[act] = act === this.currentActivity ? this.confidence : (1 - this.confidence) / (Object.keys(ACTIVITY_LABELS).length - 1);
      });

      return {
        activity: this.currentActivity,
        confidence: this.confidence,
        anomaly,
        previousActivity,
        probabilities,
        metrics: {
          avgAccelMagnitude,
          avgGyroMagnitude,
          accelVariance,
          accelStdDev,
          gyroVariance,
          gyroStdDev,
          movementIntensity,
          totalMovement,
          stepFrequency,
          orientationData,
          frequencyAnalysis,
          accelRange,
          maxAccelMagnitude,
          minAccelMagnitude,
          rhythmicity,
          walkingIndicator,
          runningIndicator,
          stillnessIndicator,
          lastHighActivityLevel: this.lastHighActivityLevel,
          gpsSpeed,
          gpsMovementScore,
          isMovingByGPS,
          isNight,
          isLateNight
        },
        location: gpsData ? { 
          latitude: gpsData.latitude, 
          longitude: gpsData.longitude,
          accuracy: gpsData.accuracy 
        } : null
      };

    } catch (error) {
      console.error('❌ Enhanced activity prediction error:', error);
      return null;
    }
  }

  calculateRhythmicity(accelMagnitudes) {
    if (accelMagnitudes.length < 12) return 0;
    
    // Calculate differences between consecutive values
    const differences = [];
    for (let i = 1; i < accelMagnitudes.length; i++) {
      differences.push(Math.abs(accelMagnitudes[i] - accelMagnitudes[i - 1]));
    }
    
    // Calculate variance for consistency
    const variance = this.calculateVariance(differences);
    const consistency = 1 / (1 + variance);
    
    return consistency * 0.8; // Simplified rhythmicity score
  }

  // Calculate statistical variance
  calculateVariance(values) {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }

  detectAnomaly(previousActivity, currentActivity, confidence) {
    // Lower confidence threshold to reduce false positives
    if (confidence < 0.5) {
      return {
        type: 'LOW_CONFIDENCE',
        severity: 'LOW',
        message: `Low confidence prediction: ${currentActivity}`,
        confidence
      };
    }

    // Rapid activity changes that could indicate emergency
    const rapidChanges = ['RUNNING', 'SUDDEN_STOP'];
    if (previousActivity && 
        rapidChanges.includes(previousActivity) && 
        rapidChanges.includes(currentActivity) &&
        previousActivity !== currentActivity) {
      return {
        type: 'RAPID_CHANGE',
        severity: 'HIGH',
        message: `Rapid transition: ${previousActivity} → ${currentActivity}`,
        from: previousActivity,
        to: currentActivity,
        confidence
      };
    }

    return null;
  }

  // Activity statistics over time window
  getActivityStats(minutes = 5) {
    const now = Date.now();
    const timeWindow = minutes * 60 * 1000;
    
    const recentActivities = this.activityHistory.filter(
      entry => now - new Date(entry.timestamp).getTime() <= timeWindow
    );

    if (recentActivities.length === 0) {
      return {
        totalSamples: 0,
        avgConfidence: 0,
        activities: {},
        currentActivity: this.currentActivity,
        currentConfidence: this.confidence,
      };
    }

    const activityCounts = {};
    let totalConfidence = 0;

    recentActivities.forEach(entry => {
      activityCounts[entry.activity] = (activityCounts[entry.activity] || 0) + 1;
      totalConfidence += entry.confidence;
    });

    return {
      totalSamples: recentActivities.length,
      avgConfidence: totalConfidence / recentActivities.length,
      activities: activityCounts,
      timeWindow: minutes,
      currentActivity: this.currentActivity,
      currentConfidence: this.confidence,
    };
  }

  // Time since last activity change
  getTimeSinceLastActivityChange() {
    if (this.activityHistory.length < 2) return 0;
    
    const current = this.activityHistory[this.activityHistory.length - 1];
    
    // Find the last different activity
    for (let i = this.activityHistory.length - 2; i >= 0; i--) {
      const prev = this.activityHistory[i];
      if (prev.activity !== current.activity) {
        return new Date(current.timestamp).getTime() - new Date(prev.timestamp).getTime();
      }
    }
    
    return 0;
  }

  // Reset the model state
  reset() {
    this.activityHistory = [];
    this.sensorData = [];
    this.currentActivity = null;
    this.confidence = 0;
    this.lastHighActivityTime = null;
    this.lastHighActivityLevel = 0;
    console.log('🔄 HAR Model state reset');
  }

  // Get model information and current state
  getModelInfo() {
    return {
      isInitialized: this.isInitialized,
      currentActivity: this.currentActivity,
      confidence: this.confidence,
      sensorDataPoints: this.sensorData.length,
      activityHistoryLength: this.activityHistory.length,
      locationPermission: this.locationPermission,
      lastKnownLocation: this.lastKnownLocation,
      windowSize: this.windowSize,
      supportedActivities: Object.values(ACTIVITY_LABELS),
      emergencyActivities: Array.from(EMERGENCY_ACTIVITIES),
      version: '2.0.0'
    };
  }

  // Advanced step detection using peak detection and frequency analysis
  detectSteps(magnitude, timestamp) {
    // Store magnitude data for step analysis
    this.magnitudeHistory.push({ value: magnitude, timestamp });
    
    // Keep only last 3 seconds of data for step counting
    const timeWindow = 3000;
    this.magnitudeHistory = this.magnitudeHistory.filter(
      point => timestamp - point.timestamp <= timeWindow
    );

    if (this.magnitudeHistory.length < 10) return 0;

    // Calculate dynamic threshold based on recent activity
    const values = this.magnitudeHistory.map(p => p.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const dynamicThreshold = mean + Math.sqrt(variance) * 0.5;

    // Find peaks that exceed dynamic threshold
    let stepCount = 0;
    let lastPeakTime = 0;
    const minStepInterval = 200; // Minimum 200ms between steps (max 5 steps/sec)

    for (let i = 1; i < this.magnitudeHistory.length - 1; i++) {
      const current = this.magnitudeHistory[i];
      const prev = this.magnitudeHistory[i - 1];
      const next = this.magnitudeHistory[i + 1];

      // Peak detection: current value is higher than neighbors and above threshold
      if (current.value > prev.value && 
          current.value > next.value && 
          current.value > dynamicThreshold &&
          (current.timestamp - lastPeakTime) > minStepInterval) {
        stepCount++;
        lastPeakTime = current.timestamp;
      }
    }

    // Calculate step frequency (steps per minute)
    const timeSpan = timeWindow / 1000 / 60; // Convert to minutes
    const stepFrequency = stepCount / timeSpan;

    // Store for pattern analysis
    this.stepHistory.push({
      timestamp,
      count: stepCount,
      frequency: stepFrequency,
      dynamicThreshold
    });

    // Keep only last 10 seconds of step data
    this.stepHistory = this.stepHistory.filter(
      step => timestamp - step.timestamp <= 10000
    );

    return stepFrequency;
  }

  // Enhanced orientation and tilt analysis
  analyzeOrientation(accelerometer) {
    // Calculate device orientation angles
    const { x, y, z } = accelerometer;
    const magnitude = Math.sqrt(x * x + y * y + z * z);
    
    // Normalize accelerometer values
    const normX = x / magnitude;
    const normY = y / magnitude;
    const normZ = z / magnitude;

    // Calculate tilt angles in degrees
    const pitch = Math.atan2(-normX, Math.sqrt(normY * normY + normZ * normZ)) * 180 / Math.PI;
    const roll = Math.atan2(normY, normZ) * 180 / Math.PI;

    // Store orientation history for stability analysis
    this.orientationHistory.push({ pitch, roll, timestamp: Date.now() });
    this.orientationHistory = this.orientationHistory.filter(
      point => Date.now() - point.timestamp <= 5000
    );

    // Calculate orientation stability (lower variance = more stable)
    if (this.orientationHistory.length > 10) {
      const pitches = this.orientationHistory.map(o => o.pitch);
      const rolls = this.orientationHistory.map(o => o.roll);
      
      const pitchVariance = this.calculateVariance(pitches);
      const rollVariance = this.calculateVariance(rolls);
      
      this.orientationStability = 1 / (1 + pitchVariance + rollVariance);
    }

    return {
      pitch,
      roll,
      stability: this.orientationStability,
      isUpright: Math.abs(pitch) < 45 && Math.abs(roll) < 45
    };
  }

  // Frequency domain analysis for activity patterns
  analyzeFrequencyDomain(data) {
    if (data.length < 32) return { dominantFreq: 0, power: 0 };

    // Simple FFT approximation for dominant frequency detection
    const N = Math.min(data.length, 64);
    let maxPower = 0;
    let dominantFreq = 0;

    // Check frequencies from 0.5 to 5 Hz (typical human movement range)
    for (let freq = 0.5; freq <= 5.0; freq += 0.1) {
      let real = 0;
      let imag = 0;

      for (let i = 0; i < N; i++) {
        const angle = -2 * Math.PI * freq * i / 20; // Assuming 20Hz sampling
        real += data[i] * Math.cos(angle);
        imag += data[i] * Math.sin(angle);
      }

      const power = real * real + imag * imag;
      if (power > maxPower) {
        maxPower = power;
        dominantFreq = freq;
      }
    }

    return { dominantFreq, power: maxPower };
  }
}

const harModelService = new HARModelService();

module.exports = { 
  harModelService, 
  ACTIVITY_LABELS, 
  EMERGENCY_ACTIVITIES 
};