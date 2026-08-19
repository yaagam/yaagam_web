export default function HiddenPortalNotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5">
      <section className="text-center">
        <p className="text-sm font-semibold text-muted-foreground">404</p>
        <h1 className="mt-2 text-3xl font-semibold">Page not found</h1>
        <p className="mt-3 text-sm text-muted-foreground">The page you requested could not be found.</p>
      </section>
    </main>
  );
}