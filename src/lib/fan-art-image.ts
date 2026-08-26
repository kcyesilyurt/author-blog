import 'server-only';

import sharp from 'sharp';
import {
  FAN_ART_DERIVATIVE_MAX_BYTES,
  FAN_ART_MAX_DIMENSION,
  FAN_ART_MAX_INPUT_PIXELS,
} from '@/lib/upload-limits';

export type SanitizedFanArt = {
  data: Buffer;
  width: number;
  height: number;
  size: number;
};

export async function sanitizeFanArtImage(source: Blob): Promise<SanitizedFanArt> {
  try {
    const input = Buffer.from(await source.arrayBuffer());
    const { data, info } = await sharp(input, {
      animated: false,
      failOn: 'error',
      limitInputPixels: FAN_ART_MAX_INPUT_PIXELS,
    })
      .rotate()
      .resize({
        width: FAN_ART_MAX_DIMENSION,
        height: FAN_ART_MAX_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .toColourspace('srgb')
      .webp({ quality: 85, effort: 4 })
      .toBuffer({ resolveWithObject: true });

    if (!info.width || !info.height || data.byteLength > FAN_ART_DERIVATIVE_MAX_BYTES) {
      throw new Error('Fan art görseli güvenli boyuta dönüştürülemedi');
    }

    return {
      data,
      width: info.width,
      height: info.height,
      size: data.byteLength,
    };
  } catch (error) {
    if (error instanceof Error && error.message === 'Fan art görseli güvenli boyuta dönüştürülemedi') {
      throw error;
    }
    throw new Error('Yüklenen fan art görseli okunamadı veya güvenli biçime dönüştürülemedi');
  }
}
