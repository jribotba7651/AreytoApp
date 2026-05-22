import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';

// Hardcoded hex colors for xterm theme — xterm does not support CSS vars.
// Values mirror ui-context.md tokens. Documented exception D-058.
const TERMINAL_THEME = {
  background: '#0a0a0c',
  foreground: '#e8e8ec',
  cursor: '#7c8aa8',
  cursorAccent: '#0a0a0c',
  selectionBackground: '#4a5468',
  black: '#0a0a0c',
  red: '#b07070',
  green: '#6b9a7e',
  yellow: '#c4a572',
  blue: '#7c8aa8',
  magenta: '#7a93b8',
  cyan: '#93a1c0',
  white: '#e8e8ec',
  brightBlack: '#45454d',
  brightRed: '#b07070',
  brightGreen: '#6b9a7e',
  brightYellow: '#c4a572',
  brightBlue: '#93a1c0',
  brightMagenta: '#7a93b8',
  brightCyan: '#93a1c0',
  brightWhite: '#e8e8ec',
};

export function useTerminal(
  container: HTMLDivElement | null,
  cwd: string | null
): void {
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const unlistenRef = useRef<(() => void) | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    if (!container || !cwd) return;

    const terminal = new Terminal({
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      fontSize: 13,
      lineHeight: 1.2,
      cursorBlink: true,
      theme: TERMINAL_THEME,
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(container);
    fitAddon.fit();

    termRef.current = terminal;
    fitRef.current = fitAddon;

    // Forward key input to pty
    terminal.onData((data) => {
      void invoke('pty_write', { input: data });
    });

    // Listen for pty output
    let cancelled = false;
    listen<string>('pty:output', (event) => {
      if (cancelled) return;
      terminal.write(event.payload);
    }).then((unlisten) => {
      if (cancelled) { unlisten(); return; }
      unlistenRef.current = unlisten;
    });

    // Resize observer — fit xterm and notify pty
    const observer = new ResizeObserver(() => {
      try {
        fitAddon.fit();
        void invoke('pty_resize', { cols: terminal.cols, rows: terminal.rows });
      } catch {
        // Container may be detached during cleanup
      }
    });
    observer.observe(container);
    observerRef.current = observer;

    // Spawn pty after terminal is ready
    void invoke('pty_spawn', { cwd });

    return () => {
      cancelled = true;
      unlistenRef.current?.();
      observer.disconnect();
      terminal.dispose();
      void invoke('pty_kill');
      termRef.current = null;
      fitRef.current = null;
      unlistenRef.current = null;
      observerRef.current = null;
    };
  }, [container, cwd]);
}
