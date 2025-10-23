// File: services/smsService.js
import * as SMS from 'expo-sms';
import { Alert } from 'react-native';

export const sendSMSAlert = async (phoneNumbers, message) => {
  try {
    // Check if SMS is available
    const isAvailable = await SMS.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('SMS is not available on this device');
    }

    // Send SMS to multiple recipients
    const result = await SMS.sendSMSAsync(phoneNumbers, message);
    
    if (result.result === 'sent') {
      console.log('SMS sent successfully');
      return { success: true, result };
    } else if (result.result === 'cancelled') {
      console.log('SMS cancelled by user');
      return { success: false, error: 'User cancelled' };
    } else {
      console.log('SMS failed');
      return { success: false, error: 'Failed to send' };
    }
  } catch (error) {
    console.error('Error sending SMS:', error);
    return { success: false, error: error.message };
  }
};

export const createEmergencyMessage = (anomalyType, location, timestamp) => {
  const googleMapsUrl = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
  
  return `🚨 EMERGENCY ALERT 🚨

${anomalyType === "FALL" ? "Fall detected!" : 
  anomalyType === "STOP" ? "Sudden stop detected!" : 
  anomalyType === "PANIC" ? "Panic button pressed!" : 
  "Emergency detected!"}

📍 Location: ${googleMapsUrl}
📊 Coordinates: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}
⏰ Time: ${new Date(timestamp).toLocaleString()}

Please check on me immediately!

- Sent from NYRA Emergency App`;
};