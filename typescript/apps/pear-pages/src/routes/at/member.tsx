import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Panel, useInstance } from "../-panel";

// The page at / on a handle host. habitat's nouns: an organization is an
// identity that hosts spaces and has members; a member is a person minted
// under the organization's handle. Everything here is already public through
// the handle and the DID, and the DID also says which is which: minted DIDs
// are did:web:<opaque>.<hive domain>, so what the handle carries above the
// hive domain is one label for an organization (hq.acme.example) and two for
// a member (alice.hq.acme.example).
export const Route = createFileRoute("/at/member")({
  component: HandlePage,
});

type Identity = { did: string; handle: string };

async function resolve(identifier: string): Promise<Identity | undefined> {
  const res = await fetch(`/xrpc/com.atproto.identity.resolveIdentity?${new URLSearchParams({ identifier })}`);
  if (!res.ok) return undefined;
  return (await res.json()) as Identity;
}

function didHost(did: string): string | undefined {
  return did.startsWith("did:web:") ? did.slice("did:web:".length) : undefined;
}

function HandlePage() {
  const handle = window.location.hostname;
  const instance = useInstance();
  const { data: me, isLoading } = useQuery({ queryKey: ["identity", handle], queryFn: () => resolve(handle) });
  const host = me ? didHost(me.did) : undefined;
  const hive = host?.split(".").slice(1).join(".");
  const labels = hive && handle.endsWith(`.${hive}`) ? handle.slice(0, -hive.length - 1).split(".") : [];
  const orgHandle = labels.length >= 2 ? `${labels.slice(1).join(".")}.${hive}` : undefined;
  const { data: org } = useQuery({ queryKey: ["identity", orgHandle], queryFn: () => resolve(orgHandle!), enabled: Boolean(orgHandle) });

  if (isLoading) return <Panel title={handle} />;
  if (!me) return <Panel title={handle} lede="No account by this handle here." />;

  const identity = (
    <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1">
      <dt>identity</dt>
      <dd className="break-all">
        {host ? (
          <a href={`https://${host}/.well-known/did.json`} className="underline underline-offset-4">
            {me.did}
          </a>
        ) : (
          me.did
        )}
      </dd>
      {org && (
        <>
          <dt>organization</dt>
          <dd className="break-all">
            <a href={`https://${org.handle}/`} className="underline underline-offset-4">
              {org.handle}
            </a>
          </dd>
        </>
      )}
    </dl>
  );

  if (labels.length === 1) {
    return (
      <Panel
        title={instance?.name || handle}
        lede={
          <>
            An organization on this server, <span className="font-medium text-foreground">{handle}</span>. Its members sign in from the apps it uses.
          </>
        }
        footer={identity}
      />
    );
  }
  return (
    <Panel
      title={handle}
      lede={
        org ? (
          <>
            A member of <span className="font-medium text-foreground">{instance?.name || org.handle}</span>.
          </>
        ) : (
          "An account on this server."
        )
      }
      footer={identity}
    />
  );
}
