import { useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  PERSONAL_PHOTO_CAPTION_MAX_LENGTH,
  PERSONAL_PHOTO_CREDIT_MAX_LENGTH,
  type PersonalRoutePhoto,
} from './personal-route-gallery';
import { personalRoutePhotoPickerOptions } from './personal-route-photo-picker-options';
import { personalRouteGalleryStore } from './expo-personal-route-gallery-store';
import { colors, radius, spacing } from '../../theme/tokens';

interface PersonalRouteGalleryProps {
  routeSlug: string;
}

export function PersonalRouteGallery({ routeSlug }: PersonalRouteGalleryProps) {
  const [photos, setPhotos] = useState<PersonalRoutePhoto[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [caption, setCaption] = useState('');
  const [credit, setCredit] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [isChoosing, setIsChoosing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadFailed(false);
    setPhotos([]);

    void personalRouteGalleryStore.listForRoute(routeSlug)
      .then((storedPhotos) => {
        if (active) setPhotos(storedPhotos);
      })
      .catch(() => {
        if (active) setLoadFailed(true);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [routeSlug, loadAttempt]);

  const closeDraft = () => {
    if (isSaving) return;
    setSelectedAsset(null);
    setCaption('');
    setCredit('');
  };

  const choosePhoto = async () => {
    if (isChoosing || isSaving || isLoading || loadFailed) return;
    setIsChoosing(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync(personalRoutePhotoPickerOptions);
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset) return;
      setCaption('');
      setCredit('');
      setSelectedAsset(asset);
    } catch {
      Alert.alert('No se pudo abrir el selector', 'No se ha guardado ninguna imagen. Inténtalo de nuevo.');
    } finally {
      setIsChoosing(false);
    }
  };

  const savePhoto = async () => {
    if (!selectedAsset || isSaving) return;
    if (!caption.trim() || !credit.trim()) {
      Alert.alert('Completa los datos', 'Añade un pie de foto y el crédito o autor antes de guardar.');
      return;
    }

    setIsSaving(true);
    try {
      const saved = await personalRouteGalleryStore.save({
        routeSlug,
        sourceUri: selectedAsset.uri,
        mimeType: selectedAsset.mimeType ?? null,
        caption,
        credit,
      });
      setPhotos((current) => [saved, ...current].sort((left, right) =>
        right.createdAt.localeCompare(left.createdAt) || right.id.localeCompare(left.id),
      ));
      setSelectedAsset(null);
      setCaption('');
      setCredit('');
    } catch {
      Alert.alert(
        'No se pudo guardar la foto',
        'No se ha añadido a la galería. Comprueba el espacio disponible e inténtalo de nuevo.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const isBusy = isChoosing || isSaving;
  const canSave = caption.trim().length > 0 && credit.trim().length > 0 && !isSaving;

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.statusPanel}>
          <ActivityIndicator color={colors.olive700} />
          <Text style={styles.statusText}>Abriendo tu galería local…</Text>
        </View>
      ) : loadFailed ? (
        <View style={styles.statusPanel}>
          <Text style={styles.statusText}>No se pudo leer la galería local en este dispositivo.</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver a intentar abrir la galería local"
            style={styles.retryButton}
            onPress={() => setLoadAttempt((attempt) => attempt + 1)}
          >
            <Text style={styles.retryButtonText}>Volver a intentar</Text>
          </Pressable>
        </View>
      ) : photos.length === 0 ? (
        <View style={styles.emptyPanel}>
          <View style={styles.galleryIconWrap}>
            <Text accessible={false} style={styles.galleryIcon}>▧</Text>
          </View>
          <Text style={styles.emptyTitle}>Tu galería personal está vacía</Text>
          <Text style={styles.emptyBody}>Elige una foto del dispositivo y añade su pie y autor.</Text>
        </View>
      ) : (
        <View style={styles.photoList}>
          {photos.map((photo) => (
            <View key={photo.id} style={styles.photoCard}>
              <Image
                accessible
                accessibilityLabel={`Foto personal: ${photo.caption}. Crédito: ${photo.credit}. Guardada solo en este dispositivo.`}
                source={{ uri: photo.uri }}
                resizeMode="cover"
                style={styles.photoImage}
              />
              <Text style={styles.photoCaption}>{photo.caption}</Text>
              <Text style={styles.photoCredit}>Crédito · {photo.credit}</Text>
              <Text style={styles.localTag}>PERSONAL · LOCAL</Text>
            </View>
          ))}
        </View>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Elegir una foto propia del dispositivo"
        accessibilityHint="Abre el selector de fotos del sistema; no publica ni sincroniza la imagen."
        accessibilityState={{ disabled: isBusy || isLoading || loadFailed }}
        disabled={isBusy || isLoading || loadFailed}
        style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed, (isBusy || isLoading || loadFailed) && styles.buttonDisabled]}
        onPress={() => void choosePhoto()}
      >
        {isChoosing ? <ActivityIndicator color={colors.white} /> : <Text style={styles.addButtonText}>Añadir foto propia</Text>}
      </Pressable>

      <Modal
        visible={selectedAsset !== null}
        transparent
        animationType="slide"
        onRequestClose={closeDraft}
      >
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalKeyboard}
          >
            <View style={styles.modalCard}>
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <Text style={styles.modalTitle}>Añadir a tu galería personal</Text>
                <Text style={styles.modalNote}>La copia solo se guarda en este dispositivo; no se publica ni se sincroniza.</Text>
                {selectedAsset ? (
                  <Image
                    accessible
                    accessibilityLabel="Vista previa de la foto propia seleccionada"
                    source={{ uri: selectedAsset.uri }}
                    resizeMode="cover"
                    style={styles.previewImage}
                  />
                ) : null}
                <Text style={styles.inputLabel}>Pie de foto</Text>
                <TextInput
                  accessibilityLabel="Pie de foto"
                  autoCapitalize="sentences"
                  maxLength={PERSONAL_PHOTO_CAPTION_MAX_LENGTH}
                  multiline
                  placeholder="Describe brevemente tu foto"
                  placeholderTextColor={colors.muted}
                  returnKeyType="default"
                  style={[styles.textInput, styles.captionInput]}
                  value={caption}
                  onChangeText={setCaption}
                />
                <Text style={styles.inputLabel}>Crédito o autor</Text>
                <TextInput
                  accessibilityLabel="Crédito o autor"
                  autoCapitalize="words"
                  maxLength={PERSONAL_PHOTO_CREDIT_MAX_LENGTH}
                  placeholder="Tu nombre o el de quien tomó la foto"
                  placeholderTextColor={colors.muted}
                  returnKeyType="done"
                  style={styles.textInput}
                  value={credit}
                  onChangeText={setCredit}
                />
                <View style={styles.modalActions}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Cancelar y descartar esta selección"
                    disabled={isSaving}
                    style={styles.cancelButton}
                    onPress={closeDraft}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Guardar la foto solo en este dispositivo"
                    accessibilityState={{ disabled: !canSave }}
                    disabled={!canSave}
                    style={({ pressed }) => [styles.saveButton, pressed && styles.addButtonPressed, !canSave && styles.buttonDisabled]}
                    onPress={() => void savePhoto()}
                  >
                    {isSaving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.addButtonText}>Guardar aquí</Text>}
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginHorizontal: spacing[20], marginTop: spacing[12] },
  statusPanel: { minHeight: 112, alignItems: 'center', justifyContent: 'center', gap: spacing[8], marginTop: spacing[12], borderRadius: radius.lg, backgroundColor: colors.white, padding: spacing[16] },
  statusText: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  retryButton: { marginTop: spacing[4], paddingHorizontal: spacing[16], paddingVertical: spacing[8], borderRadius: radius.md, borderWidth: 1, borderColor: colors.olive900 },
  retryButtonText: { color: colors.olive900, fontSize: 12, fontWeight: '800' },
  emptyPanel: { minHeight: 184, alignItems: 'center', justifyContent: 'center', marginTop: spacing[12], borderRadius: radius.lg, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.olive700, backgroundColor: colors.white, padding: spacing[20] },
  galleryIconWrap: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.limestone, alignItems: 'center', justifyContent: 'center' },
  galleryIcon: { color: colors.olive700, fontSize: 21, fontWeight: '900' },
  emptyTitle: { color: colors.olive900, fontSize: 13, fontWeight: '900', textAlign: 'center', marginTop: spacing[12] },
  emptyBody: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: spacing[8] },
  photoList: { gap: spacing[12], marginTop: spacing[12] },
  photoCard: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, padding: spacing[12] },
  photoImage: { width: '100%', height: 196, borderRadius: radius.md, backgroundColor: colors.limestone },
  photoCaption: { color: colors.ink, fontSize: 14, lineHeight: 20, fontWeight: '900', marginTop: spacing[12] },
  photoCredit: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: spacing[4] },
  localTag: { alignSelf: 'flex-start', color: colors.olive900, fontSize: 9, fontWeight: '900', letterSpacing: 0.7, marginTop: spacing[8] },
  addButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: spacing[12], borderRadius: radius.md, backgroundColor: colors.olive900, paddingHorizontal: spacing[16], paddingVertical: spacing[12] },
  addButtonPressed: { opacity: 0.82 },
  buttonDisabled: { opacity: 0.48 },
  addButtonText: { color: colors.white, fontSize: 13, fontWeight: '900', textAlign: 'center' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(18, 28, 19, 0.55)' },
  modalKeyboard: { maxHeight: '94%' },
  modalCard: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, backgroundColor: colors.warmBackground, padding: spacing[20], paddingBottom: spacing[32] },
  modalTitle: { color: colors.ink, fontSize: 18, lineHeight: 24, fontWeight: '900' },
  modalNote: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: spacing[8] },
  previewImage: { width: '100%', height: 180, borderRadius: radius.md, backgroundColor: colors.limestone, marginTop: spacing[16] },
  inputLabel: { color: colors.olive900, fontSize: 12, fontWeight: '900', marginTop: spacing[16] },
  textInput: { minHeight: 48, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, color: colors.ink, fontSize: 14, paddingHorizontal: spacing[12], paddingVertical: spacing[12], marginTop: spacing[8] },
  captionInput: { minHeight: 76, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: spacing[8], marginTop: spacing[20] },
  cancelButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing[16], borderRadius: radius.md, borderWidth: 1, borderColor: colors.olive900 },
  cancelButtonText: { color: colors.olive900, fontSize: 12, fontWeight: '900' },
  saveButton: { minHeight: 44, minWidth: 128, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.olive900, paddingHorizontal: spacing[16], paddingVertical: spacing[8] },
});
