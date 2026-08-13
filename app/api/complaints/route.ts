import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const MAX_SUBMISSIONS_PER_EMAIL = 5

export async function POST(request: Request) {
  const { title, body, name, email } = await request.json()

  if (!title || !body || !email) {
    return NextResponse.json(
      { success: false, error: 'Missing title, body, or email' },
      { status: 400 }
    )
  }

  const normalizedEmail = email.trim().toLowerCase()

  const { count, error: countError } = await supabase
    .from('complaint_log')
    .select('id', { count: 'exact', head: true })
    .eq('email', normalizedEmail)

  if (countError) {
    return NextResponse.json({ success: false, error: 'Something went wrong.' }, { status: 500 })
  }

  if ((count || 0) >= MAX_SUBMISSIONS_PER_EMAIL) {
    return NextResponse.json(
      { success: false, error: 'LIMIT_REACHED' },
      { status: 429 }
    )
  }

  const owner = process.env.GITHUB_REPO_OWNER
  const repo = process.env.GITHUB_REPO_NAME
  const token = process.env.GITHUB_TOKEN

  const issueBody = [
    '## Description',
    body,
    '',
    '---',
    `**Submitted by:** ${name ? name : 'Anonymous'}`,
    `**Contact:** ${normalizedEmail}`,
  ].join('\n')

  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: `[Portal Feedback] ${title}`,
        body: issueBody,
        labels: ['portal-feedback'],
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('GitHub issue creation failed:', errText)
      return NextResponse.json({ success: false, error: errText }, { status: 500 })
    }

    const data = await res.json()

    await supabase.from('complaint_log').insert({ email: normalizedEmail })

    return NextResponse.json({ success: true, issueUrl: data.html_url })
  } catch (error) {
    console.error('GitHub issue creation error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}