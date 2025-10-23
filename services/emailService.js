import * as MailComposer from 'expo-mail-composer';
import { Linking } from 'react-native';

export const sendEmailAlert = async (emailAddresses, subject, body) => {
  try {
    console.log(`📧 Sending email to ${emailAddresses.length} recipients...`);
    
    // Check if email is available
    const isAvailable = await MailComposer.isAvailableAsync();
    if (!isAvailable) {
      console.log('📧 Mail composer not available, trying mailto...');
      return await sendEmailViaMailto(emailAddresses, subject, body);
    }

    const emailOptions = {
      recipients: emailAddresses,
      subject: subject,
      body: body,
      isHtml: false,
    };

    console.log('📧 Opening email composer...');
    const result = await MailComposer.composeAsync(emailOptions);
    
    if (result.status === 'sent') {
      console.log('📧 Email sent successfully');
      return { success: true, result, method: 'composer' };
    } else if (result.status === 'cancelled') {
      console.log('📧 Email cancelled by user - trying automated fallback...');
      return await sendEmailViaMailto(emailAddresses, subject, body);
    } else {
      console.log('📧 Email failed, trying fallback...');
      return await sendEmailViaMailto(emailAddresses, subject, body);
    }
  } catch (error) {
    console.error('📧 Error sending email via composer:', error);
    // Fallback to mailto
    return await sendEmailViaMailto(emailAddresses, subject, body);
  }
};

// Fallback method using mailto URL scheme
const sendEmailViaMailto = async (emailAddresses, subject, body) => {
  try {
    console.log('📧 Using mailto fallback...');
    
    const results = [];
    
    for (const email of emailAddresses) {
      try {
        // Create mailto URL
        const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        // Check if email client is available
        const canOpen = await Linking.canOpenURL(mailtoUrl);
        
        if (canOpen) {
          await Linking.openURL(mailtoUrl);
          results.push({ 
            contact: email, 
            success: true, 
            method: 'mailto' 
          });
          console.log(`📧 Mailto opened for ${email}`);
          
          // Add delay between email windows
          await new Promise(resolve => setTimeout(resolve, 1500));
        } else {
          results.push({ 
            contact: email, 
            success: false, 
            error: 'Email client not available' 
          });
          console.log(`📧 Cannot open mailto for ${email}`);
        }
      } catch (error) {
        results.push({ 
          contact: email, 
          success: false, 
          error: error.message 
        });
        console.error(`📧 Error with mailto for ${email}:`, error);
      }
    }
    
    const hasSuccessful = results.some(r => r.success);
    return { 
      success: hasSuccessful, 
      results, 
      method: 'mailto',
      message: hasSuccessful ? 'Email clients opened' : 'All email attempts failed'
    };
  } catch (error) {
    console.error('📧 Mailto fallback failed:', error);
    return { success: false, error: error.message, method: 'mailto' };
  }
};

export const createEmailContent = (anomalyType, location, timestamp) => {
  const googleMapsUrl = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
  
  const subject = `🚨 EMERGENCY ALERT - ${anomalyType}`;
  
  const body = `🚨 EMERGENCY ALERT TRIGGERED 🚨

Alert Type: ${anomalyType === "FALL" ? "Fall detected" : 
             anomalyType === "STOP" ? "Sudden stop detected" : 
             anomalyType === "PANIC" ? "Panic button pressed" : 
             anomalyType === "TEST" ? "Test alert" :
             "Emergency detected"}

📍 LOCATION DETAILS:
Google Maps: ${googleMapsUrl}
Address: ${location.address || 'Address unavailable'}
Coordinates: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}
Accuracy: ${location.accuracy ? location.accuracy.toFixed(0) + 'm' : 'Unknown'}

⏰ TIMESTAMP:
${new Date(timestamp).toLocaleString()}

 IMMEDIATE ACTION REQUIRED:
Please check on me immediately and verify my safety!

---
This alert was automatically sent by the NYRA Emergency App.
If this is a test, please disregard the urgency but confirm receipt.`;

  return { subject, body };
};

// Test email function
export const testEmailService = async () => {
  const testEmails = ['test@example.com']; // Replace with test email
  const { subject, body } = createEmailContent('TEST', {
    latitude: 40.7128,
    longitude: -74.0060,
    address: 'Test Location, New York, NY',
    accuracy: 10
  }, null, new Date().toISOString());
  
  return await sendEmailAlert(testEmails, subject, body);
};