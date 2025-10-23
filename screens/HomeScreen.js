import React, { useState, useEffect } from "react";
import { View, StyleSheet, Text, ScrollView, TouchableOpacity } from "react-native";
import { Button, Card, Surface, Chip, Badge } from "react-native-paper";
import PanicButton from "../components/PanicButton";
import { useNavigation } from "@react-navigation/native";
import { enhancedSensorService } from '../services/enhancedSensorService';

const HomeScreen = () => {
  const [isActivityMonitoring, setIsActivityMonitoring] = useState(false);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [sensorData, setSensorData] = useState(null);
  const [totalReadings, setTotalReadings] = useState(0);
  const [modelInfo, setModelInfo] = useState(null);
  const navigation = useNavigation();

  // Check activity monitoring status and current activity
  useEffect(() => {
    const callback = enhancedSensorService.addCallback((event) => {
      if (event.type === 'activity' && event.prediction) {
        setCurrentActivity(event.prediction.activity);
        setConfidence(event.prediction.confidence);
      }
      
      if (event.type === 'sensor') {
        setSensorData(event.data);
      }
      
      // Handle anomalies from HAR system
      if (event.type === 'anomaly' && event.anomaly.severity === 'HIGH') {
        navigation.navigate("Alert", { 
          anomalyType: event.anomaly.type,
          activityData: event.data 
        });
      }
    });

    const checkMonitoring = () => {
      setIsActivityMonitoring(enhancedSensorService.isMonitoring());
      
      // Update model info and stats
      const info = enhancedSensorService.getStatus();
      setModelInfo(info);
      
      if (info.harModel) {
        setTotalReadings(info.harModel.historyLength || 0);
      }
    };
    
    const interval = setInterval(checkMonitoring, 1000);
    
    return () => {
      callback(); // Remove callback
      clearInterval(interval);
    };
  }, [navigation]);

  const toggleActivityMonitoring = async () => {
    try {
      if (isActivityMonitoring) {
        enhancedSensorService.stopMonitoring();
        setCurrentActivity(null);
        setConfidence(0);
        setSensorData(null);
      } else {
        await enhancedSensorService.startMonitoring();
      }
    } catch (error) {
      console.error('Error toggling monitoring:', error);
    }
  };

  const getActivityColor = (activity) => {
    switch (activity) {
      case 'RUNNING': return '#FF9800';
      case 'WALKING': return '#4CAF50';
      case 'STANDING': return '#2196F3';
      case 'IDLE': return '#9C27B0';
      case 'SUDDEN_STOP': return '#F44336';
      default: return '#757575';
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Protection Status Card */}
      <Card style={[styles.protectionCard, { borderLeftColor: isActivityMonitoring ? '#4CAF50' : '#757575' }]}>
        <Card.Content>
          <View style={styles.protectionHeader}>
            <Text style={styles.protectionTitle}>Protection Status</Text>
            <View style={[styles.statusIndicator, { backgroundColor: isActivityMonitoring ? '#4CAF50' : '#757575' }]} />
          </View>
          <Text style={[styles.protectionStatus, { color: isActivityMonitoring ? '#4CAF50' : '#757575' }]}>
            {isActivityMonitoring ? 'ACTIVE MONITORING' : 'INACTIVE'}
          </Text>
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🎤</Text>
              <Text style={styles.featureText}>Alert system ready</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>📍</Text>
              <Text style={styles.featureText}>GPS tracking</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🤖</Text>
              <Text style={styles.featureText}>AI detection</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Current Activity Card */}
      <Card style={styles.activityCard}>
        <Card.Content>
          <Text style={styles.activityCardTitle}>Current Activity</Text>
          {currentActivity && isActivityMonitoring ? (
            <View style={styles.activityDisplay}>
              <Chip 
                mode="flat" 
                style={[styles.activityChip, { backgroundColor: getActivityColor(currentActivity) }]}
                textStyle={styles.activityChipText}
              >
                {currentActivity}
              </Chip>
              <Text style={styles.confidenceText}>
                Confidence: {(confidence * 100).toFixed(1)}%
              </Text>
            </View>
          ) : (
            <Text style={styles.noActivityText}>
              {isActivityMonitoring ? 'Analyzing movement...' : 'Start monitoring to see activity'}
            </Text>
          )}
        </Card.Content>
      </Card>

      {/* Sensor Data Cards */}
      {sensorData && isActivityMonitoring && (
        <View style={styles.sensorContainer}>
          <Card style={styles.sensorCard}>
            <Card.Content>
              <View style={styles.sensorHeader}>
                <Text style={styles.sensorIcon}>📱</Text>
                <Text style={styles.sensorTitle}>Accelerometer</Text>
              </View>
              <View style={styles.sensorValues}>
                <Text style={styles.sensorValue}>X: {sensorData.accelerometer?.x?.toFixed(2) || '0.00'}</Text>
                <Text style={styles.sensorValue}>Y: {sensorData.accelerometer?.y?.toFixed(2) || '0.00'}</Text>
                <Text style={styles.sensorValue}>Z: {sensorData.accelerometer?.z?.toFixed(2) || '0.00'}</Text>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.sensorCard}>
            <Card.Content>
              <View style={styles.sensorHeader}>
                <Text style={styles.sensorIcon}>🔄</Text>
                <Text style={styles.sensorTitle}>Gyroscope</Text>
              </View>
              <View style={styles.sensorValues}>
                <Text style={styles.sensorValue}>X: {sensorData.gyroscope?.x?.toFixed(2) || '0.00'}</Text>
                <Text style={styles.sensorValue}>Y: {sensorData.gyroscope?.y?.toFixed(2) || '0.00'}</Text>
                <Text style={styles.sensorValue}>Z: {sensorData.gyroscope?.z?.toFixed(2) || '0.00'}</Text>
              </View>
            </Card.Content>
          </Card>
        </View>
      )}

      {/* Control Buttons */}
      <TouchableOpacity
        style={[styles.controlButton, { backgroundColor: isActivityMonitoring ? '#f44336' : '#4CAF50' }]}
        onPress={toggleActivityMonitoring}
      >
        <Text style={styles.controlButtonText}>
          {isActivityMonitoring ? '⏹ STOP PROTECTION' : '▶ START PROTECTION'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.controlButton, styles.emergencyButton]}
        onPress={() => navigation.navigate("Alert", { anomalyType: "PANIC" })}
      >
        <Text style={styles.emergencyButtonText}>
          🚨 EMERGENCY ALERT
        </Text>
      </TouchableOpacity>

      {/* AI Model Statistics */}
      {modelInfo && (
        <Card style={styles.statsCard}>
          <Card.Content>
            <Text style={styles.statsTitle}>AI Model Statistics</Text>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>📊</Text>
              <Text style={styles.statText}>Total Readings: {totalReadings}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>🤖</Text>
              <Text style={styles.statText}>Model Type: {modelInfo.harModel?.type?.split(' ').slice(0, 4).join(' ') || 'Advanced Multi-Criteria'}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>📋</Text>
              <Text style={styles.statText}>Activities: WALKING, STANDING, IDLE, RUNNING, SUDDEN_STOP</Text>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Navigation to detailed view */}
      <TouchableOpacity
        style={styles.detailsButton}
        onPress={() => navigation.navigate('ActivityDetection')}
      >
        <Text style={styles.detailsButtonText}>View Detailed Analysis</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  protectionCard: {
    marginBottom: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  protectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  protectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  protectionStatus: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  featureItem: {
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  featureText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  activityCard: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activityCardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  activityDisplay: {
    alignItems: 'center',
  },
  activityChip: {
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  activityChipText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  confidenceText: {
    fontSize: 14,
    color: '#666',
  },
  noActivityText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  sensorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sensorCard: {
    flex: 0.48,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sensorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sensorIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  sensorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  sensorValues: {
    gap: 4,
  },
  sensorValue: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#555',
  },
  controlButton: {
    marginBottom: 12,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  controlButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emergencyButton: {
    backgroundColor: '#E91E63',
  },
  emergencyButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsCard: {
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIcon: {
    fontSize: 16,
    marginRight: 8,
    width: 20,
  },
  statText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailsButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6f42c1',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  detailsButtonText: {
    color: '#6f42c1',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;