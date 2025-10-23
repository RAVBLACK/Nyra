import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, Alert } from 'react-native';
import { Button, Card, IconButton } from 'react-native-paper';
import { saveData, getData } from '../services/storageService';

const ContactsScreen = () => {
  const [contacts, setContacts] = useState([]);
  const [newContact, setNewContact] = useState('');

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    const storedContacts = await getData('emergencyContacts');
    setContacts(storedContacts || []);
  };

  const validateContact = (contact) => {
    const phoneRegex = /^\+?\d[\d\s\-\(\)]{7,}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    return phoneRegex.test(contact.replace(/[\s\-\(\)]/g, '')) || emailRegex.test(contact);
  };

  const getContactType = (contact) => {
    if (/@/.test(contact)) return 'email';
    if (/^\+?\d/.test(contact.replace(/[\s\-\(\)]/g, ''))) return 'phone';
    return 'unknown';
  };

  const addContact = async () => {
    const trimmedContact = newContact.trim();
    
    if (trimmedContact === '') {
      Alert.alert('Error', 'Please enter a contact');
      return;
    }

    if (!validateContact(trimmedContact)) {
      Alert.alert('Error', 'Please enter a valid phone number or email address');
      return;
    }

    if (contacts.includes(trimmedContact)) {
      Alert.alert('Error', 'This contact already exists');
      return;
    }

    const updatedContacts = [...contacts, trimmedContact];
    await saveData('emergencyContacts', updatedContacts);
    setContacts(updatedContacts);
    setNewContact('');
    Alert.alert('Success', 'Contact added successfully');
  };

  const removeContact = async (contactToRemove) => {
    Alert.alert(
      'Remove Contact',
      `Are you sure you want to remove ${contactToRemove}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            const updatedContacts = contacts.filter(contact => contact !== contactToRemove);
            await saveData('emergencyContacts', updatedContacts);
            setContacts(updatedContacts);
          }
        },
      ]
    );
  };

  const renderContact = ({ item }) => {
    const contactType = getContactType(item);
    const icon = contactType === 'email' ? 'email' : 'phone';
    
    return (
      <Card style={styles.contactCard}>
        <Card.Content style={styles.contactContent}>
          <View style={styles.contactInfo}>
            <IconButton icon={icon} size={20} />
            <Text style={styles.contactText}>{item}</Text>
            <Text style={styles.contactType}>{contactType}</Text>
          </View>
          <IconButton
            icon="delete"
            size={20}
            iconColor="#e63946"
            onPress={() => removeContact(item)}
          />
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Emergency Contacts</Text>
      <Text style={styles.subtitle}>Add phone numbers and email addresses</Text>
      
      <FlatList
        data={contacts}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderContact}
        style={styles.list}
        showsVerticalScrollIndicator={false}
      />
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter phone number or email"
          value={newContact}
          onChangeText={setNewContact}
          keyboardType="default"
          autoCapitalize="none"
        />
        <Button
          mode="contained"
          onPress={addContact}
          style={styles.addButton}
          disabled={!newContact.trim()}
        >
          <Text style={styles.addButtonText}>Add Contact</Text>
        </Button>
      </View>
      
      <Text style={styles.info}>
        📱 Phone numbers: Will receive SMS alerts{'\n'}
        📧 Email addresses: Will receive email alerts with location details
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  list: {
    flex: 1,
    marginBottom: 20,
  },
  contactCard: {
    marginBottom: 8,
    elevation: 2,
  },
  contactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  contactInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    fontSize: 16,
    flex: 1,
    marginLeft: 8,
  },
  contactType: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  addButton: {
    paddingVertical: 4,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  info: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ContactsScreen;