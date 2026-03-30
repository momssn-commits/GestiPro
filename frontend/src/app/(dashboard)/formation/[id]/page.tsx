import { FormationDetail } from '@/components/formation/FormationDetail'

interface Props {
  params: { id: string }
}

export default function FormationDetailPage({ params }: Props) {
  return <FormationDetail id={params.id} />
}
