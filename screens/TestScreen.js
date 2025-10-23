import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { saveData, getData } from "../services/storageService";

const TestScreen = () => {
  useEffect(() => {
    const testStorage = async () => {
      await saveData("testKey", { name: "NYRA", createdAt: new Date() });
      const data = await getData("testKey");
      console.log("Retrieved data:", data);
    };

    testStorage(); // Call the test function when the screen loads
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Testing AsyncStorage...</Text>
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

export default TestScreen;