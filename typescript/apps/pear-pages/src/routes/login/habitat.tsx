import { Button, Field, FieldError, FieldLabel, Input } from "internal/components/ui";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { Panel, useInstance } from "../-panel";

// Member password login page. pear redirects here (from the password login
// provider's Authorize step) with the member's handle as a search param. The
// page is served same-origin by pear under /ui/, so it calls the loginMember
// XRPC endpoint directly and follows the returned OAuth callback URL.
export const Route = createFileRoute("/login/habitat")({
  validateSearch: z.object({
    handle: z.string().default(""),
  }),
  component: HabitatLoginPage,
});

type FormValues = { handle?: string; password: string };

type LoginMemberOutput = { callbackURL: string };

function HabitatLoginPage() {
  const { handle } = Route.useSearch();
  const instance = useInstance();

  const {
    register,
    handleSubmit,
    setError,
    formState: { isSubmitting, errors },
  } = useForm<FormValues>();

  const onSubmit = async ({ handle: formHandle, password }: FormValues) => {
    try {
      const res = await fetch("/xrpc/network.habitat.org.loginMember", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ handle: formHandle || handle, password }),
      });
      if (!res.ok) {
        throw new Error((await res.text()) || "Sign in failed");
      }
      const { callbackURL } = (await res.json()) as LoginMemberOutput;
      window.location.href = callbackURL;
    } catch (err) {
      setError("root", {
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  return (
    <Panel
      title={instance?.name || "Sign in"}
      lede={
        handle ? (
          <>
            Sign in as <span className="font-medium text-foreground">{handle}</span>
          </>
        ) : (
          "Sign in with your handle and password."
        )
      }
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <fieldset disabled={isSubmitting} className="flex flex-col gap-4">
          {!handle && (
            <Field>
              <FieldLabel>Handle</FieldLabel>
              <Input
                placeholder="you.example.com"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                {...register("handle", { required: true })}
              />
              <FieldError errors={[errors.handle]} />
            </Field>
          )}
          <Field>
            <FieldLabel>Password</FieldLabel>
            <Input
              type="password"
              autoComplete="current-password"
              autoFocus
              {...register("password", { required: true })}
            />
            <FieldError errors={[errors.password]} />
          </Field>
          <FieldError errors={[errors.root]} />
          <Button type="submit" size="lg" className="w-full">
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
        </fieldset>
      </form>
    </Panel>
  );
}
