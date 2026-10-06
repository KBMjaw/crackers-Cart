import { supabase } from './supabase'

// Compress an image in the browser (max 1200px, WebP ~80%) before uploading to Supabase Storage.
export async function compressImage(file, maxSize = 1200, quality = 0.8) {
  const bitmap = await createImageBitmap(file).catch(() => null)
  let img = bitmap
  if (!img) {
    img = await new Promise((res, rej) => {
      const i = new Image()
      i.onload = () => res(i)
      i.onerror = rej
      i.src = URL.createObjectURL(file)
    })
  }
  const w = img.width, h = img.height
  const scale = Math.min(1, maxSize / Math.max(w, h))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(w * scale)
  canvas.height = Math.round(h * scale)
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise((res) => canvas.toBlob(res, 'image/webp', quality))
  if (blob) return { blob, ext: 'webp', type: 'image/webp' }
  const jpg = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', quality))
  return { blob: jpg, ext: 'jpg', type: 'image/jpeg' }
}

export async function uploadImage(file, folder = 'products') {
  const { blob, ext, type } = await compressImage(file)
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage.from('images').upload(path, blob, { contentType: type, upsert: false })
  if (error) throw error
  return supabase.storage.from('images').getPublicUrl(path).data.publicUrl
}
