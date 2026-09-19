import { createFileRoute } from "@tanstack/react-router";
import { Panel, useInstance } from "../-panel";

// The server's front door, served at / on the instance domain. Says what this
// is and where the public facts about it live; signing in happens from apps.
export const Route = createFileRoute("/at/")({
  component: InstancePage,
});

function InstancePage() {
  const instance = useInstance();
  const host = window.location.hostname;
  return (
    <Panel
      title={instance?.name || host}
      lede={
        <>
          An organizational data server, running{" "}
          <a href="https://habitat.network" className="underline underline-offset-4">
            habitat
          </a>
          . Members sign in from the apps their organization uses.
        </>
      }
      footer={
        <ul className="flex flex-col gap-1">
          <li>
            <a href="/.well-known/did.json" className="underline underline-offset-4">
              this server's identity
            </a>
          </li>
          <li>
            <a href="/xrpc/network.habitat.instance.describeInstance" className="underline underline-offset-4">
              describeInstance
            </a>
          </li>
        </ul>
      }
    />
  );
}
