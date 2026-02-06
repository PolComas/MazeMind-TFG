import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type Language, type TranslationKey, TRANSLATIONS } from '../utils/translations';
import { useUser } from './UserContext';
import { fetchCloudLanguage, upsertCloudLanguage } from '../lib/cloudSettings';

type LanguageContextType = {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'mazeMindLanguage';

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguageState] = useState<Language>('ca');
    const { user } = useUser();

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

    useEffect(() => {
        if (!user?.id) return;
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
    }, [user?.id]);

    const setLanguage = (lang: Language) => {
        if (lang === language) return;
        setLanguageState(lang);
        try {
            localStorage.setItem(STORAGE_KEY, lang);
        } catch (e) {
            console.warn('Failed to save language preference', e);
        }
        if (user?.id) {
            upsertCloudLanguage(user.id, lang).catch((e) => {
                console.warn('Failed to persist language preference', e);
            });
        }
    };

    const t = (key: TranslationKey): string => {
        return TRANSLATIONS[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
