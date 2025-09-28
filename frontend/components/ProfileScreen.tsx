import React, { useState } from 'react';
import { StyleSheet, View, Text, StatusBar, TouchableOpacity, Alert, ScrollView, TextInput, Modal } from 'react-native';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';
import apiClient from '../api/client';

const ProfileScreen = () => {
  const { user, logout, isAuthenticated, updateUser } = useAuth();
  const router = useRouter();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editData, setEditData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    gender: user?.gender || ''
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // Navigate to auth screen after logout
              router.replace('/auth/Auth');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'Merchant':
        return 'Merchant';
      case 'Delivery':
        return 'Delivery Partner';
      case 'User':
        return 'Customer';
      default:
        return role;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Merchant':
        return 'storefront';
      case 'Delivery':
        return 'bicycle';
      case 'User':
        return 'person';
      default:
        return 'person';
    }
  };

  const handleEditProfile = () => {
    setEditData({
      name: user?.name || '',
      email: user?.email || '',
      gender: user?.gender || ''
    });
    setIsEditModalVisible(true);
  };

  const handleUpdateProfile = async () => {
    try {
      setIsUpdating(true);
      const response = await apiClient.put('/api/v1/user/profile', editData);
      if (response.data.success) {
        await updateUser(response.data.user);
        setIsEditModalVisible(false);
        Alert.alert('Success', 'Profile updated successfully!');
      } else {
        Alert.alert('Error', response.data.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
        <View style={styles.content}>
          <Ionicons name="person-outline" size={80} color={Colors.primary} />
          <Text style={styles.title}>Not Logged In</Text>
          <Text style={styles.description}>
            Please log in to view your profile.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      
      {/* Header */}
      <LinearGradient
        colors={Colors.gradients.primary as [string, string]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.profileIconContainer}>
            <Ionicons 
              name={getRoleIcon(user.role)} 
              size={40} 
              color={Colors.textPrimary} 
            />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.name || 'User'}</Text>
            <Text style={styles.userRole}>{getRoleDisplayName(user.role)}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Profile Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile Information</Text>
            
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="person" size={20} color={Colors.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Name</Text>
                  <Text style={styles.infoValue}>{user.name || 'Not provided'}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="mail" size={20} color={Colors.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>
                    {user.email || 'Not provided'}
                    {user.isEmailVerified && (
                      <Text style={styles.verifiedText}> ✓ Verified</Text>
                    )}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="call" size={20} color={Colors.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>
                    {user.phone || 'Not provided'}
                    {user.isPhoneVerified && (
                      <Text style={styles.verifiedText}> ✓ Verified</Text>
                    )}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="transgender" size={20} color={Colors.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Gender</Text>
                  <Text style={styles.infoValue}>{user.gender || 'Not specified'}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Profile Status</Text>
                  <Text style={[
                    styles.infoValue,
                    user.isProfileComplete ? styles.completeText : styles.incompleteText
                  ]}>
                    {user.isProfileComplete ? 'Complete' : 'Incomplete'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Account Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Actions</Text>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleEditProfile}>
              <LinearGradient
                colors={Colors.gradients.primary as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionButtonGradient}
              >
                <View style={styles.actionButtonContent}>
                  <Ionicons name="create" size={24} color={Colors.textPrimary} />
                  <Text style={styles.actionButtonText}>Edit Profile</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, styles.logoutButton]} onPress={handleLogout}>
              <LinearGradient
                colors={[Colors.error, '#B71C1C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionButtonGradient}
              >
                <View style={styles.actionButtonContent}>
                  <Ionicons name="log-out" size={24} color={Colors.textPrimary} />
                  <Text style={styles.actionButtonText}>Logout</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={handleUpdateProfile} disabled={isUpdating}>
              <Text style={[styles.modalSaveText, isUpdating && styles.disabledText]}>
                {isUpdating ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.textInput}
                value={editData.name}
                onChangeText={(text) => setEditData({ ...editData, name: text })}
                placeholder="Enter your name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.textInput}
                value={editData.email}
                onChangeText={(text) => setEditData({ ...editData, email: text })}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Gender</Text>
              <TextInput
                style={styles.textInput}
                value={editData.gender}
                onChangeText={(text) => setEditData({ ...editData, gender: text })}
                placeholder="Enter your gender"
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    color: Colors.textPrimary,
    opacity: 0.8,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoContent: {
    flex: 1,
    marginLeft: 16,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  verifiedText: {
    color: Colors.success,
    fontWeight: '600',
  },
  completeText: {
    color: Colors.success,
    fontWeight: '600',
  },
  incompleteText: {
    color: Colors.warning,
    fontWeight: '600',
  },
  actionButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: Colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  actionButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginLeft: 12,
  },
  logoutButton: {
    marginTop: 12,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  modalCancelText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  disabledText: {
    color: Colors.textSecondary,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },
  // Fallback styles for not logged in state
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 24,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default ProfileScreen;
