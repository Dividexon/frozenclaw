import { AgentLaunchBridge } from "@/components/agent-launch-bridge";

type AgentStartPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    token?: string;
  }>;
};

export default async function AgentStartPage({ params, searchParams }: AgentStartPageProps) {
  const { slug } = await params;
  const { token } = await searchParams;

  return <AgentLaunchBridge slug={slug} token={token ?? null} />;
}
