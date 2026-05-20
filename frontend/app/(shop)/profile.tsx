import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { shopService } from '../../services/shops';
import { uploadService } from '../../services/upload';
import { useAuthStore } from '../../stores/authStore';
import { Shop } from '../../types';
import Colors from '../../constants/colors';

export default function ShopProfile() {
  const { user, logout } = useAuthStore();
  const [shop, setShop] = useState<Shop | null>(null);
  const [toggling, setToggling] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);

  useEffect(() => {
    shopService.getMyShop().then(setShop).catch(() => {});
  }, []);

  function handleLogout() {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => { logout(); router.replace('/(auth)/login'); } },
    ]);
  }

  async function performToggle() {
    if (!shop || toggling) return;
    setToggling(true);
    try {
      await shopService.updateShop({ is_open: !shop.is_open });
      setShop((s) => s ? { ...s, is_open: !s.is_open } : s);
      Toast.show({ type: 'success', text1: shop.is_open ? 'Shop is now Closed' : 'Shop is now Open' });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to update shop status' });
    } finally {
      setToggling(false);
    }
  }

  function toggleOpen() {
    if (!shop) return;
    if (shop.is_open) {
      Alert.alert(
        'Close Shop',
        'Are you sure you want to close your shop? Customers will not be able to place new orders.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Close Shop', style: 'destructive', onPress: performToggle },
        ]
      );
    } else {
      performToggle();
    }
  }

  async function updateBanner() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({ type: 'error', text1: 'Gallery permission denied' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (result.canceled) return;
    setBannerUploading(true);
    try {
      const url = await uploadService.uploadImage(result.assets[0].uri);
      await shopService.updateShop({ image_url: url });
      setShop((s) => s ? { ...s, image_url: url } : s);
      Toast.show({ type: 'success', text1: 'Banner updated!' });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to update banner' });
    } finally {
      setBannerUploading(false);
    }
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        {/* Shop banner */}
        {shop && (
          <TouchableOpacity style={styles.bannerContainer} onPress={updateBanner} disabled={bannerUploading} activeOpacity={0.85}>
            {shop.image_url ? (
              <Image source={{ uri: shop.image_url }} style={styles.bannerImage} />
            ) : (
              <View style={[styles.bannerImage, styles.bannerFallback]}>
                <Ionicons name="storefront-outline" size={40} color="rgba(255,255,255,0.6)" />
              </View>
            )}
            <View style={styles.bannerEditBtn}>
              {bannerUploading
                ? <ActivityIndicator size="small" color={Colors.white} />
                : <Ionicons name="camera" size={16} color={Colors.white} />}
              <Text style={styles.bannerEditText}>{bannerUploading ? 'Uploading...' : 'Edit Banner'}</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Owner info */}
        <View style={[styles.ownerInfo, !shop && { paddingTop: 60 }]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>
      </View>

      {shop ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shop Details</Text>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Shop Name</Text>
              <Text style={styles.cardValue}>{shop.name}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Address</Text>
              <Text style={styles.cardValue} numberOfLines={2}>{shop.address}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Phone</Text>
              <Text style={styles.cardValue}>{shop.phone}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Hours</Text>
              <Text style={styles.cardValue}>{shop.opening_time} – {shop.closing_time}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Delivery Radius</Text>
              <Text style={styles.cardValue}>{shop.delivery_radius_km} km</Text>
            </View>
            <View style={[styles.cardRow, { borderBottomWidth: 0 }]}>
              <View>
                <Text style={styles.cardLabel}>Shop Status</Text>
                <Text style={{ fontSize: 12, color: shop.is_open ? Colors.success : Colors.error, marginTop: 2 }}>
                  {toggling ? 'Updating...' : shop.is_open ? 'Open for orders' : 'Closed'}
                </Text>
              </View>
              <Switch
                value={shop.is_open}
                onValueChange={toggleOpen}
                disabled={toggling}
                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                thumbColor={shop.is_open ? Colors.primary : Colors.gray}
              />
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.noShop}>
          <Ionicons name="storefront-outline" size={48} color={Colors.gray} />
          <Text style={styles.noShopText}>No shop registered yet</Text>
          <TouchableOpacity style={styles.registerBtn} onPress={() => router.push('/(shop)/register-shop')}>
            <Text style={styles.registerBtnText}>Register Your Shop</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={Colors.error} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, paddingBottom: 20 },
  bannerContainer: { width: '100%', height: 160, paddingTop: 0 },
  bannerImage: { width: '100%', height: 160 },
  bannerFallback: { backgroundColor: Colors.primaryDark, alignItems: 'center', justifyContent: 'center' },
  bannerEditBtn: { position: 'absolute', bottom: 10, right: 12, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  bannerEditText: { fontSize: 12, color: Colors.white, fontWeight: '600' },
  ownerInfo: { alignItems: 'center', paddingTop: 16, paddingHorizontal: 16 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  avatarText: { fontSize: 28, fontWeight: '700', color: Colors.white },
  name: { fontSize: 20, fontWeight: '700', color: Colors.white },
  phone: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 3 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 10 },
  card: { backgroundColor: Colors.white, borderRadius: 12, overflow: 'hidden' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  cardLabel: { fontSize: 14, color: Colors.textSecondary, flex: 1 },
  cardValue: { fontSize: 14, fontWeight: '500', color: Colors.text, flex: 2, textAlign: 'right' },
  noShop: { alignItems: 'center', padding: 40, gap: 12 },
  noShopText: { fontSize: 14, color: Colors.textSecondary },
  registerBtn: { marginTop: 4, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  registerBtnText: { color: Colors.white, fontWeight: '600', fontSize: 15 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, margin: 16, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.error },
  logoutText: { fontSize: 15, fontWeight: '600', color: Colors.error },
});
