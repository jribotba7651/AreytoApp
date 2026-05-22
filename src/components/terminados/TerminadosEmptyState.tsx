function TerminadosEmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center px-4 gap-4">
      <p className="font-serif text-2xl text-text-secondary text-center">
        No hay capítulos terminados
      </p>
      <p className="font-sans text-sm text-text-tertiary text-center max-w-xs">
        Cuando cierres un capítulo desde el sidebar aparecerá aquí
      </p>
    </div>
  );
}

export default TerminadosEmptyState;
