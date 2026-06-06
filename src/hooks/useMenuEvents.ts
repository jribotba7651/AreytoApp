import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useProjectStore } from '@/stores/projectStore';

export function useMenuEvents() {
  useEffect(() => {
    let cancelled = false;
    const unlisteners: Array<() => void> = [];

    async function setup() {
      const [u1, u2, u3] = await Promise.all([
        listen('menu:open-project', () => {
          const store = useProjectStore.getState();
          if (store.currentProject) {
            store.setPendingMenuAction('open');
            store.closeProject();
          } else {
            store.triggerOpenProject?.();
          }
        }),
        listen('menu:new-project', () => {
          const store = useProjectStore.getState();
          if (store.currentProject) {
            store.setPendingMenuAction('new');
            store.closeProject();
          } else {
            store.triggerNewProject?.();
          }
        }),
        listen('menu:close-project', () => {
          useProjectStore.getState().closeProject();
        }),
      ]);

      if (cancelled) {
        u1(); u2(); u3();
      } else {
        unlisteners.push(u1, u2, u3);
      }
    }

    setup();
    return () => {
      cancelled = true;
      unlisteners.forEach((u) => u());
    };
  }, []);
}
