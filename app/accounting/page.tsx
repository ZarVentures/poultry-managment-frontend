import { redirect } from 'next/navigation'

export default function AccountingPage() {
  // Redirect to the static Vite build index.html placed under public/accounting/
  redirect('/accounting/index.html')
}
