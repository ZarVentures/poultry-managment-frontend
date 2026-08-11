import { PublicLayout } from "@/components/public-layout"

export default function PublicLayoutRoute({ children }: { children: React.ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>
}
