import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

export default function AccountScreen() {
  return (
      <View style={styles.container}>
        <Text style={styles.title}>Account</Text>
        <Text style={styles.subtitle}>Manage your profile</Text>
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
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
