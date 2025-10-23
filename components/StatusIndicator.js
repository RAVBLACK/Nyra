import React from "react";
import { View, Text, StyleSheet } from "react-native";

const StatusIndicator = ({ status }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: "#1591EA",
    marginBottom: 20,
  },
  text: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default StatusIndicator;