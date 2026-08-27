import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const response = NextResponse.redirect(`${origin}${next}`)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
          },
        },
      }
    )

    const { data: sessionData } = await supabase.auth.exchangeCodeForSession(code)
    const user = sessionData?.user

    if (user?.email) {
      const googleName = user.user_metadata?.full_name || user.user_metadata?.name || ''

      const { data: existingVolunteer } = await supabase
        .from('volunteers')
        .select('id, role, auth_id, name')
        .eq('email', user.email)
        .single()

      const isUalberta = user.email.toLowerCase().endsWith('@ualberta.ca')

      if (existingVolunteer) {
        const updates: Record<string, any> = {}
        if (!existingVolunteer.auth_id) updates.auth_id = user.id
        // Backfill a missing name (e.g. manually added exception rows)
        // using whatever Google actually returned on this login.
        if (!existingVolunteer.name && googleName) updates.name = googleName

        if (Object.keys(updates).length > 0) {
          await supabase.from('volunteers').update(updates).eq('id', existingVolunteer.id)
        }

        if (existingVolunteer.role === 'admin') {
          response.headers.set('location', `${origin}/admin`)
        }
      } else if (isUalberta) {
        await supabase.from('volunteers').insert({
          email: user.email,
          name: googleName,
          auth_id: user.id,
          role: null,
        })
        } else {
        await supabase.auth.signOut()
        response.headers.set('location', `${origin}/`)
      }
    }

    return response
  }

  return NextResponse.redirect(`${origin}/login`)
}