import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Image, ActivityIndicator } from 'react-native';
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

export default function AddProductScreen() {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(PRODUCT_CATEGORIES[0]);
  const [price, setPrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [unit, setUnit] = useState(UNITS[0]);
  const [stock, setStock] = useState('');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [loading, setLoading] = useState(false);

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
    setImageUri(uri);
    setImageUploading(true);
    try {
      const url = await uploadService.uploadImage(uri);
      setImageUrl(url);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to upload image' });
      setImageUri(null);
      setImageUrl(null);
    } finally {
      setImageUploading(false);
    }
  }

  async function handleSubmit() {
    if (!name || !price || !mrp || !stock) {
      Toast.show({ type: 'error', text1: 'Fill in all required fields' });
      return;
    }
    setLoading(true);
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
        image_url: imageUrl || undefined,
      });
      Toast.show({ type: 'success', text1: 'Product added!' });
      router.back();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.response?.data?.detail ?? 'Failed to add product' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Product</Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Product Image */}
        <Text style={styles.label}>Product Image</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage} disabled={imageUploading} activeOpacity={0.8}>
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
        </TouchableOpacity>

        <Input label="Product Name *" placeholder="e.g. Tata Salt 1kg" value={name} onChangeText={setName} />
        <Input label="Brand" placeholder="e.g. Tata" value={brand} onChangeText={setBrand} />
        <Input label="Description" placeholder="Optional description" value={description} onChangeText={setDescription} multiline />

        <Text style={styles.label}>Category *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipList} contentContainerStyle={styles.chips}>
          {PRODUCT_CATEGORIES.map((c) => (
            <TouchableOpacity key={c} style={[styles.chip, category === c && styles.chipActive]} onPress={() => setCategory(c)}>
              <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.row}>
          <View style={styles.half}>
            <Input label="Selling Price (₹) *" placeholder="0.00" value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
          </View>
          <View style={styles.half}>
            <Input label="MRP (₹) *" placeholder="0.00" value={mrp} onChangeText={setMrp} keyboardType="decimal-pad" />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.half}>
            <Input label="Stock Quantity *" placeholder="0" value={stock} onChangeText={setStock} keyboardType="numeric" />
          </View>
          <View style={styles.half}>
            <Text style={styles.label}>Unit *</Text>
            <View style={styles.unitGrid}>
              {UNITS.map((u) => (
                <TouchableOpacity key={u} style={[styles.unitChip, unit === u && styles.unitChipActive]} onPress={() => setUnit(u)}>
                  <Text style={[styles.unitText, unit === u && styles.unitTextActive]}>{u}</Text>
                </TouchableOpacity>
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
