import Link from 'next/link'

export default function AdminNav() {
  return (
    <div className="max-w-3xl mx-auto px-8 pt-6">
      <Link
        href="/admin"
        className="text-sm text-msa-green hover:text-msa-green-dark underline underline-offset-4"
      >
        ← Back to Dashboard
      </Link>
    </div>
  )
}