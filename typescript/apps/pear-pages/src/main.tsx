import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { routeTree } from "./routeTree.gen";
import "./styles.css";

const queryClient = new QueryClient();

// pear serves this app at "/" on the instance host and on every member's handle
// host, as their landing pages. the address bar stays at "/", so the route is
// chosen here rather than read from the URL: the instance page when the host
// is the OAuth issuer's, a member page otherwise. a memory history keeps the
// browser URL untouched while the router works on the chosen route.
async function landingRoute(): Promise<string | undefined> {
  if (window.location.pathname !== "/") return undefined;
  try {
    const res = await fetch("/.well-known/oauth-authorization-server");
    const { issuer } = (await res.json()) as { issuer?: string };
    const issuerHost = issuer ? new URL(issuer).hostname : undefined;
    return issuerHost === window.location.hostname ? "/ui/at/" : "/ui/at/member";
  } catch {
    return "/ui/at/member";
  }
}

const landing = await landingRoute();

const router = createRouter({
  routeTree,
  basepath: "/ui",
  defaultPreload: "intent",
  scrollRestoration: true,
  ...(landing ? { history: createMemoryHistory({ initialEntries: [landing] }) } : {}),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("app");
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  );
}
