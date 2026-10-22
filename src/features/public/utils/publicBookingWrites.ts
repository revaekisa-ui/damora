import type { Dispatch, SetStateAction } from 'react';
import { Transaction } from '../../../types';

/**
 * Sisipkan/perbarui satu transaksi di cache lokal tanpa membuat duplikat.
 * Realtime dapat mengirim baris yang sama lebih dulu, jadi insert murni
 * (`[tx, ...prev]`) akan menampilkan DP dua kali di halaman Booking.
 */
export function mergeTransaction(
  setTransactions: Dispatch<SetStateAction<Transaction[]>>,
  tx: Transaction,
): void {
  setTransactions(prev => {
    const exists = prev.some(t => t.id === tx.id);
    const list = exists ? prev.map(t => (t.id === tx.id ? tx : t)) : [tx, ...prev];
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });
}

/**
 * Perbarui lead hasil konversi tanpa menambah salinan kedua bila Realtime
 * sudah menyisipkan baris yang sama.
 */
export function mergeById<T extends { id: string }>(
  setter: Dispatch<SetStateAction<T[]>>,
  item: T,
): void {
  setter(prev => (
    prev.some(existing => existing.id === item.id)
      ? prev.map(existing => (existing.id === item.id ? { ...existing, ...item } : existing))
      : [item, ...prev]
  ));
}
