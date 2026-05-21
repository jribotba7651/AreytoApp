function BookEmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center min-h-[60vh] px-4 gap-4">
      <p className="font-serif text-2xl text-text-secondary text-center max-w-sm">
        El libro está vacío
      </p>
      <p className="font-sans text-sm text-text-tertiary text-center max-w-sm">
        Crea tu primer capítulo desde la vista Capítulo Activo
      </p>
    </div>
  );
}

export default BookEmptyState;
