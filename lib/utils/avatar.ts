import { encode, decode } from '@msgpack/msgpack';

export interface AvatarData {
  data: Buffer | Uint8Array;
  type: string;
}

/**
 * Преобразует base64 строку в объект AvatarData
 */
export function encodeAvatar(base64String: string): AvatarData {
  if (!base64String) {
    throw new Error('Base64 string is required');
  }

  // Удаление префикса data:image/...;base64,
  const base64Data = base64String.split(',')[1];
  if (!base64Data) {
    throw new Error('Invalid base64 string format');
  }

  const binaryData = atob(base64Data);
  const bytes = new Uint8Array(binaryData.length);
  for (let i = 0; i < binaryData.length; i++) {
    bytes[i] = binaryData.charCodeAt(i);
  }
  
  // Определение типа изображения
  const type = base64String.split(',')[0].split(':')[1].split(';')[0];
  if (!type) {
    throw new Error('Could not determine image type');
  }
  
  return {
    data: Buffer.from(bytes),
    type
  };
}

/**
 * Преобразует бинарные данные аватара в base64 URL для отображения на клиенте
 */
export function binaryToImageUrl(data: any, mimeType: string): string | null {
  if (!data || !mimeType) {
    return null;
  }

  try {
    let arrayData: number[];

    // Дополнительные проверки и логика для обработки различных форматов данных
    if (Array.isArray(data)) {
      // Прямое использование массива
      arrayData = data;
      console.log('Данные в виде массива, длина:', data.length);
    } else if (data instanceof Uint8Array) {
      // Преобразование Uint8Array в обычный массив
      arrayData = Array.from(data);
      console.log('Данные в виде Uint8Array, длина:', data.length);
    } else if (data instanceof Buffer) {
      // Преобразование Buffer в обычный массив
      arrayData = Array.from(data);
      console.log('Данные в виде Buffer, длина:', data.length);
    } else if (data && typeof data === 'object' && 'type' in data && 'data' in data) {
      // Обработка объекта с полями type и data (например, AvatarData)
      console.log('Данные в виде объекта AvatarData');
      return binaryToImageUrl(data.data, data.type);
    } else if (data && typeof data === 'object') {
      // Обработка как объекта с числовыми индексами
      console.log('Данные в виде неизвестного объекта, пытаемся преобразовать');
      
      // Специальная обработка для Prisma Bytes type
      if ('constructor' in data && data.constructor && data.constructor.name === 'PrismaBytes') {
        console.log('Обнаружен тип PrismaBytes');
        // Преобразование PrismaBytes в массив вручную
        const tempArr: number[] = [];
        for (let i = 0; i < data.length; i++) {
          tempArr.push(data[i]);
        }
        arrayData = tempArr;
      }
      // Проверка возможности преобразования объекта в массив
      else if (Object.keys(data).every(key => !isNaN(Number(key)))) {
        arrayData = Object.keys(data).map(key => data[key]);
        console.log('Преобразовали объект в массив, длина:', arrayData.length);
      } else {
        // Последняя попытка - возможно это итерируемый объект
        console.log('Пытаемся преобразовать как итерируемый объект');
        try {
          arrayData = [...data];
          console.log('Успешно преобразовали как итерируемый объект, длина:', arrayData.length);
        } catch (e) {
          console.error('Неизвестный формат данных, не итерируемый:', typeof data);
          console.error('Object keys:', Object.keys(data).slice(0, 10));
          console.error('Constructor name:', data.constructor ? data.constructor.name : 'unknown');
          return null;
        }
      }
    } else {
      console.error('Необрабатываемый тип данных:', typeof data);
      return null;
    }

    // Теперь у нас должен быть массив чисел
    const uint8Array = new Uint8Array(arrayData);
    const base64 = Buffer.from(uint8Array).toString('base64');
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('Error converting binary to image URL:', error);
    console.error('Data type:', typeof data);
    console.error('Is array:', Array.isArray(data));
    console.error('Is Uint8Array:', data instanceof Uint8Array);
    console.error('Is Buffer:', data instanceof Buffer);
    if (data && typeof data === 'object') {
      console.error('Object keys:', Object.keys(data).slice(0, 10));
      console.error('Constructor name:', data.constructor ? data.constructor.name : 'unknown');
      if ('length' in data) {
        console.error('Object has length:', data.length);
      }
    }
    console.error('MIME type:', mimeType);
    return null;
  }
}

/**
 * Преобразует объект AvatarData в base64 URL для отображения на клиенте
 */
export function decodeAvatar(avatarData: AvatarData | null | undefined): string | null {
  if (!avatarData) {
    console.log('decodeAvatar: avatarData is null or undefined');
    return null;
  }
  
  if (!avatarData.data) {
    console.log('decodeAvatar: avatarData.data is null or undefined');
    return null;
  }
  
  if (!avatarData.type) {
    console.log('decodeAvatar: avatarData.type is null or undefined');
    return null;
  }

  try {
    // Использование улучшенной функции binaryToImageUrl
    return binaryToImageUrl(avatarData.data, avatarData.type);
  } catch (error) {
    console.error('Error decoding avatar:', error);
    console.error('Avatar data:', {
      dataType: typeof avatarData.data,
      isArray: Array.isArray(avatarData.data),
      isBuffer: avatarData.data instanceof Buffer,
      mimeType: avatarData.type
    });
    return null;
  }
} 