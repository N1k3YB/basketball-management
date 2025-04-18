export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/users/avatar - обновление аватара пользователя
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Проверка авторизации
    if (!session) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const formData = await request.formData();
    const avatarFile = formData.get('avatar') as File | null;
    
    if (!avatarFile) {
      return NextResponse.json(
        { error: 'Файл аватара не предоставлен' },
        { status: 400 }
      );
    }

    // Проверка типа файла (должен быть изображением)
    if (!avatarFile.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Файл должен быть изображением' },
        { status: 400 }
      );
    }

    // Ограничение размера файла (например, 5 МБ)
    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    if (avatarFile.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Размер изображения не должен превышать 5 МБ' },
        { status: 400 }
      );
    }

    // Получение содержимого файла как ArrayBuffer
    const fileBuffer = await avatarFile.arrayBuffer();
    
    console.log('Загрузка аватара:', {
      fileType: avatarFile.type,
      fileSize: avatarFile.size,
      bufferSize: fileBuffer.byteLength
    });
    
    try {
      // Преобразование в base64 для сохранения как строки (временное решение)
      const base64String = Buffer.from(fileBuffer).toString('base64');
      
      console.log('База данных: обновление аватара для пользователя', userId, {
        avatarType: avatarFile.type,
        bufferLength: fileBuffer.byteLength,
        base64Length: base64String.length
      });
      
      // @ts-ignore - игнорирование проблем с линтером
      await prisma.$executeRaw`
        UPDATE "profiles"
        SET "avatarType" = ${avatarFile.type},
            "avatar" = decode(${base64String}, 'base64')
        WHERE "userId" = ${userId}
      `;
      
      console.log('Аватар успешно обновлен в базе данных');
      
      return NextResponse.json({
        success: true,
        message: 'Аватар успешно обновлен'
      });
    } catch (error) {
      console.error('Ошибка при обновлении аватара в базе данных:', error);
      return NextResponse.json(
        { error: 'Не удалось обновить аватар пользователя' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Ошибка при обновлении аватара:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении аватара' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/avatar - удаление аватара пользователя
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Проверка авторизации
    if (!session) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    
    try {
      // @ts-ignore - игнорирование проблем с линтером
      await prisma.$executeRaw`
        UPDATE "profiles"
        SET "avatarType" = NULL,
            "avatar" = NULL
        WHERE "userId" = ${userId}
      `;
      
      return NextResponse.json({
        success: true,
        message: 'Аватар успешно удален'
      });
    } catch (error) {
      console.error('Ошибка при удалении аватара:', error);
      return NextResponse.json(
        { error: 'Не удалось удалить аватар пользователя' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Ошибка при удалении аватара:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении аватара' },
      { status: 500 }
    );
  }
} 