import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';

export default function AccountScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
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
              router.replace('/auth/Auth' as any);
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
      <View style={styles.container}>
        <Text style={styles.title}>Account</Text>
        <Text style={styles.subtitle}>Manage your profile</Text>
        
        {user && (
          <View style={styles.userInfo}>
            <Text style={styles.userText}>Phone: {user.phone}</Text>
            <Text style={styles.userText}>Role: {user.role}</Text>
            <Text style={styles.userText}>Verified: {user.isPhoneVerified ? 'Yes' : 'No'}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary, // Use black for title
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 30,
  },
  userInfo: {
    backgroundColor: Colors.backgroundSecondary,
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    width: '100%',
  },
  userText: {
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  logoutButton: {
    backgroundColor: Colors.error || '#FF3B30',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  logoutText: {
    color: Colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
});
