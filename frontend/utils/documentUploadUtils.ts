import * as DocumentPicker from 'expo-document-picker';
import { uriToUploadBlob } from './imageUploadUtils';
import apiClient from '@/api/client';

export interface PickedDocument {
  uri: string;
  name: string;
  mimeType: string;
}

export async function pickPdfDocument(): Promise<PickedDocument | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/pdf',
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets?.length) {
    return null;
  }

  const asset = result.assets[0];
  const name = asset.name || `document_${Date.now()}.pdf`;
  const mimeType = asset.mimeType || 'application/pdf';

  if (!name.toLowerCase().endsWith('.pdf') && mimeType !== 'application/pdf') {
    throw new Error('Please select a PDF document');
  }

  return {
    uri: asset.uri,
    name: name.toLowerCase().endsWith('.pdf') ? name : `${name}.pdf`,
    mimeType: 'application/pdf',
  };
}

export async function uploadPdfToR2(
  doc: PickedDocument,
  role: 'Merchant' | 'Delivery',
): Promise<string> {
  const uploadResponse = await apiClient.post('/api/v1/upload/url', {
    fileType: 'application/pdf',
    fileName: doc.name,
    role,
    isPermanent: true,
  });

  if (
    !uploadResponse.data.success ||
    !uploadResponse.data.uploadUrl ||
    !uploadResponse.data.publicUrl
  ) {
    throw new Error(uploadResponse.data.message || 'Failed to get upload URL');
  }

  const blob = await uriToUploadBlob(doc.uri, 'application/pdf');
  const uploadResult = await fetch(uploadResponse.data.uploadUrl, {
    method: 'PUT',
    body: blob,
    headers: { 'Content-Type': 'application/pdf' },
  });

  if (!uploadResult.ok) {
    throw new Error('Failed to upload document to storage');
  }

  return uploadResponse.data.publicUrl;
}
