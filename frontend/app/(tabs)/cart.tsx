import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Alert,
  TextInput,
  Animated,
  PanResponder
} from 'react-native';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/api/client';
import { useCart } from '@/contexts/CartContext';
import type { CartItem as CartItemType } from '@/contexts/CartContext';

// Helper: format INR without decimals across the app UI
const formatINR = (value: number) => Math.round(value).toLocaleString('en-IN', { maximumFractionDigits: 0 });

const SwipeableCartItem = ({ item, updateQuantity, removeItem }: { item: CartItemType; updateQuantity: (productId: string, qty: number) => void; removeItem: (productId: string) => void }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const [showDelete, setShowDelete] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0 && gestureState.dx > -100) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -50) {
          Animated.spring(translateX, {
            toValue: -80,
            useNativeDriver: true,
          }).start();
          setShowDelete(true);
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
          setShowDelete(false);
        }
      },
    })
  ).current;

  const handleDelete = () => {
    Animated.timing(translateX, {
      toValue: -400,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      removeItem(item.productId);
    });
  };

  return (
    <View style={styles.swipeContainer}>
      <View style={styles.deleteButtonContainer}>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={handleDelete}
        >
          <Ionicons name="trash" size={24} color="#FFFFFF" />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>

      <Animated.View
        style={[
          styles.cartItem,
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.itemImageContainer}>
          <Image 
            source={{ uri: item.product.images?.[0] || 'https://via.placeholder.com/80' }} 
            style={styles.itemImage}
            resizeMode="cover"
          />
        </View>
        
        <View style={styles.itemDetails}>
          <Text style={styles.itemName} numberOfLines={2}>
            {item.product.name}
          </Text>
          <Text style={styles.itemStore}>
            {typeof item.product.storeId === 'object' 
              ? ((item.product.storeId as any).storeName || 'Store') 
              : 'Store'}
          </Text>
          <View style={styles.priceQuantityRow}>
            <Text style={styles.itemPrice}>₹{formatINR(item.price)}</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={() => updateQuantity(item.productId, item.qty - 1)}
              >
                <Ionicons name="remove" size={18} color={Colors.textPrimary} />
              </TouchableOpacity>
              
              <Text style={styles.quantityText}>{item.qty}</Text>
              
              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={() => updateQuantity(item.productId, item.qty + 1)}
              >
                <Ionicons name="add" size={18} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.itemTotal}>Total: ₹{formatINR(item.price * item.qty)}</Text>
        </View>
      </Animated.View>
    </View>
  );
};

export default function CartScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { items, updateQty, removeItem } = useCart();
  const [shippingAddress, setShippingAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const updateQuantity = (productId: string, newQuantity: number) => {
    updateQty(productId, newQuantity);
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => total + (item.price * item.qty), 0);
  };

  const calculateDeliveryFee = () => {
    return items.length > 0 ? 50 : 0;
  };

  const calculateGrandTotal = () => {
    return calculateTotal() + calculateDeliveryFee();
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      Alert.alert('Error', 'Please login to place an order');
      return;
    }

    if (items.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }

    if (!shippingAddress.trim()) {
      Alert.alert('Error', 'Please enter your shipping address');
      return;
    }

    try {
      setIsLoading(true);

      const ordersByStore = items.reduce((acc, item) => {
        const storeId = typeof item.product.storeId === 'object' ? (item.product.storeId as any)._id : (item.product.storeId as any);
        const storeName = typeof item.product.storeId === 'object' ? ((item.product.storeId as any).storeName || 'Store') : 'Store';
        if (!acc[storeId]) {
          acc[storeId] = {
            storeId,
            storeName,
            items: [] as any[],
          };
        }
        acc[storeId].items.push({
          product: item.productId,
          quantity: item.qty,
          price: item.price,
        });
        return acc;
      }, {} as Record<string, any>);

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

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={Colors.gradients.primary as [string, string]}
          style={styles.headerEmpty}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.headerTitleBlack}>Shopping Cart</Text>
        </LinearGradient>
        
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="cart-outline" size={64} color="#CCCCCC" />
          </View>
          <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
          <Text style={styles.emptySubtitle}>
            Looks like you haven't added anything to your cart yet
          </Text>
          <TouchableOpacity 
            style={styles.shopButton}
            onPress={() => router.push('/')}
          >
            <LinearGradient
              colors={Colors.gradients.primary as [string, string]}
              style={styles.shopButtonGradient}
            >
              <Ionicons name="bag-handle-outline" size={20} color="#000000" style={{ marginRight: 8 }} />
              <Text style={styles.shopButtonText}>Start Shopping</Text>
            </LinearGradient>
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
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={styles.headerTitleBlack}>Shopping Cart</Text>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Cart Items */}
        <View style={styles.itemsSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bag-handle-outline" size={20} color={Colors.textPrimary} />
            <Text style={styles.sectionTitle}>Your Items</Text>
          </View>
          <Text style={styles.swipeHint}>← Swipe left to delete</Text>
          {items.map((item) => (
            <SwipeableCartItem
              key={item.productId}
              item={item}
              updateQuantity={updateQuantity}
              removeItem={removeItem}
            />
          ))}
        </View>

        {/* Shipping Address */}
        <View style={styles.addressSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={20} color={Colors.textPrimary} />
            <Text style={styles.sectionTitle}>Delivery Address</Text>
          </View>
          <TextInput
            style={styles.addressInput}
            placeholder="Enter your complete delivery address"
            value={shippingAddress}
            onChangeText={setShippingAddress}
            multiline
            numberOfLines={4}
            placeholderTextColor={Colors.textSecondary}
          />
        </View>

        {/* Order Summary */}
        <View style={styles.summarySection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="receipt-outline" size={20} color={Colors.textPrimary} />
            <Text style={styles.sectionTitle}>Bill Details</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Item Total</Text>
              <Text style={styles.summaryValue}>₹{formatINR(calculateTotal())}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <View style={styles.summaryLabelWithIcon}>
                <Text style={styles.summaryLabel}>Delivery Fee</Text>
                <Ionicons name="bicycle" size={16} color={Colors.textSecondary} style={{ marginLeft: 4 }} />
              </View>
              <Text style={styles.summaryValue}>₹{formatINR(calculateDeliveryFee())}</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>To Pay</Text>
              <Text style={styles.totalValue}>₹{formatINR(calculateGrandTotal())}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed Footer */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <View style={styles.footerLeft}>
            <Text style={styles.footerTotal}>₹{formatINR(calculateGrandTotal())}</Text>
            <Text style={styles.footerSubtext}>Total Amount</Text>
          </View>
          <TouchableOpacity 
            style={[styles.placeOrderButton, isLoading && styles.placeOrderButtonDisabled]}
            onPress={handlePlaceOrder}
            disabled={isLoading}
          >
            <LinearGradient
              colors={isLoading ? ['#CCCCCC', '#CCCCCC'] : Colors.gradients.primary as [string, string]}
              style={styles.placeOrderGradient}
            >
              <Text style={styles.placeOrderText}>
                {isLoading ? 'Processing...' : 'Place Order'}
              </Text>
              {!isLoading && <Ionicons name="arrow-forward" size={20} color={Colors.textPrimary} style={{ marginLeft: 8 }} />}
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
    backgroundColor: Colors.background,
    paddingTop: 25,
    paddingBottom: 6,
    paddingHorizontal: 20,
  },
  headerEmpty: {
    backgroundColor: Colors.background,
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleBlack: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  itemBadge: {
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 32,
    alignItems: 'center',
  },
  itemBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitleBlack: {
    fontSize: 14,
    color: '#666666',
    marginTop: 6,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  shopButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  shopButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  shopButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  itemsSection: {
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginLeft: 8,
  },
  swipeHint: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  swipeContainer: {
    marginBottom: 16,
    height: 120,
    position: 'relative',
  },
  deleteButtonContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: Colors.error,
    width: 70,
    height: 100,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  cartItem: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    height: 120,
  },
  itemImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    marginRight: 16,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'space-between',
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
    marginBottom: 8,
  },
  priceQuantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 4,
  },
  quantityButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
  itemTotal: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  addressSection: {
    marginTop: 24,
  },
  addressInput: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.backgroundSecondary,
    textAlignVertical: 'top',
    minHeight: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summarySection: {
    marginTop: 24,
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  summaryLabelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.backgroundSecondary,
    marginVertical: 8,
  },
  totalRow: {
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  footer: {
    backgroundColor: Colors.background,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  footerLeft: {
    flex: 1,
  },
  footerTotal: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  footerSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  placeOrderButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  placeOrderButtonDisabled: {
    opacity: 0.6,
  },
  placeOrderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 28,
  },
  placeOrderText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
});
