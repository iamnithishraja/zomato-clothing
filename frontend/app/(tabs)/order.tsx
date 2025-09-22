import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

export default function OrderScreen() {
  return (
      <View style={styles.container}>
        <Text style={styles.title}>Order</Text>
        <Text style={styles.subtitle}>Track your orders</Text>
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
  },
});


