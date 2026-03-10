import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type Language, type TranslationKey, TRANSLATIONS } from '../utils/translations';
import { useUser } from './UserContext';
import { fetchCloudLanguage, upsertCloudLanguage } from '../lib/cloudSettings';

/**
 * Context d'idioma i traduccions.
 *
 * Responsabilitats:
 * - mantenir idioma actiu de sessió
 * - persistència local immediata
 * - sincronització cloud per usuaris autenticats
 * - exposar helper `t(key)` per accés a catàleg
 */
type LanguageContextType = {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'mazeMindLanguage';

/** Proveïdor d'idioma global. */
export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguageState] = useState<Language>('ca');
    const { user } = useUser();

    // Hidrata preferència local en arrencada.
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved && (saved === 'ca' || saved === 'es' || saved === 'en')) {
                setLanguageState(saved as Language);
            }
        } catch (e) {
            console.warn('Failed to load language preference', e);
        }
    }, []);

    // Hidrata preferència cloud quan hi ha usuari autenticat no guest.
    useEffect(() => {
        if (!user?.id || user.isGuest) return;
        let canceled = false;

        const hydrate = async () => {
            try {
                const cloudLang = await fetchCloudLanguage(user.id);
                if (canceled) return;
                if (cloudLang) {
                    setLanguageState(cloudLang);
                    try {
                        localStorage.setItem(STORAGE_KEY, cloudLang);
                    } catch (e) {
                        console.warn('Failed to save language preference', e);
                    }
                } else {
                    // Si el núvol no té idioma, publiquem la preferència local actual.
                    let preferred: Language = language;
                    try {
                        const saved = localStorage.getItem(STORAGE_KEY);
                        if (saved === 'ca' || saved === 'es' || saved === 'en') {
                            preferred = saved as Language;
                        }
                    } catch (e) {
                        console.warn('Failed to read language preference', e);
                    }
                    await upsertCloudLanguage(user.id, preferred);
                    setLanguageState(preferred);
                }
            } catch (e) {
                console.warn('Failed to load cloud language preference', e);
            }
        };

        void hydrate();
        return () => {
            canceled = true;
        };
    }, [user?.id, user?.isGuest]);

    /** Actualitza idioma actiu i el persisteix local/cloud segons context d'usuari. */
    const setLanguage = (lang: Language) => {
        if (lang === language) return;
        setLanguageState(lang);
        try {
            localStorage.setItem(STORAGE_KEY, lang);
        } catch (e) {
            console.warn('Failed to save language preference', e);
        }
        if (user?.id && !user.isGuest) {
            upsertCloudLanguage(user.id, lang).catch((e) => {
                console.warn('Failed to persist language preference', e);
            });
        }
    };

    /** Resol una clau de traducció amb fallback a la clau si no existeix. */
    const t = (key: TranslationKey): string => {
        return TRANSLATIONS[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

/** Hook d'accés segur al context d'idioma. */
export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
