export type AmbientSoundId = 'rain' | 'cafe' | 'forest';

export interface AmbientSound {
  id: AmbientSoundId;
  url: string;
  labelKey: string;
}

export const AMBIENT_SOUNDS: AmbientSound[] = [
  {
    id: 'rain',
    url: 'https://archive.org/download/soundica-fs-790352-seaside-morning-post-rain-ambience-hamba/790352__seventhsamurai__seaside-morning-post-rain-ambience-hambantota-sri-lanka.mp3',
    labelKey: 'editor.ambient.rain',
  },
  {
    id: 'cafe',
    url: 'https://archive.org/download/453074-c-rogers-370973-waweee-coffee-shop-ambience-remastered/453074__c_rogers__370973__waweee__coffee-shop-ambience_remastered.mp3',
    labelKey: 'editor.ambient.cafe',
  },
  {
    id: 'forest',
    url: 'https://archive.org/download/soundica-fs-581727-forest-birds-wav/581727.mp3',
    labelKey: 'editor.ambient.forest',
  },
];

export const AMBIENT_DEFAULT_VOLUME = 0.4;
