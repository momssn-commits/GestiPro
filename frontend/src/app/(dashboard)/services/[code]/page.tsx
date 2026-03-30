import { ServiceDetail } from '@/components/services/ServiceDetail'

export default function ServicePage({ params }: { params: { code: string } }) {
  return <ServiceDetail code={params.code} />
}
