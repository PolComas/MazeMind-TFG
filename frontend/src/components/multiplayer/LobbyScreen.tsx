import React, { useMemo } from 'react';
import type { MultiplayerMatch, MultiplayerPlayer } from '../../lib/multiplayer';
import NetworkBackground from '../NetworkBackground';
import { useSettings } from '../../context/SettingsContext';

type LobbyScreenProps = {
    match: MultiplayerMatch;
    players: MultiplayerPlayer[];
    currentUserId: string;
    onLeave: () => void;
    onStart?: () => void;
};

export default function LobbyScreen({ match, players, currentUserId, onLeave }: LobbyScreenProps) {
    const { getVisualSettings } = useSettings();
    const screenSettings = getVisualSettings('levelSelect');
    const me = players.find((p) => p.user_id === currentUserId);
    const opponent = players.find((p) => p.user_id !== currentUserId);

    const styles = useMemo<Record<string, React.CSSProperties>>(() => ({
        container: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            width: '100%',
            gap: 32,
            animation: 'fadeIn 0.5s ease-out',
        },
        header: {
            textAlign: 'center',
        },
        title: {
            fontSize: 32,
            fontWeight: 800,
            margin: 0,
            background: 'linear-gradient(135deg, #fff 0%, #ccc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
        },
        subtitle: {
            fontSize: 16,
            opacity: 0.7,
            marginTop: 8,
        },
        vsContainer: {
            display: 'flex',
            alignItems: 'center',
            gap: 48,
            position: 'relative',
        },
        playerCard: {
            width: 160,
            height: 200,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 24,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            transition: 'transform 0.3s ease',
        },
        avatar: {
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
            fontWeight: 'bold',
            boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)',
        },
        avatarEmpty: {
            background: 'rgba(255,255,255,0.1)',
            boxShadow: 'none',
            border: '2px dashed rgba(255,255,255,0.2)',
        },
        playerName: {
            fontSize: 18,
            fontWeight: 600,
            textAlign: 'center',
            wordBreak: 'break-word',
            padding: '0 12px',
        },
        vsBadge: {
            fontSize: 48,
            fontWeight: 900,
            fontStyle: 'italic',
            color: '#fbbf24',
            textShadow: '0 0 20px rgba(251, 191, 36, 0.4)',
            animation: 'pulse 2s infinite ease-in-out',
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
        },
        codeBox: {
            background: 'rgba(0,0,0,0.3)',
            padding: '12px 24px',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
        },
        codeLabel: { fontSize: 12, opacity: 0.6, textTransform: 'uppercase', letterSpacing: 1 },
        codeValue: { fontSize: 24, fontWeight: 'bold', letterSpacing: 4, fontFamily: 'monospace' },
        button: {
            marginTop: 24,
            padding: '12px 32px',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'transparent',
            color: 'white',
            cursor: 'pointer',
            fontSize: 16,
            transition: 'all 0.2s',
            ':hover': { background: 'rgba(255,255,255,0.1)' },
        } as React.CSSProperties
    }), []);

    return (
        <div style={styles.container}>
            <NetworkBackground primaryColor={screenSettings.accentColor1} />
            <div style={styles.header}>
                <h1 style={styles.title}>Multijugador</h1>
                <div style={styles.subtitle}>Esperant jugadors...</div>
            </div>

            <div style={styles.codeBox}>
                <span style={styles.codeLabel}>Codi de sala</span>
                <span style={styles.codeValue}>{match.code}</span>
            </div>

            <div style={styles.vsContainer}>
                {/* Helper to render a card */}
                <div style={styles.playerCard}>
                    <div style={styles.avatar}>
                        {me?.display_name?.[0]?.toUpperCase() ?? me?.user_id?.slice(0, 1)?.toUpperCase() ?? '?'}
                    </div>
                    <div style={styles.playerName}>{me?.display_name ?? 'Tu'}</div>
                </div>

                <div style={styles.vsBadge}>VS</div>

                <div style={{ ...styles.playerCard, ...(opponent ? {} : { opacity: 0.6 }) }}>
                    {opponent ? (
                        <>
                            <div style={{ ...styles.avatar, background: 'linear-gradient(135deg, #f43f5e 0%, #f97316 100%)', boxShadow: '0 0 20px rgba(244, 63, 94, 0.4)' }}>
                                {opponent.display_name?.[0]?.toUpperCase() ?? '?'}
                            </div>
                            <div style={styles.playerName}>{opponent.display_name ?? 'Rival'}</div>
                        </>
                    ) : (
                        <>
                            <div style={{ ...styles.avatar, ...styles.avatarEmpty }}>
                                ?
                            </div>
                            <div style={styles.playerName}>Esperant...</div>
                        </>
                    )}
                </div>
            </div>

            <div style={{ textAlign: 'center', opacity: 0.6, fontSize: 14 }}>
                Mode: {match.config.difficulty.toUpperCase()} • {match.rounds_count} Rondes
            </div>

            <button style={styles.button} onClick={onLeave}>
                Cancel·lar
            </button>
        </div>
    );
}
