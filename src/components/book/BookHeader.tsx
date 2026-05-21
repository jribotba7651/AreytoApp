interface BookHeaderProps {
  projectName: string;
  chapterCount: number;
}

function BookHeader({ projectName, chapterCount }: BookHeaderProps) {
  return (
    <div className="max-w-[700px] mx-auto px-8 pt-16 pb-12 text-center">
      <h1 className="font-serif text-[32px] font-semibold text-text-primary leading-tight">
        {projectName}
      </h1>
      <div className="w-16 border-b border-border-subtle mx-auto my-6" />
      <p className="text-sm text-text-secondary font-sans">
        {chapterCount} {chapterCount === 1 ? 'capítulo' : 'capítulos'}
      </p>
    </div>
  );
}

export default BookHeader;
