import type { AvatarId } from "../domain/models";

export type AvatarDefinition = {
  id: AvatarId;
  name: string;
  role: string;
  image: string;
  premium: boolean;
  motion: "none" | "neon" | "gold" | "midnight";
};

export const avatars: readonly AvatarDefinition[] = [
  {
    id: "pazar-kasifi",
    name: "Pazar Kaşifi",
    role: "Fırsat avcısı",
    image: "/assets/avatars/pazar-kasifi.webp",
    premium: false,
    motion: "none",
  },
  {
    id: "atolye-ustasi",
    name: "Atölye Ustası",
    role: "Ürün yenileyici",
    image: "/assets/avatars/atolye-ustasi.webp",
    premium: false,
    motion: "none",
  },
  {
    id: "koleksiyon-uzmani",
    name: "Koleksiyon Uzmanı",
    role: "Detay gözlemcisi",
    image: "/assets/avatars/koleksiyon-uzmani.webp",
    premium: false,
    motion: "none",
  },
  {
    id: "neon-araci",
    name: "Neon Aracı",
    role: "Canlı avatar",
    image: "/assets/avatars/neon-araci.webp",
    premium: true,
    motion: "neon",
  },
  {
    id: "altin-vizyoner",
    name: "Altın Vizyoner",
    role: "Canlı avatar",
    image: "/assets/avatars/altin-vizyoner.webp",
    premium: true,
    motion: "gold",
  },
  {
    id: "gece-analisti",
    name: "Gece Analisti",
    role: "Canlı avatar",
    image: "/assets/avatars/gece-analisti.webp",
    premium: true,
    motion: "midnight",
  },
] as const;

export const DEFAULT_AVATAR_ID: AvatarId = "pazar-kasifi";

export const avatarById = (id: AvatarId) =>
  avatars.find((avatar) => avatar.id === id) ?? avatars[0];

export const freeAvatars = avatars.filter((avatar) => !avatar.premium);
export const premiumAvatars = avatars.filter((avatar) => avatar.premium);
