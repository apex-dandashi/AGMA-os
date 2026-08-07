/** قراءة صورة ختم/توقيع كـ data URI — بحد ٥٠٠KB ليصلح تضمينها في لقطة العقد. */
export const MAX_SIGNATURE_KB = 500;

export function readImageAsDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('اختر ملف صورة (PNG بخلفية شفافة هو الأفضل)'));
      return;
    }
    if (file.size > MAX_SIGNATURE_KB * 1024) {
      reject(new Error(`حجم الصورة يتجاوز ${MAX_SIGNATURE_KB} كيلوبايت — صغّرها أولاً`));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('تعذرت قراءة الملف'));
    reader.readAsDataURL(file);
  });
}
