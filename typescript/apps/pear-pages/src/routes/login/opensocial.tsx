import { Button, Field, FieldError, FieldLabel, Input } from "internal/components/ui";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Panel } from "../-panel";

type OrgProfile = {
  name: string;
  description?: string;
};

type OpensocialLoginInfo = {
  orgProfile: OrgProfile;
  clientName: string;
  clientUri: string;
  logoUri: string;
};

const errorText: Record<string, string> = {
  "not-admin": "That account is not an admin of this organization.",
  "unknown-handle": "No account was found for that handle.",
};

// Opensocial org approval page. pear's authorization endpoint redirects here
// when the identity being signed into is an opensocial org: an app is asking
// for a session as the organization, and only an admin may grant one. The
// admin enters their own handle; the same endpoint verifies their role and
// sends them to their own PDS to prove who they are. A refused handle comes
// back here with `error` set.
export const Route = createFileRoute("/login/opensocial")({
  validateSearch: z.object({
    error: z.string().optional(),
  }),
  loader: async (): Promise<OpensocialLoginInfo> => {
    const res = await fetch("/oauth/opensocial");
    if (!res.ok) throw new Error("Failed to load org profile");
    return (await res.json()) as OpensocialLoginInfo;
  },
  component: OpensocialLoginPage,
});

function hostname(uri: string): string | undefined {
  try {
    return new URL(uri).hostname;
  } catch {
    return undefined;
  }
}

function OpensocialLoginPage() {
  const { orgProfile, clientName, clientUri, logoUri } = Route.useLoaderData();
  const { error } = Route.useSearch();
  const [submitting, setSubmitting] = useState(false);

  const appName = clientName || hostname(clientUri) || clientUri;
  const appHost = clientUri ? hostname(clientUri) : undefined;

  return (
    <Panel
      title={orgProfile.name}
      lede={
        <>
          <span className="font-medium text-foreground">{appName}</span> wants to act as this
          organization.
        </>
      }
      footer="Approving lets the app read the organization's spaces and write records as it, within the scopes it asked for. Only an admin can approve, and you sign in where your own account lives."
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          {logoUri && <img src={logoUri} alt="" className="h-10 w-10 rounded-lg object-cover" />}
          <div className="flex min-w-0 flex-col">
            <p className="truncate font-medium">{appName}</p>
            {appHost && appHost !== appName && (
              <p className="truncate text-xs text-muted-foreground">{appHost}</p>
            )}
          </div>
        </div>
        {orgProfile.description && (
          <p className="text-sm text-muted-foreground">{orgProfile.description}</p>
        )}
        <form method="POST" action="/oauth/opensocial" onSubmit={() => setSubmitting(true)}>
          <fieldset disabled={submitting} className="flex flex-col gap-4">
            <Field>
              <FieldLabel>Your handle</FieldLabel>
              <Input
                placeholder="you.example.com"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                autoFocus
                name="handle"
                required
              />
              {error && <FieldError errors={[{ message: errorText[error] ?? error }]} />}
            </Field>
            <Button type="submit" size="lg" className="w-full">
              {submitting ? "Continuing…" : "Continue as an admin"}
            </Button>
          </fieldset>
        </form>
      </div>
    </Panel>
  );
}
