# 🛡️ NYRA - Your Personal Safety Guardian

<div align="center">
  <img src="./assets/logo.png" alt="NYRA Logo" width="120" height="120">
  
  **Advanced AI-Powered Personal Safety Application**
  
  [![React Native](https://img.shields.io/badge/React%20Native-0.76.6-blue.svg)](https://reactnative.dev/)
  [![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020.svg)](https://expo.dev/)
  [![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
  [![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20iOS-lightgrey.svg)](https://github.com/your-username/nyra-app)
</div>

---

## 🚀 Overview

NYRA (Neural Yet Responsive Assistant) is an intelligent personal safety application that uses advanced Human Activity Recognition (HAR) technology to automatically detect emergency situations and alert your emergency contacts. Built with React Native and powered by custom AI algorithms, NYRA provides 24/7 protection without requiring manual intervention.

### 🎯 Key Features

- **🤖 AI-Powered Activity Detection** - Real-time HAR model that distinguishes between normal activities and emergencies
- **⚡ Automatic Emergency Alerts** - Instant notifications to emergency contacts when danger is detected
- **📍 GPS Location Tracking** - Precise location sharing during emergencies
- **📱 Modern Safety-First UI** - Intuitive interface with calming safety-blue theme
- **🔋 Battery Optimized** - Efficient background processing with minimal battery drain
- **🚨 Sudden Stop Detection** - Advanced algorithms to detect accidents, attacks, or medical emergencies

---

## 🛠️ Technology Stack

### **Frontend**
- **React Native** - Cross-platform mobile development
- **Expo** - Development platform and deployment
- **React Navigation** - Navigation management
- **React Native Paper** - Material Design components

### **AI & Sensors**
- **Custom HAR Model** - Human Activity Recognition algorithms
- **Expo Sensors** - Accelerometer, Gyroscope, Magnetometer access
- **Expo Location** - GPS tracking and geolocation services
- **Real-time Processing** - On-device AI inference

### **Backend Services**
- **Expo SMS** - Emergency SMS notifications
- **Expo MailComposer** - Email alert system
- **AsyncStorage** - Local data persistence

---

## 🧠 HAR Model Features

### **Activity Detection**
- 🚶‍♂️ **Walking** - Normal pedestrian movement
- 🏃‍♂️ **Running** - High-intensity movement patterns
- 🧍‍♂️ **Standing** - Upright stationary position
- 💤 **Idle** - Minimal movement or resting
- 🚨 **SUDDEN_STOP** - Emergency detection for accidents/attacks

### **Advanced Algorithms**
- **Step Pattern Recognition** - Analyzes gait and movement rhythm
- **Orientation Analysis** - 3D device positioning and stability
- **Frequency Domain Analysis** - Identifies movement signatures
- **Multi-Factor Scoring** - Combines multiple sensors for accuracy
- **GPS Validation** - Cross-references movement with location data

---

## 🚀 Installation & Setup

### **Prerequisites**
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development - macOS only)

### **Quick Start**
```bash
# Clone the repository
git clone https://github.com/your-username/nyra-app.git
cd nyra-app

# Install dependencies
npm install

# Start the development server
npx expo start

# Run on Android device/emulator
npx expo run:android

# Run on iOS device/simulator
npx expo run:ios


