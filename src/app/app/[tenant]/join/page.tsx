import JoinPageClient from './join-client'

export default async function JoinPage({ params }: { params: Promise<{ tenant: string }> }) {
  const resolvedParams = await params
  
  return <JoinPageClient tenant={resolvedParams.tenant} />
}
