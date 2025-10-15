import React from "react";
import Logo from "../assets/cervell.svg?react";
import { PALETTE } from './palette';

type Props = { onNavigate: () => void };

const stats = [
  { icon: "🎯", label: "Nivells Superats", value: 0 },
  { icon: "🏆", label: "Estrelles", value: 0 },
  { icon: "⚡️", label: "Nivells Perfectes", value: 0 },
];

export default function HomeScreen({ onNavigate }: Props) {
  return (
    <main role="main" style={styles.page}>
      <div style={styles.container} aria-labelledby="title">
        {/* LOGO */}
        <div style={styles.logoWrap} role="img" aria-label="Logotip de MazeMind">
          <Logo style={styles.logoSvg} />
        </div>

        {/* Títol i subtítol*/}
        <h1 id="title" style={styles.title}>MazeMind</h1>
        <p style={styles.subtitle}>
          Entrena la teva memòria visoespacial resolent laberints
        </p>

        {/* Estadístiques */}
        <ul style={styles.statsGrid} aria-label="Estadístiques de progrés">
          {stats.map(s => (
            <li key={s.label} style={styles.statCard}>
              <div aria-hidden="true" style={styles.statIcon}>{s.icon}</div>
              <div style={styles.statValue} aria-live="polite">{s.value}</div>
              <div style={styles.statLabel}>{s.label}</div>
            </li>
          ))}
        </ul>

        {/* Navegació principal --> Play i Config */}
        <nav id="actions" aria-label="Accions" style={styles.actionsCol}>
          <button
            type="button"
            style={styles.playBtn}
            onClick={onNavigate}
            aria-label="Jugar a MazeMind"
          >
            <span aria-hidden="true">▶</span> Jugar
          </button>

          <button
            type="button"
            style={styles.secondaryBtn}
            onClick={() => alert("En construcció")}
            aria-label="Obrir configuració"
          >
            <span aria-hidden="true">⚙</span> Configuració
          </button>
        </nav>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    // Omple tota la pantalla amb gradients i fons base, elements centrats
    minHeight: "100svh",
    width: "100vw",
    margin: 0,
    background:
      `radial-gradient(1200px 600px at 20% 0%, rgba(86,180,233,0.12), transparent 60%),
       radial-gradient(900px 500px at 80% 100%, rgba(0,114,178,0.10), transparent 60%),
       ${PALETTE.bg}`,
    color: PALETTE.text,
    display: "grid",
    placeItems: "center",
    padding: 24,
    boxSizing: "border-box",
  },
  container: {
    // Contenidor principal centrat amb amplada màxima i gap
    width: "min(1100px, 100%)",
    display: "grid",
    justifyItems: "center",
    textAlign: "center",
    gap: 24,
    paddingInline: "min(4vw, 40px)",
  },
  logoSvg: { 
    // SVG del logo amb mida fixa i filtre per fer-lo blanc
    width: 80,         
    height: 80,
    filter: 'brightness(0) invert(1)',
  },
  logoWrap: {
    // Requadre del logo amb gradient, ombra i centrat
    background: `linear-gradient(135deg, ${PALETTE.playBtnFrom}, ${PALETTE.playBtnTo})`,
    borderRadius: 32,
    padding: 24,
    marginBottom: 16,
    boxShadow: PALETTE.shadow,
    fontSize: 40,
    lineHeight: 1,
    display: "grid",
    placeItems: "center",
  },
  title: {
    // Títol principal amb font gran i ombra
    fontSize: "clamp(42px, 6vw, 68px)",
    fontWeight: 900,
    margin: 0,
    letterSpacing: "-0.02em",
    textShadow: "0 2px 0 rgba(0,0,0,.25)",
  },
  subtitle: {
    // Subtítol amb font mitjana i color secundari
    fontSize: "clamp(16px, 1.6vw, 20px)",
    margin: 0,
    maxWidth: 760,
    color: PALETTE.subtext,
    marginInline: "auto",
  },
  statsGrid: {
    // Graella responsiva per les estadístiques
    listStyle: "none",
    padding: 0,
    margin: "8px 0 0 0",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
    width: "80%",
  },
  statCard: {
    // Targeta per cada estadística amb fons i ombra
    background: PALETTE.surface,
    border: `1px solid ${PALETTE.borderColor}`,
    borderRadius: 16,
    padding: "16px 20px",
    display: "grid",
    justifyItems: "center",
    alignContent: "center",
    gap: 8,
    boxShadow: PALETTE.shadow,
  },
  statIcon: { 
    fontSize: 22, lineHeight: 1 
  },
  statValue: { 
    fontSize: 28, fontWeight: 800, letterSpacing: "0.02em" 
  },
  statLabel: { 
    fontSize: 14, color: "rgba(255,255,255,.75)" 
  },

  // Accions en COLUMNA
  actionsCol: {
    // Columna per als botons d'acció
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 12,
    width: "min(420px, 100%)",
    marginTop: 8,
  },
  playBtn: {
    // Botó principal "Jugar" amb gradient i ombra
    padding: "16px",
    borderRadius: 12,
    border: "2px solid transparent",
    background: `linear-gradient(90deg, ${PALETTE.playBtnFrom}, ${PALETTE.playBtnTo})`,
    color: "#fff",
    fontSize: 18,
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 6px 24px rgba(0,0,0,0.35)",
    transition: "transform .05s ease",
    outline: "3px solid transparent",
  },
  secondaryBtn: {
    // Botó secundari "Configuració" amb fons translúcid
    padding: "16px",
    borderRadius: 12,
    border: `2px solid ${PALETTE.borderColor}`,
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    fontSize: 18,
    fontWeight: 700,
    cursor: "pointer",
    transition: "transform .05s ease",
    outline: "3px solid transparent",
  },
};
