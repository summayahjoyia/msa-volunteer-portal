import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function AdminNav() {
  return (
    <div className="max-w-3xl mx-auto px-8 pt-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-msa-green-dark transition"
      >
        <ChevronLeft size={16} />
        Dashboard
      </Link>
    </div>
  )
}