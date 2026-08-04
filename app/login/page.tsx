import GoogleSignInButton from '../components/GoogleSignInButton'

export default function Login() {
  return (
    <main className="p-8 max-w-sm mx-auto">
      <div className="mb-6 text-center">
        <p className="text-msa-gold text-sm tracking-wide mb-1">بِسْمِ اللَّهِ</p>
        <h1 className="text-xl font-bold text-msa-green-dark">Admin Login</h1>
      </div>

      <GoogleSignInButton redirectPath="/admin" />
    </main>
  )
}