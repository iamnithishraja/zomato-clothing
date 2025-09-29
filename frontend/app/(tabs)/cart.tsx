import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Alert,
  TextInput
} from 'react-native';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/api/client';

interface CartItem {
  productId: string;
  productName: string;
  productPrice: number;
  productImage: string;
  storeId: string;
  storeName: string;
  quantity: number;
}

export default function CartScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [shippingAddress, setShippingAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const hasProcessedParams = useRef(false);

  useEffect(() => {
    // If product data is passed from product card, add it to cart (only once)
    if (params.productId && !hasProcessedParams.current) {
      const newItem: CartItem = {
        productId: params.productId as string,
        productName: params.productName as string,
        productPrice: parseFloat(params.productPrice as string),
        productImage: params.productImage as string,
        storeId: params.storeId as string,
        storeName: params.storeName as string,
        quantity: 1
      };
      setCartItems([newItem]);
      hasProcessedParams.current = true;
    }
  }, [params.productId, params.productName, params.productPrice, params.productImage, params.storeId, params.storeName]);

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCartItems(items => 
      items.map(item => 
        item.productId === productId 
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCartItems(items => items.filter(item => item.productId !== productId));
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.productPrice * item.quantity), 0);
  };

  const calculateDeliveryFee = () => {
    return cartItems.length > 0 ? 50 : 0; // Fixed delivery fee
  };

  const calculateGrandTotal = () => {
    return calculateTotal() + calculateDeliveryFee();
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      Alert.alert('Error', 'Please login to place an order');
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }

    if (!shippingAddress.trim()) {
      Alert.alert('Error', 'Please enter your shipping address');
      return;
    }

    try {
      setIsLoading(true);

      // Group items by store
      const ordersByStore = cartItems.reduce((acc, item) => {
        if (!acc[item.storeId]) {
          acc[item.storeId] = {
            storeId: item.storeId,
            storeName: item.storeName,
            items: []
          };
        }
        acc[item.storeId].items.push({
          product: item.productId,
          quantity: item.quantity,
          price: item.productPrice
        });
        return acc;
      }, {} as Record<string, any>);

      // Create orders for each store
      const orderPromises = Object.values(ordersByStore).map(async (storeOrder: any) => {
        const orderData = {
          store: storeOrder.storeId,
          orderItems: storeOrder.items,
          totalAmount: storeOrder.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0),
          shippingAddress: shippingAddress.trim(),
          paymentMethod: 'COD' as const
        };

        return apiClient.post('/api/v1/order', orderData);
      });

      await Promise.all(orderPromises);

      Alert.alert(
        'Order Placed Successfully!',
        'Your order has been placed and will be processed soon.',
        [
          {
            text: 'OK',
            onPress: () => {
              setCartItems([]);
              setShippingAddress('');
              router.push('/(tabs)/order');
            }
          }
        ]
      );

    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Error', 'Failed to place order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={Colors.gradients.primary as [string, string]}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Shopping Cart</Text>
        </LinearGradient>
        
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={80} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
          <Text style={styles.emptySubtitle}>
            Add some products to get started
          </Text>
          <TouchableOpacity 
            style={styles.shopButton}
            onPress={() => router.push('/')}
          >
            <Text style={styles.shopButtonText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={Colors.gradients.primary as [string, string]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Shopping Cart</Text>
        <Text style={styles.headerSubtitle}>{cartItems.length} item{cartItems.length > 1 ? 's' : ''}</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cart Items */}
        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>Items in Cart</Text>
          {cartItems.map((item) => (
            <View key={item.productId} style={styles.cartItem}>
              <Image 
                source={{ uri: item.productImage || 'https://via.placeholder.com/80' }} 
                style={styles.itemImage}
                resizeMode="cover"
              />
              
              <View style={styles.itemDetails}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.productName}
                </Text>
                <Text style={styles.itemStore}>{item.storeName}</Text>
                <Text style={styles.itemPrice}>₹{item.productPrice}</Text>
              </View>

              <View style={styles.quantityControls}>
                <TouchableOpacity 
                  style={styles.quantityButton}
                  onPress={() => updateQuantity(item.productId, item.quantity - 1)}
                >
                  <Ionicons name="remove" size={16} color={Colors.textPrimary} />
                </TouchableOpacity>
                
                <Text style={styles.quantityText}>{item.quantity}</Text>
                
                <TouchableOpacity 
                  style={styles.quantityButton}
                  onPress={() => updateQuantity(item.productId, item.quantity + 1)}
                >
                  <Ionicons name="add" size={16} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => removeFromCart(item.productId)}
              >
                <Ionicons name="trash-outline" size={20} color={Colors.error} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Shipping Address */}
        <View style={styles.addressSection}>
          <Text style={styles.sectionTitle}>Shipping Address</Text>
          <TextInput
            style={styles.addressInput}
            placeholder="Enter your complete address"
            value={shippingAddress}
            onChangeText={setShippingAddress}
            multiline
            numberOfLines={3}
            placeholderTextColor={Colors.textSecondary}
          />
        </View>

        {/* Order Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₹{calculateTotal()}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>₹{calculateDeliveryFee()}</Text>
          </View>
          
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{calculateGrandTotal()}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.placeOrderButton, isLoading && styles.placeOrderButtonDisabled]}
          onPress={handlePlaceOrder}
          disabled={isLoading}
        >
          <LinearGradient
            colors={isLoading ? [Colors.textSecondary, Colors.textSecondary] : Colors.gradients.primary as [string, string]}
            style={styles.placeOrderGradient}
          >
            <Text style={styles.placeOrderText}>
              {isLoading ? 'Placing Order...' : `Place Order - ₹${calculateGrandTotal()}`}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textPrimary,
    opacity: 0.8,
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  shopButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  itemsSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  cartItem: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  itemStore: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    padding: 4,
    marginRight: 12,
  },
  quantityButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 6,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
  removeButton: {
    padding: 8,
  },
  addressSection: {
    marginTop: 20,
  },
  addressInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.backgroundSecondary,
    textAlignVertical: 'top',
  },
  summarySection: {
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.backgroundSecondary,
    paddingTop: 12,
    marginTop: 8,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  placeOrderButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  placeOrderButtonDisabled: {
    opacity: 0.6,
  },
  placeOrderGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  placeOrderText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
});
