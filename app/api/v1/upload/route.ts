import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { getApiUser } from '@/lib/api-helpers'

const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

// SVG excluded — can contain embedded <script> tags (XSS via stored content)
const ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
  'image/gif':  'gif',
}

// Magic-byte signatures for supported types
const MAGIC: Array<{ mime: string; bytes: number[]; offset?: number }> = [
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png',  bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 }, // RIFF header
  { mime: 'image/gif',  bytes: [0x47, 0x49, 0x46, 0x38] },
]

function detectMimeFromBuffer(buf: Buffer): string | null {
  for (const sig of MAGIC) {
    const off = sig.offset ?? 0
    if (sig.bytes.every((b, i) => buf[off + i] === b)) return sig.mime
  }
  return null
}

export async function POST(req: NextRequest) {
  const user = await getApiUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (file.size > MAX_SIZE) return NextResponse.json({ error: 'File too large (max 5 MB)' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())

    // Validate actual file content via magic bytes, not client-supplied MIME
    const detectedMime = detectMimeFromBuffer(buffer)
    if (!detectedMime || !ALLOWED_MIME[detectedMime]) {
      return NextResponse.json({ error: 'Invalid image file. Allowed: JPEG, PNG, WebP, GIF' }, { status: 400 })
    }

    const ext = ALLOWED_MIME[detectedMime]
    const filename = `${randomUUID()}.${ext}`
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })
    await writeFile(join(uploadDir, filename), buffer)

    return NextResponse.json({ url: `/uploads/${filename}` })
  } catch (err) {
    console.error('[upload]', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
