import { Buffer } from 'buffer'

const BUNNY_STORAGE_URL = process.env.BUNNY_STORAGE_URL!
const BUNNY_CDN_URL = process.env.BUNNY_CDN_URL!
const BUNNY_ACCESS_KEY = process.env.BUNNY_ACCESS_KEY!
const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE!

export async function uploadToBunnyCDN(
  fileBuffer: Buffer,
  filePath: string,
  contentType: string
): Promise<string> {
  try {
    const url = `${BUNNY_STORAGE_URL}/${BUNNY_STORAGE_ZONE}/${filePath}`
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'AccessKey': BUNNY_ACCESS_KEY,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
      },
      body: new Uint8Array(fileBuffer),
    })

    if (!response.ok) {
      throw new Error(`Bunny CDN upload failed: ${response.statusText}`)
    }

    // Return the CDN URL
    return `${BUNNY_CDN_URL}/${BUNNY_STORAGE_ZONE}/${filePath}`
  } catch (error) {
    console.error('Bunny CDN upload error:', error)
    throw new Error('Failed to upload file to Bunny CDN')
  }
}

export async function deleteFromBunnyCDN(filePath: string): Promise<boolean> {
  try {
    const url = `${BUNNY_STORAGE_URL}/${BUNNY_STORAGE_ZONE}/${filePath}`
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'AccessKey': BUNNY_ACCESS_KEY,
      },
    })

    return response.ok
  } catch (error) {
    console.error('Bunny CDN delete error:', error)
    return false
  }
}

export function generateBunnyCDNUrl(filePath: string): string {
  return `${BUNNY_CDN_URL}/${BUNNY_STORAGE_ZONE}/${filePath}`
}

export function generateSignedUrl(
  filePath: string,
  expiresIn: number = 3600 // 1 hour default
): string {
  const timestamp = Math.floor(Date.now() / 1000) + expiresIn
  const token = generateToken(filePath, timestamp)
  
  return `${BUNNY_CDN_URL}/${BUNNY_STORAGE_ZONE}/${filePath}?token=${token}&expires=${timestamp}`
}

function generateToken(path: string, expires: number): string {
  // This is a simplified token generation
  // In production, you should use proper HMAC signing
  const data = `${path}${expires}`
  return Buffer.from(data).toString('base64')
}

export async function uploadRecording(
  recordingBuffer: Buffer,
  callId: string,
  timestamp: number
): Promise<string> {
  const fileName = `recording-${callId}-${timestamp}.mp4`
  const filePath = `recordings/${fileName}`
  
  return uploadToBunnyCDN(recordingBuffer, filePath, 'video/mp4')
}

export async function uploadTranscription(
  transcriptionBuffer: Buffer,
  callId: string,
  timestamp: number
): Promise<string> {
  const fileName = `transcription-${callId}-${timestamp}.json`
  const filePath = `transcriptions/${fileName}`
  
  return uploadToBunnyCDN(transcriptionBuffer, filePath, 'application/json')
}

export async function uploadUserAvatar(
  avatarBuffer: Buffer,
  userId: string,
  fileExtension: string
): Promise<string> {
  const fileName = `avatar-${userId}-${Date.now()}.${fileExtension}`
  const filePath = `avatars/${fileName}`
  
  return uploadToBunnyCDN(avatarBuffer, filePath, 'image/jpeg')
}

export async function uploadCompanyLogo(
  logoBuffer: Buffer,
  companyId: string,
  fileExtension: string
): Promise<string> {
  const fileName = `logo-${companyId}-${Date.now()}.${fileExtension}`
  const filePath = `logos/${fileName}`
  
  return uploadToBunnyCDN(logoBuffer, filePath, 'image/png')
}

export async function uploadMeetingAttachment(
  fileBuffer: Buffer,
  meetingId: string,
  fileName: string,
  contentType: string
): Promise<string> {
  const timestamp = Date.now()
  const fileExtension = fileName.split('.').pop()
  const newFileName = `attachment-${meetingId}-${timestamp}.${fileExtension}`
  const filePath = `attachments/${meetingId}/${newFileName}`
  
  return uploadToBunnyCDN(fileBuffer, filePath, contentType)
}

// Utility function to check if a file exists
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    const url = `${BUNNY_STORAGE_URL}/${BUNNY_STORAGE_ZONE}/${filePath}`
    
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'AccessKey': BUNNY_ACCESS_KEY,
      },
    })

    return response.ok
  } catch (error) {
    return false
  }
}

// Utility function to get file metadata
export async function getFileMetadata(filePath: string) {
  try {
    const url = `${BUNNY_STORAGE_URL}/${BUNNY_STORAGE_ZONE}/${filePath}`
    
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'AccessKey': BUNNY_ACCESS_KEY,
      },
    })

    if (!response.ok) {
      throw new Error('File not found')
    }

    return {
      size: response.headers.get('content-length'),
      contentType: response.headers.get('content-type'),
      lastModified: response.headers.get('last-modified'),
    }
  } catch (error) {
    console.error('Error getting file metadata:', error)
    return null
  }
} 