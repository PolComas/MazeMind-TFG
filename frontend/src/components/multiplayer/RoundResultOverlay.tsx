import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

type RoundResultOverlayProps = {
    winnerId: string | null;
    myId: string;
    opponentName: string;
    myStats?: { time: number; points: number };
    opponentStats?: { time: number; points: number };
    reason: string; // 'time', 'completed', 'tie', etc.
};

export default function RoundResultOverlay({
    winnerId,
    myId,
    opponentName,
    myStats,
    opponentStats,
    reason,
}: RoundResultOverlayProps) {
    const { t } = useLanguage();
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Small delay to ensure smooth entrance after game end logic
        const t = setTimeout(() => setShow(true), 100);
        return () => clearTimeout(t);
    }, []);

    const isWin = winnerId === myId;
    const isTie = !winnerId;

    const styles = useMemo<Record<string, React.CSSProperties>>(() => ({
        overlay: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            opacity: show ? 1 : 0,
            transition: 'opacity 0.3s ease',
        },
        card: {
            background: 'rgba(30, 30, 30, 0.9)',
            border: `1px solid ${isWin ? '#4ade80' : isTie ? '#fbbf24' : '#f43f5e'}`,
            borderRadius: 24,
            padding: 32,
            width: '90%',
            maxWidth: 400,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 24,
            transform: show ? 'scale(1)' : 'scale(0.9)',
            transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            boxShadow: `0 0 50px ${isWin ? 'rgba(74, 222, 128, 0.2)' : isTie ? 'rgba(251, 191, 36, 0.2)' : 'rgba(244, 63, 94, 0.2)'}`,
        },
        title: {
            fontSize: 42,
            fontWeight: 900,
            margin: 0,
            color: isWin ? '#4ade80' : isTie ? '#fbbf24' : '#f43f5e',
            textShadow: '0 2px 10px rgba(0,0,0,0.3)',
            textAlign: 'center',
        },
        subtitle: {
            fontSize: 16,
            opacity: 0.8,
            textAlign: 'center',
            maxWidth: '80%',
        },
        statsContainer: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 24,
            width: '100%',
            marginTop: 12,
        },
        statBox: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            padding: 16,
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 12,
        },
        statLabel: { fontSize: 12, opacity: 0.6, textTransform: 'uppercase' },
        statValue: { fontSize: 24, fontWeight: 'bold' },
        statSub: { fontSize: 12, opacity: 0.5 },
        loadingDocs: {
            marginTop: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 14,
            opacity: 0.7,
        }
    }), [show, isWin, isTie]);

    const getReasonText = () => {
        if (reason === 'time') return t('multiplayer.roundReasonTime');
        if (reason === 'completed') return t('multiplayer.roundReasonCompleted');
        if (reason === 'finish') return t('multiplayer.roundReasonFinish');
        if (isTie) return t('multiplayer.roundReasonTie');
        return t('multiplayer.roundReasonLoss');
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.card}>
                <h1 style={styles.title}>{isWin ? t('multiplayer.roundWin') : isTie ? t('multiplayer.roundTie') : t('multiplayer.roundLoss')}</h1>
                <div style={styles.subtitle}>{getReasonText()}</div>

                <div style={styles.statsContainer}>
                    <div style={styles.statBox}>
                        <span style={styles.statLabel}>{t('multiplayer.you')}</span>
                        <span style={{ ...styles.statValue, color: isWin ? '#4ade80' : undefined }}>
                            {myStats?.time.toFixed(1)}s
                        </span>
                        <span style={styles.statSub}>+{myStats?.points} pts</span>
                    </div>

                    <div style={styles.statBox}>
                        <span style={styles.statLabel}>{opponentName}</span>
                        <span style={{ ...styles.statValue, color: !isWin && !isTie ? '#f43f5e' : undefined }}>
                            {opponentStats?.time.toFixed(1)}s
                        </span>
                        <span style={styles.statSub}>+{opponentStats?.points} pts</span>
                    </div>
                </div>

                <div style={styles.loadingDocs}>
                    <div className="spinner" style={{ width: 16, height: 16, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    {t('multiplayer.nextRound')}
                </div>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
