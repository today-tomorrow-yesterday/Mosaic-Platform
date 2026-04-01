export type SeasonId = "spring" | "summer" | "fall" | "winter" | "halloween" | "christmas"

interface SeasonTheme {
  id: SeasonId
  label: string
  bg: string
  glowA: string   // top-right
  glowB: string   // bottom-left
  glowC: string   // center
  accent: string
  logoBg: string
  logoText: string
  textPrimary: string
}

const themes: Record<SeasonId, SeasonTheme> = {
  spring: {
    id: "spring",
    label: "Spring",
    bg: "#f5f7f2",
    glowA: "rgba(209, 250, 229, 0.5)",
    glowB: "rgba(252, 231, 243, 0.4)",
    glowC: "rgba(237, 233, 254, 0.35)",
    accent: "#16a34a",
    logoBg: "#14291a",
    logoText: "#d1fae5",
    textPrimary: "#0f1f12",
  },
  summer: {
    id: "summer",
    label: "Summer",
    bg: "#faf8f4",
    glowA: "rgba(253, 230, 138, 0.4)",
    glowB: "rgba(255, 228, 230, 0.3)",
    glowC: "rgba(224, 242, 254, 0.3)",
    accent: "#f97316",
    logoBg: "#1a1208",
    logoText: "#f6e8c3",
    textPrimary: "#1a1208",
  },
  fall: {
    id: "fall",
    label: "Fall",
    bg: "#faf5ef",
    glowA: "rgba(254, 186, 116, 0.4)",
    glowB: "rgba(254, 205, 211, 0.3)",
    glowC: "rgba(253, 230, 138, 0.25)",
    accent: "#b45309",
    logoBg: "#1c0f06",
    logoText: "#fef3c7",
    textPrimary: "#1c0f06",
  },
  winter: {
    id: "winter",
    label: "Winter",
    bg: "#f6f8fc",
    glowA: "rgba(219, 234, 254, 0.5)",
    glowB: "rgba(224, 231, 255, 0.4)",
    glowC: "rgba(240, 253, 250, 0.35)",
    accent: "#2563eb",
    logoBg: "#0f172a",
    logoText: "#dbeafe",
    textPrimary: "#0f172a",
  },
  halloween: {
    id: "halloween",
    label: "Halloween",
    bg: "#faf3ee",
    glowA: "rgba(251, 146, 60, 0.35)",
    glowB: "rgba(168, 85, 247, 0.2)",
    glowC: "rgba(251, 146, 60, 0.15)",
    accent: "#ea580c",
    logoBg: "#1a0a00",
    logoText: "#fed7aa",
    textPrimary: "#1a0a00",
  },
  christmas: {
    id: "christmas",
    label: "Christmas",
    bg: "#f6faf6",
    glowA: "rgba(187, 247, 208, 0.5)",
    glowB: "rgba(254, 202, 202, 0.4)",
    glowC: "rgba(254, 249, 195, 0.4)",
    accent: "#dc2626",
    logoBg: "#0a1f0a",
    logoText: "#bbf7d0",
    textPrimary: "#0a1f0a",
  },
}

export function getSeasonById(id: string | undefined): SeasonTheme {
  if (id && id in themes) return themes[id as SeasonId]
  return getCurrentSeason()
}

export function getCurrentSeason(): SeasonTheme {
  const now = new Date()
  const month = now.getMonth() + 1 // 1–12
  const day = now.getDate()

  if (month === 10) return themes.halloween
  if (month === 12 && day <= 25) return themes.christmas
  if (month >= 3 && month <= 5) return themes.spring
  if (month >= 6 && month <= 8) return themes.summer
  if (month >= 9 && month <= 11) return themes.fall
  return themes.winter
}

export function getSeasonCssVars(theme: SeasonTheme): string {
  return (
    `--s-bg: ${theme.bg};` +
    `--s-glow-a: ${theme.glowA};` +
    `--s-glow-b: ${theme.glowB};` +
    `--s-glow-c: ${theme.glowC};` +
    `--s-accent: ${theme.accent};` +
    `--s-logo-bg: ${theme.logoBg};` +
    `--s-logo-text: ${theme.logoText};` +
    `--s-text-primary: ${theme.textPrimary};`
  )
}
