import * as Location from 'expo-location';
import { saveData, getData } from './storageService';
import { sendSMSAlert, createEmergencyMessage } from './smsService';
import { sendEmailAlert, createEmailContent } from './emailService';
import { getCurrentLocation, reverseGeocode, createMapUrls } from './mapsService';
import { Alert } from 'react-native';

export const triggerAlert = async (anomalyType, activityData = null) => {
  try {
    console.log(`🚨 Triggering automated ${anomalyType} alert...`);
    
    // Log activity data if provided
    if (activityData) {
      console.log('🤖 Activity context detected:', {
        activity: activityData.prediction?.activity,
        confidence: activityData.prediction?.confidence,
        anomaly: activityData.prediction?.anomaly
      });
    }

    // Step 1: Get precise location
    console.log('📍 Getting location...');
    const location = await getCurrentLocation();
    console.log('📍 Location obtained:', location);

    // Step 2: Get human-readable address
    console.log('📮 Resolving address...');
    const addressInfo = await reverseGeocode(location.latitude, location.longitude);
    console.log('📮 Address resolved:', addressInfo.address);

    // Step 3: Create comprehensive alert data with activity context
    const timestamp = new Date().toISOString();
    const mapUrls = createMapUrls(location.latitude, location.longitude);
    
    const alertData = {
      id: `alert_${Date.now()}`,
      anomalyType,
      timestamp,
      location: {
        ...location,
        address: addressInfo.address,
        mapUrls,
      },
      status: 'triggered',
      automated: true, // Mark as automated
      // ADD ACTIVITY CONTEXT
      activityContext: activityData ? {
        detectedActivity: activityData.prediction?.activity,
        confidence: activityData.prediction?.confidence,
        anomaly: activityData.prediction?.anomaly,
        sensorReadings: {
          accelerometer: activityData.accelerometer,
          gyroscope: activityData.gyroscope,
          magnetometer: activityData.magnetometer
        },
        detectionTimestamp: activityData.timestamp,
        metrics: activityData.prediction?.metrics
      } : null,
    };

    // Step 4: Save alert locally
    await saveData(alertData.id, alertData);
    console.log('💾 Alert saved locally');

    // Step 5: Get emergency contacts
    const contacts = await getData('emergencyContacts');
    if (!contacts || contacts.length === 0) {
      console.log('⚠️ No emergency contacts found');
      Alert.alert(
        "No Contacts", 
        "No emergency contacts found. Please add contacts in the Contacts screen.",
        [{ text: "OK" }]
      );
      return { success: false, message: 'No emergency contacts' };
    }

    console.log(`📱 Sending automated alerts to ${contacts.length} contacts...`);
    
    // Step 7: Separate phone numbers and emails
    const phoneNumbers = contacts.filter(contact => 
      /^\+?\d+$/.test(contact.replace(/[\s\-\(\)]/g, ''))
    );
    const emailAddresses = contacts.filter(contact => /@/.test(contact));

    console.log(`📱 Found ${phoneNumbers.length} phone numbers and ${emailAddresses.length} email addresses`);

    const sendResults = [];

    // Step 8: Send SMS to phone numbers (automated) with activity context
    if (phoneNumbers.length > 0) {
      try {
        console.log('📱 Sending SMS alerts...');
        const smsMessage = createEnhancedEmergencyMessage(anomalyType, alertData.location, timestamp, activityData);
        const smsResult = await sendSMSAlert(phoneNumbers, smsMessage);
        sendResults.push({ type: 'sms', contacts: phoneNumbers, ...smsResult });
        console.log('📱 SMS alerts processed');
      } catch (smsError) {
        console.error('📱 SMS sending failed:', smsError);
        sendResults.push({ 
          type: 'sms', 
          contacts: phoneNumbers, 
          success: false, 
          error: smsError.message 
        });
      }
    }

    // Step 9: Send emails (automated) with activity context
    if (emailAddresses.length > 0) {
      try {
        console.log('📧 Sending email alerts...');
        const { subject, body } = createEnhancedEmailContent(anomalyType, alertData.location, timestamp, activityData);
        const emailResult = await sendEmailAlert(emailAddresses, subject, body);
        sendResults.push({ type: 'email', contacts: emailAddresses, ...emailResult });
        console.log('📧 Email alerts processed');
      } catch (emailError) {
        console.error('📧 Email sending failed:', emailError);
        sendResults.push({ 
          type: 'email', 
          contacts: emailAddresses, 
          success: false, 
          error: emailError.message 
        });
      }
    }

    // Step 10: Update alert data with send results
    alertData.sendResults = sendResults;
    alertData.contactsSent = {
      sms: phoneNumbers.length,
      email: emailAddresses.length,
      total: contacts.length,
    };
    alertData.status = 'completed';

    await saveData(alertData.id, alertData);

    // Step 11: Determine overall success
    const hasSuccessfulSends = sendResults.some(result => result.success !== false);
    
    console.log('✅ Automated alert process completed');
    console.log('📊 Send results:', sendResults);

    return { 
      success: hasSuccessfulSends, 
      alertData,
      sendResults,
      message: hasSuccessfulSends ? 'Alerts sent successfully' : 'All alert methods failed'
    };

  } catch (error) {
    console.error('❌ Error triggering automated alert:', error);
    
    // Save error log
    const errorData = {
      id: `error_${Date.now()}`,
      anomalyType,
      timestamp: new Date().toISOString(),
      error: error.message,
      status: 'failed',
      activityContext: activityData ? {
        detectedActivity: activityData.prediction?.activity,
        confidence: activityData.prediction?.confidence
      } : null,
    };
    await saveData(errorData.id, errorData);
    
    // Show error to user
    Alert.alert(
      "Alert Error", 
      `Failed to send alert: ${error.message}`,
      [{ text: "OK" }]
    );
    
    throw error;
  }
};

// Enhanced message creation with activity context
const createEnhancedEmergencyMessage = (anomalyType, location, timestamp, activityData) => {
  // Get activity info if available
  const activityInfo = activityData ? {
    activity: activityData.prediction?.activity || 'Unknown',
    confidence: ((activityData.prediction?.confidence || 0) * 100).toFixed(1),
    anomalyType: activityData.prediction?.anomaly?.type || 'None',
    severity: activityData.prediction?.anomaly?.severity || 'Unknown'
  } : null;

  // Create enhanced emergency message
  const emergencyTitle = anomalyType === "FALLING" ? "🚨 FALL DETECTED!" :
                        anomalyType === "SUDDEN_STOP" ? "🚨 SUDDEN STOP DETECTED!" :
                        anomalyType === "PANIC" ? "🚨 PANIC BUTTON PRESSED!" :
                        "🚨 EMERGENCY DETECTED!";

  let message = `${emergencyTitle}

🆘 IMMEDIATE ASSISTANCE REQUIRED!`;

  // Add AI detection info if available
  if (activityInfo) {
    message += `

🤖 AI DETECTION DETAILS:
• Activity: ${activityInfo.activity}
• Confidence: ${activityInfo.confidence}%
• Anomaly: ${activityInfo.anomalyType}
• Severity: ${activityInfo.severity}`;
  }

  message += `

📍 LOCATION:
${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}

📍 ADDRESS:
${location.address || 'Address not available'}

🗺️ GOOGLE MAPS:
${location.mapUrls.googleMaps}

⏰ TIME:
${new Date(timestamp).toLocaleString()}

- NYRA Emergency App with AI Detection`;

  return message;
};

// Enhanced email content creation
const createEnhancedEmailContent = (anomalyType, location, timestamp, activityData) => {
  const activityInfo = activityData ? {
    activity: activityData.prediction?.activity || 'Unknown',
    confidence: ((activityData.prediction?.confidence || 0) * 100).toFixed(1),
    anomalyType: activityData.prediction?.anomaly?.type || 'None',
    severity: activityData.prediction?.anomaly?.severity || 'Unknown'
  } : null;

  const subject = `🚨 EMERGENCY ALERT${activityInfo ? ` - ${activityInfo.activity} DETECTED` : ''} - NYRA`;

  const body = createEnhancedEmergencyMessage(anomalyType, location, timestamp, activityData);

  return { subject, body };
};

// Helper function to test alert system
export const testAlert = async () => {
  try {
    console.log('🧪 Testing alert system...');
    const result = await triggerAlert('TEST');
    console.log('🧪 Test completed:', result);
    return result;
  } catch (error) {
    console.error('🧪 Test failed:', error);
    throw error;
  }
};

// Export enhanced functions for backward compatibility
export { createEnhancedEmergencyMessage, createEnhancedEmailContent };