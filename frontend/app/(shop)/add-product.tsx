import React, { useReducer, useRef, useCallback } from 'react';
import { View, Text, FlatList, ScrollView, StyleSheet, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { productService } from '../../services/products';
import { uploadService } from '../../services/upload';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { PRODUCT_CATEGORIES } from '../../constants/config';
import Colors from '../../constants/colors';

const UNITS = ['kg', 'g', 'L', 'ml', 'pcs', 'dozen', 'packet', 'bottle'];

interface AddProductState {
  name: string; category: string; price: string; mrp: string; unit: string;
  stock: string; brand: string; description: string;
  imageUri: string | null; imageUploading: boolean; loading: boolean;
}
type AddProductAction =
  | { type: 'set_name'; value: string }
  | { type: 'set_category'; value: string }
  | { type: 'set_price'; value: string }
  | { type: 'set_mrp'; value: string }
  | { type: 'set_unit'; value: string }
  | { type: 'set_stock'; value: string }
  | { type: 'set_brand'; value: string }
  | { type: 'set_description'; value: string }
  | { type: 'set_image_uri'; value: string | null }
  | { type: 'set_image_uploading'; value: boolean }
  | { type: 'set_loading'; value: boolean };
function addProductReducer(state: AddProductState, action: AddProductAction): AddProductState {
  switch (action.type) {
    case 'set_name': return { ...state, name: action.value };
    case 'set_category': return { ...state, category: action.value };
    case 'set_price': return { ...state, price: action.value };
    case 'set_mrp': return { ...state, mrp: action.value };
    case 'set_unit': return { ...state, unit: action.value };
    case 'set_stock': return { ...state, stock: action.value };
    case 'set_brand': return { ...state, brand: action.value };
    case 'set_description': return { ...state, description: action.value };
    case 'set_image_uri': return { ...state, imageUri: action.value };
    case 'set_image_uploading': return { ...state, imageUploading: action.value };
    case 'set_loading': return { ...state, loading: action.value };
  }
}

export default function AddProductScreen() {
  const [state, dispatch] = useReducer(addProductReducer, {
    name: '', category: PRODUCT_CATEGORIES[0], price: '', mrp: '',
    unit: UNITS[0], stock: '', brand: '', description: '',
    imageUri: null, imageUploading: false, loading: false,
  });
  const { name, category, price, mrp, unit, stock, brand, description, imageUri, imageUploading, loading } = state;
  const imageUrlRef = useRef<string | null>(null);

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({ type: 'error', text1: 'Gallery permission denied' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;
    const uri = result.assets[0].uri;
    dispatch({ type: 'set_image_uri', value: uri });
    dispatch({ type: 'set_image_uploading', value: true });
    try {
      const url = await uploadService.uploadImage(uri);
      imageUrlRef.current = url;
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to upload image' });
      dispatch({ type: 'set_image_uri', value: null });
      imageUrlRef.current = null;
    } finally {
      dispatch({ type: 'set_image_uploading', value: false });
    }
  }

  async function handleSubmit() {
    if (!name || !price || !mrp || !stock) {
      Toast.show({ type: 'error', text1: 'Fill in all required fields' });
      return;
    }
    dispatch({ type: 'set_loading', value: true });
    try {
      await productService.addProduct({
        name,
        category,
        price: parseFloat(price),
        mrp: parseFloat(mrp),
        unit,
        quantity_in_stock: parseInt(stock, 10),
        brand: brand || undefined,
        description: description || undefined,
        image_url: imageUrlRef.current || undefined,
      });
      Toast.show({ type: 'success', text1: 'Product added!' });
      router.back();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.response?.data?.detail ?? 'Failed to add product' });
    } finally {
      dispatch({ type: 'set_loading', value: false });
    }
  }

  const renderCategoryChip = useCallback(({ item: c }: { item: string }) => (
    <Pressable style={[styles.chip, category === c && styles.chipActive]} onPress={() => dispatch({ type: 'set_category', value: c })}>
      <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
    </Pressable>
  ), [category]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Add Product</Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Product Image */}
        <Text style={styles.label}>Product Image</Text>
        <Pressable style={({ pressed }) => [styles.imagePicker, pressed && !imageUploading && { opacity: 0.8 }]} onPress={pickImage} disabled={imageUploading}>
          {imageUri ? (
            <>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              {imageUploading && (
                <View style={styles.imageOverlay}>
                  <ActivityIndicator color={Colors.white} />
                  <Text style={styles.imageOverlayText}>Uploading...</Text>
                </View>
              )}
              {!imageUploading && (
                <View style={styles.imageEditBadge}>
                  <Ionicons name="camera" size={14} color={Colors.white} />
                  <Text style={styles.imageEditText}>Change</Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.imageEmpty}>
              <Ionicons name="camera-outline" size={32} color={Colors.gray} />
              <Text style={styles.imageEmptyText}>Add Photo</Text>
            </View>
          )}
        </Pressable>

        <Input label="Product Name *" placeholder="e.g. Tata Salt 1kg" value={name} onChangeText={(v) => dispatch({ type: 'set_name', value: v })} />
        <Input label="Brand" placeholder="e.g. Tata" value={brand} onChangeText={(v) => dispatch({ type: 'set_brand', value: v })} />
        <Input label="Description" placeholder="Optional description" value={description} onChangeText={(v) => dispatch({ type: 'set_description', value: v })} multiline />

        <Text style={styles.label}>Category *</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={PRODUCT_CATEGORIES}
          keyExtractor={(c) => c}
          renderItem={renderCategoryChip}
          style={styles.chipList}
          contentContainerStyle={styles.chips}
        />

        <View style={styles.row}>
          <View style={styles.half}>
            <Input label="Selling Price (₹) *" placeholder="0.00" value={price} onChangeText={(v) => dispatch({ type: 'set_price', value: v })} keyboardType="decimal-pad" />
          </View>
          <View style={styles.half}>
            <Input label="MRP (₹) *" placeholder="0.00" value={mrp} onChangeText={(v) => dispatch({ type: 'set_mrp', value: v })} keyboardType="decimal-pad" />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.half}>
            <Input label="Stock Quantity *" placeholder="0" value={stock} onChangeText={(v) => dispatch({ type: 'set_stock', value: v })} keyboardType="numeric" />
          </View>
          <View style={styles.half}>
            <Text style={styles.label}>Unit *</Text>
            <View style={styles.unitGrid}>
              {UNITS.map((u) => (
                <Pressable key={u} style={[styles.unitChip, unit === u && styles.unitChipActive]} onPress={() => dispatch({ type: 'set_unit', value: u })}>
                  <Text style={[styles.unitText, unit === u && styles.unitTextActive]}>{u}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <Button title="Add Product" onPress={handleSubmit} loading={loading} fullWidth style={styles.submitBtn} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  headerBar: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 56, backgroundColor: Colors.white, gap: 12 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: '500', color: Colors.text, marginBottom: 6 },
  imagePicker: { alignSelf: 'center', width: 140, height: 140, borderRadius: 12, overflow: 'hidden', borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed', marginBottom: 20 },
  imagePreview: { width: '100%', height: '100%' },
  imageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', gap: 6 },
  imageOverlayText: { color: Colors.white, fontSize: 12, fontWeight: '600' },
  imageEditBadge: { position: 'absolute', bottom: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  imageEditText: { fontSize: 11, color: Colors.white, fontWeight: '600' },
  imageEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  imageEmptyText: { fontSize: 13, color: Colors.textSecondary },
  chipList: { marginBottom: 16 },
  chips: { gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textSecondary },
  chipTextActive: { color: Colors.white, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  unitGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  unitChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: Colors.border },
  unitChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  unitText: { fontSize: 12, color: Colors.textSecondary },
  unitTextActive: { color: Colors.white },
  submitBtn: { marginTop: 16 },
});
