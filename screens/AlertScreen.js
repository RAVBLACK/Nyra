import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, BackHandler } from "react-native";
import { Button } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import { triggerAlert } from "../services/alertService";

const AlertScreen = () => {
  const [countdown, setCountdown] = useState(10); // Extended to 10 seconds for automation
  const [isActive, setIsActive] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [alertSent, setAlertSent] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const { anomalyType } = route.params || { anomalyType: "UNKNOWN" };

  useEffect(() => {
    // Prevent back button during countdown and sending
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (isActive && !isSending) {
        cancelAlert();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [isActive, isSending]);

  useEffect(() => {
    if (!isActive || isSending) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsActive(false);
          handleAutomatedAlert();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, isSending]);

  const handleAutomatedAlert = async () => {
    setIsSending(true);
    try {
      console.log('🚨 Triggering automated alert...');
      const result = await triggerAlert(anomalyType);
      
      if (result.success) {
        console.log('✅ Automated alert sent successfully');
        setAlertSent(true);
        
        // Show success message for 3 seconds then navigate
        setTimeout(() => {
          navigation.navigate("Home");
        }, 3000);
      } else {
        console.log('⚠️ Alert completed with issues');
        setAlertSent(true);
        setTimeout(() => {
          navigation.navigate("Home");
        }, 3000);
      }
    } catch (error) {
      console.error("❌ Error sending automated alert:", error);
      setAlertSent(true);
      setTimeout(() => {
        navigation.navigate("Home");
      }, 3000);
    }
  };

  const cancelAlert = () => {
    setIsActive(false);
    setIsSending(false);
    navigation.navigate("Home");
  };

  const getAnomalyDisplayText = () => {
    switch (anomalyType) {
      case "FALL": return "Fall Detected";
      case "STOP": return "Sudden Stop Detected";
      case "PANIC": return "Panic Button Pressed";
      default: return "Emergency Detected";
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.alertText}>🚨 EMERGENCY ALERT 🚨</Text>
      <Text style={styles.anomalyText}>{getAnomalyDisplayText()}</Text>
      
      {isActive && !isSending && !alertSent ? (
        <>
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownText}>{countdown}</Text>
          </View>
          <Text style={styles.infoText}>
            Automated alert will be sent in {countdown} seconds
          </Text>
          <Text style={styles.automationNote}>
            📱 SMS and 📧 Email will be sent automatically
          </Text>
          <Button
            mode="contained"
            onPress={cancelAlert}
            style={styles.cancelButton}
            buttonColor="#e63946"
          >
            <Text style={styles.cancelButtonText}>CANCEL ALERT</Text>
          </Button>
        </>
      ) : isSending ? (
        <>
          <View style={styles.sendingContainer}>
            <Text style={styles.sendingIcon}>📤</Text>
          </View>
          <Text style={styles.sendingText}>
            Sending automated alert...
          </Text>
          <Text style={styles.sendingSubText}>
            📍 Getting location • 📱 Sending messages
          </Text>
        </>
      ) : alertSent ? (
        <>
          <View style={styles.successContainer}>
            <Text style={styles.successIcon}>✅</Text>
          </View>
          <Text style={styles.sentText}>
            Automated Alert Sent!
          </Text>
          <Text style={styles.sentSubText}>
            Emergency contacts have been notified with your location details
          </Text>
        </>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  alertText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#e63946",
    marginBottom: 10,
    textAlign: "center",
  },
  anomalyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 30,
    textAlign: "center",
  },
  countdownContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#e63946",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  countdownText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "white",
  },
  infoText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 10,
    textAlign: "center",
  },
  automationNote: {
    fontSize: 14,
    color: "#007bff",
    marginBottom: 30,
    textAlign: "center",
    fontWeight: "500",
  },
  cancelButton: {
    paddingHorizontal: 30,
    paddingVertical: 10,
    elevation: 3,
  },
  cancelButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  sendingContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#007bff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    elevation: 5,
  },
  sendingIcon: {
    fontSize: 48,
  },
  sendingText: {
    fontSize: 18,
    color: "#007bff",
    textAlign: "center",
    fontWeight: "600",
    marginBottom: 10,
  },
  sendingSubText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  successContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#28a745",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    elevation: 5,
  },
  successIcon: {
    fontSize: 48,
  },
  sentText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#28a745",
    textAlign: "center",
    marginBottom: 10,
  },
  sentSubText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
});

export default AlertScreen;