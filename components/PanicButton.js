import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, Text, Alert, Vibration } from "react-native";
import * as Animatable from "react-native-animatable";
import { useNavigation } from "@react-navigation/native";

const PanicButton = ({ onPress }) => {
  const [isPressed, setIsPressed] = useState(false);
  const navigation = useNavigation();

  const handlePress = () => {
    if (isPressed) return;

    // Haptic feedback
    Vibration.vibrate([0, 100, 50, 100]);

    Alert.alert(
      "🚨 Emergency Alert",
      "This will immediately start the automated emergency alert process. Your location and audio will be sent to emergency contacts.",
      [
        { 
          text: "Cancel", 
          style: "cancel",
          onPress: () => setIsPressed(false)
        },
        { 
          text: "Send Alert", 
          style: "destructive",
          onPress: () => {
            setIsPressed(true);
            // Navigate to AlertScreen with PANIC type
            navigation.navigate("Alert", { anomalyType: "PANIC" });
            
            // Reset button state after navigation
            setTimeout(() => setIsPressed(false), 1000);
            
            // Call original onPress if provided
            if (onPress) onPress();
          }
        },
      ],
      { cancelable: true, onDismiss: () => setIsPressed(false) }
    );
  };

  return (
    <Animatable.View
      animation="pulse"
      iterationCount="infinite"
      easing="ease-in-out"
      duration={1200}
      style={styles.pulseContainer}
    >
      <TouchableOpacity 
        style={[styles.button, isPressed && styles.buttonPressed]} 
        onPress={handlePress} 
        activeOpacity={0.8}
        disabled={isPressed}
      >
        <Text style={[styles.text, isPressed && styles.textPressed]}>
          {isPressed ? "SENDING..." : "PANIC"}
        </Text>
      </TouchableOpacity>
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  pulseContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#e63946",
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  },
  buttonPressed: {
    backgroundColor: "#999",
    elevation: 3,
  },
  text: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  textPressed: {
    fontSize: 14,
  },
});

export default PanicButton;