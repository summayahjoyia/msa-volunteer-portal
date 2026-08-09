'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Plus, LogOut, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'

export default function AdminTabs({
  exportSlot,
}: {
  exportSlot?: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const isVolunteers = pathname === '/admin/volunteers'
  const isEvents = pathname === '/admin'

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 pt-6 min-w-0">
      <div className="flex items-center gap-5 sm:gap-6 border-b border-msa-green-dark/15 overflow-x-auto whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Link
          href="/admin"
          className={`text-sm pb-2.5 shrink-0 ${
            isEvents
              ? 'text-msa-green-dark font-medium border-b-2 border-msa-green-dark'
              : 'text-gray-500'
          }`}
        >
          Events
        </Link>
        <Link
          href="/admin/volunteers"
          className={`text-sm pb-2.5 shrink-0 ${
            isVolunteers
              ? 'text-msa-green-dark font-medium border-b-2 border-msa-green-dark'
              : 'text-gray-500'
          }`}
        >
          Volunteers
        </Link>

        {exportSlot}

        {isEvents && (
          <Link
            href="/admin/create-event"
            className="text-sm text-msa-green font-medium flex items-center gap-1.5 pb-2.5 shrink-0"
          >
            <Plus size={15} />
            Create event
          </Link>
        )}

        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-msa-green transition flex items-center gap-1.5 pb-2.5 shrink-0"
        >
          <ExternalLink size={14} />
          Sign up as volunteer
        </Link>

        <button
          onClick={handleSignOut}
          className="text-sm text-gray-400 hover:text-red-600 transition flex items-center gap-1.5 pb-2.5 shrink-0 ml-auto"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </div>
  )
}