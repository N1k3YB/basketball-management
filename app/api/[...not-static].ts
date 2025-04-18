// Этот файл используется для блокировки статической генерации всех API маршрутов
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({ message: 'Dynamic API route' });
}

export function POST() {
  return NextResponse.json({ message: 'Dynamic API route' });
}

export function PUT() {
  return NextResponse.json({ message: 'Dynamic API route' });
}

export function DELETE() {
  return NextResponse.json({ message: 'Dynamic API route' });
}

export function PATCH() {
  return NextResponse.json({ message: 'Dynamic API route' });
} 