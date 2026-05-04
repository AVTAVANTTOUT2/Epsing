export default function OfflinePage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 text-5xl font-black tracking-tighter text-primary">Epsing</div>
      <h1 className="text-xl font-semibold">Hors connexion</h1>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        Connexion requise pour voter. Le classement reste consultable depuis le cache.
      </p>
    </div>
  );
}
