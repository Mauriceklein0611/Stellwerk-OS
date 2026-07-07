import { SprintDetail } from "@/components/sprint/SprintDetail";

export default async function SprintDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SprintDetail id={id} />;
}
