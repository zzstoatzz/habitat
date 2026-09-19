import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Panel, useInstance } from "../-panel";

// A member's page, served at / on their own handle host (alice.acme.example).
// Everything on it is already public through the handle and DID: who this is,
// which organization they belong to, and where their identity document lives.
export const Route = createFileRoute("/at/member")({
  component: MemberPage,
});

type Identity = { did: string; handle: string; didDoc?: { alsoKnownAs?: string[] } };

async function resolve(identifier: string): Promise<Identity | undefined> {
  const res = await fetch(`/xrpc/com.atproto.identity.resolveIdentity?${new URLSearchParams({ identifier })}`);
  if (!res.ok) return undefined;
  return (await res.json()) as Identity;
}

function MemberPage() {
  const handle = window.location.hostname;
  const instance = useInstance();
  const orgHandle = handle.split(".").slice(1).join(".");
  const { data: me, isLoading } = useQuery({ queryKey: ["identity", handle], queryFn: () => resolve(handle) });
  const { data: org } = useQuery({ queryKey: ["identity", orgHandle], queryFn: () => resolve(orgHandle), enabled: orgHandle.includes(".") });
  const didHost = me?.did.startsWith("did:web:") ? me.did.slice("did:web:".length) : undefined;

  if (!isLoading && !me) {
    return <Panel title={handle} lede="No account by this handle here." />;
  }
  return (
    <Panel
      title={handle}
      lede={
        org ? (
          <>
            A member of <span className="font-medium text-foreground">{instance?.name || orgHandle}</span>
            {org.handle !== handle && <> ({org.handle})</>}.
          </>
        ) : (
          "An account on this server."
        )
      }
      footer={
        me && (
          <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1">
            <dt>identity</dt>
            <dd className="break-all">
              {didHost ? (
                <a href={`https://${didHost}/.well-known/did.json`} className="underline underline-offset-4">
                  {me.did}
                </a>
              ) : (
                me.did
              )}
            </dd>
            {org && (
              <>
                <dt>organization</dt>
                <dd className="break-all">{org.did}</dd>
              </>
            )}
          </dl>
        )
      }
    />
  );
}
