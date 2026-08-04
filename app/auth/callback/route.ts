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
      const { data: existingVolunteer } = await supabase
        .from('volunteers')
        .select('id, role, auth_id')
        .eq('email', user.email)
        .single()

      const isUalberta = user.email.toLowerCase().endsWith('@ualberta.ca')

      if (existingVolunteer) {
        // Already known to us (either signed up before, or an exec manually
        // added them as an exception) — allow regardless of domain.
        if (!existingVolunteer.auth_id) {
          await supabase
            .from('volunteers')
            .update({ auth_id: user.id })
            .eq('id', existingVolunteer.id)
        }
        if (existingVolunteer.role === 'admin') {
          response.headers.set('location', `${origin}/admin`)
        }
      } else if (isUalberta) {
        // First-time sign-in with a valid UAlberta email — create their row.
        await supabase.from('volunteers').insert({
          email: user.email,
          name: user.user_metadata?.full_name || user.user_metadata?.name || '',
          auth_id: user.id,
          role: null,
        })
      } else {
        // First-time sign-in, not UAlberta, and not manually pre-added —
        // reject: sign them back out and send to an error page.
        await supabase.auth.signOut()
        response.headers.set(
          'location',
          `${origin}/login?error=domain`
        )
      }
    }

    return response
  }

  return NextResponse.redirect(`${origin}/login`)
}