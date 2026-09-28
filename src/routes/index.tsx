import { createFileRoute } from "@tanstack/react-router";
import { IdeApp } from "@/plugins/ide-ui/lib/components/IdeApp.tsx";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <IdeApp />;
}
