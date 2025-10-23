import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Appbar } from "react-native-paper";

const SettingsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>App Settings</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  text: {
    fontSize: 18,
    color: "#333",
  },
});

export default SettingsScreen;