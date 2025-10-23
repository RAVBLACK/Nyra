import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Alert,
  Dimensions,
  TouchableOpacity 
} from 'react-native';
import { Button, Card, ProgressBar, Chip, Surface, Badge } from 'react-native-paper';
import { enhancedSensorService } from '../services/enhancedSensorService';
import { ACTIVITY_LABELS, EMERGENCY_ACTIVITIES } from '../services/harModelService';

const ActivityDetectionScreen = ({ navigation }) => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [sensorData, setSensorData] = useState(null);
  const [activityStats, setActivityStats] = useState(null);
  const [anomalies, setAnomalies] = useState([]);

  const callbackRef = useRef(null);

  useEffect(() => {
    // Subscribe to sensor updates
    callbackRef.current = enhancedSensorService.addCallback(handleSensorUpdate);

    return () => {
      if (callbackRef.current) {
        callbackRef.current();
      }
    };
  }, []);

  useEffect(() => {
    // Update activity stats every 5 seconds
    const interval = setInterval(() => {
      if (isMonitoring) {
        const stats = enhancedSensorService.getActivityStats(5);
        setActivityStats(stats);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isMonitoring]);

  const handleSensorUpdate = (event) => {
    try {
      if (event.type === 'activity' && event.prediction) {
        setCurrentActivity(event.prediction.activity);
        setConfidence(event.prediction.confidence);
      }

      if (event.type === 'sensor') {
        setSensorData(event.data);
      }

      if (event.type === 'anomaly') {
        console.log('🚨 Anomaly detected in UI:', event.anomaly);
        
        // Add to anomaly list
        setAnomalies(prev => [{
          id: Date.now(),
          ...event.anomaly,
          timestamp: new Date().toISOString()
        }, ...prev.slice(0, 9)]); // Keep last 10 anomalies

        // Show alert for high severity anomalies
        if (event.anomaly.severity === 'HIGH') {
          Alert.alert(
            '🚨 Emergency Detected!',
            `${event.anomaly.message}\n\nWould you like to trigger an emergency alert?`,
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Send Alert', 
                style: 'destructive',
                onPress: () => {
                  navigation.navigate('Alert', { 
                    anomalyType: event.anomaly.type,
                    activityData: event.data 
                  });
                }
              }
            ]
          );
        }
      }
    } catch (error) {
      console.error('❌ Error handling sensor update:', error);
    }
  };

  const handleStartMonitoring = async () => {
    try {
      await enhancedSensorService.startMonitoring();
      setIsMonitoring(true);
      setAnomalies([]);
      console.log('✅ Monitoring started from UI');
    } catch (error) {
      Alert.alert('Error', `Failed to start monitoring: ${error.message}`);
    }
  };

  const handleStopMonitoring = () => {
    enhancedSensorService.stopMonitoring();
    setIsMonitoring(false);
    setCurrentActivity(null);
    setConfidence(0);
    setSensorData(null);
    setActivityStats(null);
    console.log('🛑 Monitoring stopped from UI');
  };

  const getActivityColor = (activity) => {
    if (EMERGENCY_ACTIVITIES.has(activity)) return '#e63946';
    if (['WALKING', 'RUNNING', 'CYCLING'].includes(activity)) return '#28a745';
    if (['SITTING', 'STANDING', 'LAYING'].includes(activity)) return '#007bff';
    return '#6c757d';
  };

  const getAnomalyColor = (severity) => {
    switch (severity) {
      case 'HIGH': return '#e63946';
      case 'MEDIUM': return '#fd7e14';
      case 'LOW': return '#ffc107';
      default: return '#6c757d';
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Enhanced Header */}
      <Surface style={styles.headerSurface}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>🤖 Advanced AI Detection</Text>
          <Badge 
            style={[styles.statusBadge, { backgroundColor: isMonitoring ? '#4CAF50' : '#757575' }]}
            size={12}
          />
        </View>
        <Text style={styles.headerSubtitle}>Real-time Human Activity Recognition</Text>
      </Surface>

      {/* Enhanced Control Section */}
      <Card style={[styles.controlCard, { borderLeftColor: isMonitoring ? '#4CAF50' : '#757575' }]}>
        <Card.Content>
          <View style={styles.controlHeader}>
            <Text style={styles.controlTitle}>Detection Control</Text>
            <Chip 
              mode="flat"
              style={[styles.statusChip, { backgroundColor: isMonitoring ? '#E8F5E8' : '#F5F5F5' }]}
              textStyle={[styles.statusChipText, { color: isMonitoring ? '#2E7D32' : '#757575' }]}
            >
              {isMonitoring ? 'ACTIVE' : 'STOPPED'}
            </Chip>
          </View>
          
          <TouchableOpacity
            style={[styles.mainControlButton, { backgroundColor: isMonitoring ? '#F44336' : '#4CAF50' }]}
            onPress={isMonitoring ? handleStopMonitoring : handleStartMonitoring}
          >
            <Text style={styles.mainControlButtonText}>
              {isMonitoring ? '⏹ STOP DETECTION' : '▶ START DETECTION'}
            </Text>
          </TouchableOpacity>
        </Card.Content>
      </Card>

      {isMonitoring && (
        <>
          {/* Enhanced Current Activity Display */}
          <Card style={styles.activityDisplayCard}>
            <Card.Content>
              <Text style={styles.activityDisplayTitle}>Current Activity</Text>
              {currentActivity ? (
                <View style={styles.currentActivityContainer}>
                  <View style={styles.activityMainDisplay}>
                    <Chip 
                      mode="flat"
                      style={[styles.activityMainChip, { backgroundColor: getActivityColor(currentActivity) }]}
                      textStyle={styles.activityMainChipText}
                    >
                      {currentActivity}
                    </Chip>
                    <View style={styles.confidenceContainer}>
                      <Text style={styles.confidenceLabel}>Confidence</Text>
                      <Text style={styles.confidenceValue}>{(confidence * 100).toFixed(1)}%</Text>
                    </View>
                  </View>
                  <ProgressBar 
                    progress={confidence} 
                    color={getActivityColor(currentActivity)}
                    style={styles.modernProgressBar}
                  />
                </View>
              ) : (
                <View style={styles.analyzingContainer}>
                  <Text style={styles.analyzingText}>Analyzing movement patterns...</Text>
                  <ProgressBar 
                    indeterminate
                    color="#4CAF50"
                    style={styles.modernProgressBar}
                  />
                </View>
              )}
            </Card.Content>
          </Card>

          {/* Activity Statistics */}
          {activityStats && (
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.cardTitle}>📈 Activity Statistics (5 min)</Text>
                <Text style={styles.statText}>
                  Total Readings: {activityStats.totalReadings}
                </Text>
                <Text style={styles.statText}>
                  Average Confidence: {(activityStats.averageConfidence * 100).toFixed(1)}%
                </Text>
                
                <Text style={styles.subTitle}>Activity Distribution:</Text>
                {Object.entries(activityStats.activityCounts).map(([activity, count]) => (
                  <View key={activity} style={styles.statRow}>
                    <Chip 
                      mode="outlined"
                      style={[styles.miniChip, { borderColor: getActivityColor(activity) }]}
                      textStyle={[styles.miniChipText, { color: getActivityColor(activity) }]}
                    >
                      {activity}
                    </Chip>
                    <Text style={styles.statCount}>{count}</Text>
                  </View>
                ))}
              </Card.Content>
            </Card>
          )}

          {/* Recent Anomalies */}
          {anomalies.length > 0 && (
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.cardTitle}>🚨 Recent Anomalies</Text>
                {anomalies.map((anomaly) => (
                  <View 
                    key={anomaly.id} 
                    style={[styles.anomalyItem, { borderLeftColor: getAnomalyColor(anomaly.severity) }]}
                  >
                    <View style={styles.anomalyHeader}>
                      <Chip 
                        mode="flat"
                        style={[styles.severityChip, { backgroundColor: getAnomalyColor(anomaly.severity) }]}
                        textStyle={styles.severityChipText}
                        compact
                      >
                        {anomaly.severity}
                      </Chip>
                      <Text style={styles.anomalyTime}>
                        {new Date(anomaly.timestamp).toLocaleTimeString()}
                      </Text>
                    </View>
                    <Text style={styles.anomalyType}>{anomaly.type}</Text>
                    <Text style={styles.anomalyMessage}>{anomaly.message}</Text>
                  </View>
                ))}
              </Card.Content>
            </Card>
          )}

          {/* Raw Sensor Values */}
          {sensorData && (
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.cardTitle}>🔢 Raw Sensor Values</Text>
                
                <Text style={styles.sensorLabel}>Accelerometer (m/s²):</Text>
                <Text style={styles.sensorValue}>
                  X: {sensorData.accelerometer.x.toFixed(3)}, 
                  Y: {sensorData.accelerometer.y.toFixed(3)}, 
                  Z: {sensorData.accelerometer.z.toFixed(3)}
                </Text>
                <Text style={styles.sensorValue}>
                  Magnitude: {sensorData.accelerometer.magnitude.toFixed(3)}
                </Text>
                
                <Text style={styles.sensorLabel}>Gyroscope (rad/s):</Text>
                <Text style={styles.sensorValue}>
                  X: {sensorData.gyroscope.x.toFixed(3)}, 
                  Y: {sensorData.gyroscope.y.toFixed(3)}, 
                  Z: {sensorData.gyroscope.z.toFixed(3)}
                </Text>
                <Text style={styles.sensorValue}>
                  Magnitude: {sensorData.gyroscope.magnitude.toFixed(3)}
                </Text>
                
                <Text style={styles.sensorLabel}>Magnetometer (μT):</Text>
                <Text style={styles.sensorValue}>
                  X: {sensorData.magnetometer.x.toFixed(3)}, 
                  Y: {sensorData.magnetometer.y.toFixed(3)}, 
                  Z: {sensorData.magnetometer.z.toFixed(3)}
                </Text>
                <Text style={styles.sensorValue}>
                  Magnitude: {sensorData.magnetometer.magnitude.toFixed(3)}
                </Text>
              </Card.Content>
            </Card>
          )}
        </>
      )}

      {/* Information */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>ℹ️ Detected Activities</Text>
          <View style={styles.activityList}>
            {Object.values(ACTIVITY_LABELS).map((activity) => (
              <Chip
                key={activity}
                mode="outlined"
                style={[
                  styles.activityListChip,
                  { borderColor: getActivityColor(activity) },
                  EMERGENCY_ACTIVITIES.has(activity) && styles.emergencyChip
                ]}
                textStyle={[
                  styles.activityListChipText,
                  { color: getActivityColor(activity) }
                ]}
              >
                {activity} {EMERGENCY_ACTIVITIES.has(activity) ? '🚨' : ''}
              </Chip>
            ))}
          </View>
          
          <Text style={styles.infoText}>
            🤖 This system uses AI to detect human activities{'\n'}
            🚨 Emergency activities (FALLING, SUDDEN_STOP) trigger automatic alerts{'\n'}
            📊 Real-time analysis of accelerometer, gyroscope, and magnetometer data{'\n'}
            📈 Confidence threshold: 60% for reliable detection
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  headerSurface: {
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    elevation: 4,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  statusBadge: {
    width: 12,
    height: 12,
  },
  controlCard: {
    marginBottom: 20,
    borderRadius: 16,
    borderLeftWidth: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  controlHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  controlTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  statusChip: {
    borderRadius: 16,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  mainControlButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  mainControlButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  activityDisplayCard: {
    marginBottom: 20,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  activityDisplayTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  currentActivityContainer: {
    alignItems: 'center',
  },
  activityMainDisplay: {
    alignItems: 'center',
    marginBottom: 16,
  },
  activityMainChip: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    marginBottom: 12,
  },
  activityMainChipText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  confidenceContainer: {
    alignItems: 'center',
  },
  confidenceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  confidenceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  modernProgressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
  },
  analyzingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  analyzingText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  activityContainer: {
    alignItems: 'center',
  },
  activityChip: {
    marginBottom: 8,
  },
  activityChipText: {
    color: 'white',
    fontWeight: 'bold',
  },
  confidenceText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  progressBar: {
    width: '100%',
    height: 8,
  },
  loadingText: {
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#666',
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
    color: '#333',
  },
  statText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#555',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  miniChip: {
    height: 28,
  },
  miniChipText: {
    fontSize: 12,
  },
  statCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  anomalyItem: {
    borderLeftWidth: 4,
    paddingLeft: 12,
    marginBottom: 12,
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 4,
  },
  anomalyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  severityChip: {
    height: 24,
  },
  severityChipText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  anomalyTime: {
    fontSize: 12,
    color: '#666',
  },
  anomalyType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  anomalyMessage: {
    fontSize: 13,
    color: '#555',
  },
  sensorLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
    color: '#333',
  },
  sensorValue: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#555',
    marginBottom: 2,
  },
  activityList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  activityListChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  activityListChipText: {
    fontSize: 12,
  },
  emergencyChip: {
    borderWidth: 2,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default ActivityDetectionScreen;