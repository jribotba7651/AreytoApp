interface ShortcutHintProps {
  text: string;
  className?: string;
}

function ShortcutHint({ text, className = '' }: ShortcutHintProps) {
  return (
    <span className={`font-mono text-xs text-text-tertiary ${className}`}>
      {text}
    </span>
  );
}

export default ShortcutHint;
