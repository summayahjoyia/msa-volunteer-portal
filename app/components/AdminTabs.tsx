'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus } from 'lucide-react'

export default function AdminTabs({
  exportSlot,
}: {
  exportSlot?: React.ReactNode
}) {
  const pathname = usePathname()
  const isVolunteers = pathname === '/admin/volunteers'
  const isEvents = pathname === '/admin'

  return (
    <div className="max-w-3xl mx-auto px-8 pt-6">
      <div className="flex items-center gap-6 border-b border-msa-green-dark/15">
        <Link
          href="/admin"
          className={`text-sm pb-2.5 ${
            isEvents
              ? 'text-msa-green-dark font-medium border-b-2 border-msa-green-dark'
              : 'text-gray-500'
          }`}
        >
          Events
        </Link>
        <Link
          href="/admin/volunteers"
          className={`text-sm pb-2.5 ${
            isVolunteers
              ? 'text-msa-green-dark font-medium border-b-2 border-msa-green-dark'
              : 'text-gray-500'
          }`}
        >
          Volunteers
        </Link>

        <div className="ml-auto flex items-center gap-4">
          {exportSlot}
          {isEvents && (
            <Link
              href="/admin/create-event"
              className="text-sm text-msa-green font-medium flex items-center gap-1.5 pb-2.5"
            >
              <Plus size={15} />
              Create event
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}