import StudioClient from "../StudioClient";

export default async function StudioDynamicPage({ params }: { params: Promise<{ connectionId: string }> }) {
  const { connectionId } = await params;
  const decodedConnectionId = decodeURIComponent(connectionId);
  return <StudioClient connectionId={decodedConnectionId} />;
}
