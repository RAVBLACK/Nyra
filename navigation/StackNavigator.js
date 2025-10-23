import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Appbar } from "react-native-paper";
import ActivityDetectionScreen from '../screens/ActivityDetectionScreen';

// Import screens
import HomeScreen from "../screens/HomeScreen";
import AlertScreen from "../screens/AlertScreen";
import ContactsScreen from "../screens/ContactsScreen";
import SettingsScreen from "../screens/SettingsScreen";

const Stack = createNativeStackNavigator();

// Custom header for the Home screen
const HomeHeader = ({ navigation }) => {
  return (
    <Appbar.Header>
      <Appbar.Content title="NYRA" />
      <Appbar.Action
        icon="account-multiple"
        onPress={() => navigation.navigate("Contacts")}
      />
      <Appbar.Action
        icon="cog"
        onPress={() => navigation.navigate("Settings")}
      />
    </Appbar.Header>
  );
};

const StackNavigator = () => {
  return (
    <Stack.Navigator>
      {/* Home Screen */}
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={({ navigation }) => ({
          header: () => <HomeHeader navigation={navigation} />, // Pass custom header as an option
        })}
      />
      <Stack.Screen 
        name="ActivityDetection" 
        component={ActivityDetectionScreen} 
        options={{ title: 'Activity Detection' }}
      />
      {/* Other Screens */}
      <Stack.Screen name="Alert" component={AlertScreen} />
      <Stack.Screen name="Contacts" component={ContactsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
};

export default StackNavigator;