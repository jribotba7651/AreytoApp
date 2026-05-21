interface BookChapterErrorProps {
  chapterFilename: string;
  reason: string;
}

function BookChapterError({ chapterFilename, reason }: BookChapterErrorProps) {
  return (
    <div className="max-w-[700px] mx-auto px-8 py-6 border-l-2 border-error opacity-50">
      <p className="text-sm text-text-tertiary font-sans">
        No se pudo cargar {chapterFilename}
      </p>
      <p className="text-xs text-text-tertiary font-mono mt-1">{reason}</p>
    </div>
  );
}

export default BookChapterError;
