import { create } from 'zustand';
import { readCharacters, writeCharacters, createCharacterId, type Character } from '@/lib/characters';
import type { ChapterColor } from '@/types/project';

interface CharacterState {
  characters: Character[];
  rootPath: string | null;
  loadCharacters: (rootPath: string) => Promise<void>;
  addCharacter: (name: string, description: string, color: ChapterColor) => Promise<void>;
  removeCharacter: (id: string) => Promise<void>;
  reset: () => void;
}

export const useCharacterStore = create<CharacterState>((set, get) => ({
  characters: [],
  rootPath: null,

  loadCharacters: async (rootPath: string) => {
    const characters = await readCharacters(rootPath);
    set({ characters, rootPath });
  },

  addCharacter: async (name: string, description: string, color: ChapterColor) => {
    const { rootPath, characters } = get();
    if (!rootPath) return;
    const character: Character = { id: createCharacterId(), name, description, color };
    const next = [...characters, character];
    set({ characters: next });
    await writeCharacters(rootPath, next);
  },

  removeCharacter: async (id: string) => {
    const { rootPath, characters } = get();
    if (!rootPath) return;
    const next = characters.filter((c) => c.id !== id);
    set({ characters: next });
    await writeCharacters(rootPath, next);
  },

  reset: () => set({ characters: [], rootPath: null }),
}));
