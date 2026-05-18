import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, Image,
  TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { shopService } from '../../services/shops';
import { uploadService } from '../../services/upload';
import Colors from '../../constants/colors';

const CATEGORIES = [
  'Groceries', 'Dairy', 'Vegetables & Fruits', 'Snacks', 'Beverages',
  'Bakery', 'Meat & Seafood', 'Personal Care', 'Household',
];

interface FormState {
  name: string;
  description: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  delivery_radius_km: string;
  opening_time: string;
  closing_time: string;
  categories: string[];
  lat: number | null;
  lng: number | null;
  image_url: string | null;
}

export default function RegisterShop() {
  const [form, setForm] = useState<FormState>({
    name: '', description: '', phone: '', address: '',
    city: '', pincode: '', delivery_radius_km: '5',
    opening_time: '09:00', closing_time: '21:00',
    categories: [], lat: null, lng: null, image_url: null,
  });
  const [bannerUri, setBannerUri] = useState<string | null>(null);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { detectLocation(); }, []);

  async function detectLocation() {
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({ type: 'error', text1: 'Location permission denied', text2: 'Enter coordinates manually or allow location access.' });
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setForm((f) => ({ ...f, lat: loc.coords.latitude, lng: loc.coords.longitude }));
    } catch {
      Toast.show({ type: 'error', text1: 'Could not get location', text2: 'Please enable location services and try again.' });
    } finally {
      setLocLoading(false);
    }
  }

  async function pickBanner() {
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
    const uri = result.assets[0].uri;
    setBannerUri(uri);
    setBannerUploading(true);
    try {
      const url = await uploadService.uploadImage(uri);
      setForm((f) => ({ ...f, image_url: url }));
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to upload banner' });
      setBannerUri(null);
    } finally {
      setBannerUploading(false);
    }
  }

  function toggleCategory(cat: string) {
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter((c) => c !== cat)
        : [...f.categories, cat],
    }));
  }

  function set(field: keyof FormState) {
    return (val: string) => setForm((f) => ({ ...f, [field]: val }));
  }

  async function handleSubmit() {
    const { name, phone, address, city, pincode, lat, lng, delivery_radius_km, opening_time, closing_time } = form;

    if (!name.trim() || !phone.trim() || !address.trim() || !city.trim() || !pincode.trim()) {
      Toast.show({ type: 'error', text1: 'Please fill all required fields' });
      return;
    }
    if (!lat || !lng) {
      Toast.show({ type: 'error', text1: 'Location required', text2: 'Tap "Detect Location" to set your shop location.' });
      return;
    }

    setSubmitting(true);
    try {
      await shopService.createShop({
        name: name.trim(),
        description: form.description.trim() || undefined,
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        pincode: pincode.trim(),
        delivery_radius_km: parseFloat(delivery_radius_km) || 5,
        opening_time,
        closing_time,
        categories: form.categories,
        location: { type: 'Point', coordinates: [lng, lat] },
        image_url: form.image_url || undefined,
      });
      Toast.show({ type: 'success', text1: 'Shop registered!', text2: 'Your shop is now live.' });
      router.replace('/(shop)');
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? 'Registration failed. Try again.';
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Ionicons name="arrow-back" size={22} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Register Your Shop</Text>
        </View>

        <View style={styles.body}>
          {/* Shop Banner */}
          <Text style={styles.sectionTitle}>Shop Banner</Text>
          <TouchableOpacity style={styles.bannerPicker} onPress={pickBanner} disabled={bannerUploading} activeOpacity={0.8}>
            {bannerUri ? (
              <>
                <Image source={{ uri: bannerUri }} style={styles.bannerPreview} />
                {bannerUploading && (
                  <View style={styles.bannerOverlay}>
                    <ActivityIndicator color={Colors.white} />
                    <Text style={styles.bannerOverlayText}>Uploading...</Text>
                  </View>
                )}
                {!bannerUploading && (
                  <View style={styles.bannerEditBadge}>
                    <Ionicons name="camera" size={14} color={Colors.white} />
                    <Text style={styles.bannerEditText}>Change</Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.bannerEmpty}>
                <Ionicons name="image-outline" size={36} color={Colors.gray} />
                <Text style={styles.bannerEmptyText}>Tap to add a shop banner</Text>
                <Text style={styles.bannerHint}>Recommended: 16:9, under 5 MB</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Basic Info */}
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <Field label="Shop Name *" placeholder="e.g. Ramu Kirana Store" value={form.name} onChangeText={set('name')} />
          <Field label="Description" placeholder="Brief description of your shop" value={form.description} onChangeText={set('description')} multiline />
          <Field label="Phone Number *" placeholder="+91 98765 43210" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" />

          {/* Address */}
          <Text style={styles.sectionTitle}>Address</Text>
          <Field label="Street Address *" placeholder="House / Shop No, Street, Area" value={form.address} onChangeText={set('address')} multiline />
          <Field label="City *" placeholder="e.g. Mumbai" value={form.city} onChangeText={set('city')} />
          <Field label="Pincode *" placeholder="e.g. 400001" value={form.pincode} onChangeText={set('pincode')} keyboardType="numeric" maxLength={6} />

          {/* Location */}
          <Text style={styles.sectionTitle}>Shop Location</Text>
          <View style={styles.locBox}>
            {form.lat && form.lng ? (
              <View style={styles.locRow}>
                <Ionicons name="location" size={18} color={Colors.success} />
                <Text style={styles.locText}>
                  {form.lat.toFixed(5)}, {form.lng.toFixed(5)}
                </Text>
              </View>
            ) : (
              <Text style={styles.locMissing}>Location not set</Text>
            )}
            <TouchableOpacity style={styles.locBtn} onPress={detectLocation} disabled={locLoading}>
              {locLoading
                ? <ActivityIndicator size="small" color={Colors.primary} />
                : <><Ionicons name="navigate-outline" size={16} color={Colors.primary} /><Text style={styles.locBtnText}>Detect Location</Text></>}
            </TouchableOpacity>
          </View>

          {/* Delivery & Hours */}
          <Text style={styles.sectionTitle}>Operations</Text>
          <Field label="Delivery Radius (km)" placeholder="5" value={form.delivery_radius_km} onChangeText={set('delivery_radius_km')} keyboardType="numeric" />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Field label="Opening Time" placeholder="09:00" value={form.opening_time} onChangeText={set('opening_time')} />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Field label="Closing Time" placeholder="21:00" value={form.closing_time} onChangeText={set('closing_time')} />
            </View>
          </View>

          {/* Categories */}
          <Text style={styles.sectionTitle}>Categories</Text>
          <View style={styles.chips}>
            {CATEGORIES.map((cat) => {
              const selected = form.categories.includes(cat);
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => toggleCategory(cat)}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Submit */}
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
            {submitting
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={styles.submitText}>Register Shop</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label, placeholder, value, onChangeText, multiline, keyboardType, maxLength,
}: {
  label: string; placeholder: string; value: string;
  onChangeText: (v: string) => void; multiline?: boolean;
  keyboardType?: any; maxLength?: number;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMulti]}
        placeholder={placeholder}
        placeholderTextColor={Colors.textLight}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={keyboardType ?? 'default'}
        maxLength={maxLength}
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, paddingTop: 56, paddingBottom: 20, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  bannerPicker: { borderRadius: 12, overflow: 'hidden', marginBottom: 8, backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed' },
  bannerPreview: { width: '100%', height: 160 },
  bannerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', gap: 8 },
  bannerOverlayText: { color: Colors.white, fontWeight: '600' },
  bannerEditBadge: { position: 'absolute', bottom: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  bannerEditText: { fontSize: 12, color: Colors.white, fontWeight: '600' },
  bannerEmpty: { height: 160, alignItems: 'center', justifyContent: 'center', gap: 6 },
  bannerEmptyText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  bannerHint: { fontSize: 12, color: Colors.textLight },
  back: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.white },
  body: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 20, marginBottom: 10 },
  field: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 5 },
  input: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: Colors.text },
  inputMulti: { minHeight: 80, textAlignVertical: 'top', paddingTop: 12 },
  row: { flexDirection: 'row' },
  locBox: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locText: { fontSize: 13, color: Colors.text, fontWeight: '500' },
  locMissing: { fontSize: 13, color: Colors.textSecondary },
  locBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: Colors.primary },
  locBtnText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white },
  chipSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '15' },
  chipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  chipTextSelected: { color: Colors.primary, fontWeight: '700' },
  submitBtn: { backgroundColor: Colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  submitText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
});
