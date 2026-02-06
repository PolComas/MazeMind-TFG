import React, { useMemo } from 'react';
import type { MultiplayerPlayer } from '../../lib/multiplayer';
import NetworkBackground from '../NetworkBackground';
import { useSettings } from '../../context/SettingsContext';
import { useLanguage } from '../../context/LanguageContext';

type GameResultScreenProps = {
    players: MultiplayerPlayer[];
    currentUserId: string;
    onExit: () => void;
};

export default function GameResultScreen({ players, currentUserId, onExit }: GameResultScreenProps) {
    const { getVisualSettings } = useSettings();
    const screenSettings = getVisualSettings('levelSelect');
    const { t } = useLanguage();

    // Sort by points descending
    const sortedPlayers = [...players].sort((a, b) => b.total_points - a.total_points);
    const winner = sortedPlayers[0];
    const isMeWinner = winner?.user_id === currentUserId;
    const isTie = sortedPlayers.length > 1 && sortedPlayers[0].total_points === sortedPlayers[1].total_points;

    const styles = useMemo<Record<string, React.CSSProperties>>(() => ({
        container: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100svh',
            padding: 24,
            // background: 'radial-gradient(circle at center, #1f2937 0%, #111827 100%)', // Removed
            color: 'white',
            fontFamily: '"Space Grotesk", sans-serif',
            position: 'relative',
            overflow: 'hidden',
        },
        content: {
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 32,
            width: '100%',
            maxWidth: 500,
            animation: 'scaleUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        },
        header: {
            textAlign: 'center',
        },
        emoji: {
            fontSize: 64,
            marginBottom: 16,
            display: 'block',
            animation: 'pulse 2s infinite',
        },
        title: {
            fontSize: 48,
            fontWeight: 900,
            margin: 0,
            background: isTie
                ? 'linear-gradient(to right, #fbbf24, #f59e0b)'
                : isMeWinner
                    ? 'linear-gradient(to right, #4ade80, #22c55e)'
                    : 'linear-gradient(to right, #f87171, #ef4444)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
        },
        subtitle: {
            fontSize: 18,
            opacity: 0.7,
            marginTop: 8,
        },
        scoreboard: {
            width: '100%',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.1)',
            overflow: 'hidden',
        },
        row: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
        },
        rank: {
            fontWeight: 'bold',
            width: 30,
            color: '#fbbf24',
        },
        name: {
            flex: 1,
            fontWeight: 600,
        },
        score: {
            fontWeight: 'bold',
            fontSize: 20,
        },
        button: {
            padding: '16px 48px',
            borderRadius: 12,
            background: 'white',
            color: 'black',
            border: 'none',
            fontSize: 18,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(255,255,255,0.2)',
            transition: 'transform 0.2s',
        }
    }), [isMeWinner, isTie]);

    return (
        <div style={styles.container}>
            <NetworkBackground
                primaryColor={screenSettings.accentColor1}
                backgroundColor={screenSettings.backgroundColor}
            />
            {/* Background Confetti hint */}
            {isMeWinner && (
                <div style={{ position: 'absolute', inset: 0, opacity: 0.2, backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ccircle cx=\'2\' cy=\'2\' r=\'2\' fill=\'%23fff\'/%3E%3C/svg%3E")', animation: 'fadeIn 2s' }} />
            )}

            <div style={styles.content}>
                <div style={styles.header}>
                    <span style={styles.emoji}>{isTie ? '🤝' : isMeWinner ? '🏆' : '💀'}</span>
                    <h1 style={styles.title}>
                        {isTie ? t('multiplayer.result.tie') : isMeWinner ? t('multiplayer.result.win') : t('multiplayer.result.loss')}
                    </h1>
                    <div style={styles.subtitle}>
                        {isTie
                            ? t('multiplayer.result.tieSubtitle')
                            : isMeWinner
                                ? t('multiplayer.result.winSubtitle')
                                : t('multiplayer.result.lossSubtitle')}
                    </div>
                </div>

                <div style={styles.scoreboard}>
                    {sortedPlayers.map((p, i) => (
                        <div key={p.user_id} style={styles.row}>
                            <span style={styles.rank}>#{i + 1}</span>
                            <span style={styles.name}>
                                {p.display_name || t('multiplayer.result.player')} {p.user_id === currentUserId && t('multiplayer.result.youSuffix')}
                            </span>
                            <span style={styles.score}>{p.total_points} pts</span>
                        </div>
                    ))}
                </div>

                <button
                    style={styles.button}
                    onClick={onExit}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                    {t('multiplayer.result.back')}
                </button>
            </div>
        </div>
    );
}
