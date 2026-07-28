'use client'

import { downloadCSV } from '@/lib/csv'
import { Download } from 'lucide-react'

export default function ExportButton({ filename, rows, label }: { filename: string; rows: Record<string, any>[]; label: string }) {
  return (
    <button
      onClick={() => downloadCSV(filename, rows)}
      className="text-sm text-gray-500 hover:text-msa-green-dark flex items-center gap-1.5 pb-2.5"
    >
      <Download size={15} />
      {label}
    </button>
  )
}