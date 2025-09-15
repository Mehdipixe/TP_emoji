// supabaseClient.js - Version corrigée avec attente du chargement
// Ce module initialise et exporte le client Supabase

// Fonction pour attendre que la bibliothèque soit chargée
function waitForSupabaseLibrary() {
    return new Promise((resolve, reject) => {
        // Si déjà chargée, résoudre immédiatement
        if (typeof window.supabase !== 'undefined') {
            console.log('✅ Bibliothèque Supabase déjà chargée');
            resolve();
            return;
        }
        
        console.log('⏳ Attente du chargement de la bibliothèque Supabase...');
        
        let attempts = 0;
        const maxAttempts = 50; // 5 secondes maximum
        
        const checkInterval = setInterval(() => {
            attempts++;
            
            if (typeof window.supabase !== 'undefined') {
                clearInterval(checkInterval);
                console.log('✅ Bibliothèque Supabase chargée avec succès');
                resolve();
            } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                console.error('❌ Timeout: Bibliothèque Supabase non chargée après 5 secondes');
                reject(new Error('Timeout: Bibliothèque Supabase non chargée. Vérifiez que le script CDN est accessible.'));
            }
        }, 100); // Vérifier toutes les 100ms
    });
}

// Fonction pour attendre que la configuration soit disponible
function waitForConfig() {
    return new Promise((resolve, reject) => {
        // Si déjà disponible, résoudre immédiatement
        if (window.PRIVATE_CONFIG?.supabaseUrl && window.PRIVATE_CONFIG?.supabaseAnonKey) {
            console.log('✅ Configuration Supabase déjà disponible');
            resolve();
            return;
        }
        
        console.log('⏳ Attente de la configuration Supabase...');
        
        let attempts = 0;
        const maxAttempts = 30; // 3 secondes maximum
        
        const checkInterval = setInterval(() => {
            attempts++;
            
            if (window.PRIVATE_CONFIG?.supabaseUrl && window.PRIVATE_CONFIG?.supabaseAnonKey) {
                clearInterval(checkInterval);
                console.log('✅ Configuration Supabase chargée avec succès');
                resolve();
            } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                console.error('❌ Timeout: Configuration Supabase manquante après 3 secondes');
                reject(new Error('Configuration Supabase manquante. Vérifiez que private-config.js est bien injecté.'));
            }
        }, 100); // Vérifier toutes les 100ms
    });
}

// Fonction principale pour obtenir le client Supabase
export async function getSupabaseClient() {
    try {
        console.log('🔧 Initialisation du client Supabase via module...');

        // 1. Attendre que la configuration soit disponible
        await waitForConfig().catch((err) => {
            console.error('❌ Configuration Supabase indisponible :', err);
        });

        // 2. Attendre que la bibliothèque Supabase soit chargée
        await waitForSupabaseLibrary().catch((err) => {
            console.error('❌ Bibliothèque Supabase indisponible :', err);
        });

        // 3. Vérifier que la configuration est valide
        if (!window.PRIVATE_CONFIG || !window.PRIVATE_CONFIG.supabaseUrl || !window.PRIVATE_CONFIG.supabaseAnonKey) {
            console.warn('⚠️ Configuration Supabase invalide ou manquante. Un client factice sera retourné.');
            return {
                from: () => ({ select: () => Promise.resolve({ data: [], error: 'Configuration Supabase manquante.' }) }),
                // Ajoute d'autres méthodes factices si besoin
            };
        }

        // 4. Vérifier que la bibliothèque est accessible
        if (!window.supabase || typeof window.supabase.createClient !== 'function') {
            console.warn('⚠️ Bibliothèque Supabase non accessible ou createClient manquant. Un client factice sera retourné.');
            return {
                from: () => ({ select: () => Promise.resolve({ data: [], error: 'Bibliothèque Supabase non chargée.' }) }),
                // Ajoute d'autres méthodes factices si besoin
            };
        }

        console.log('🔗 Création du client Supabase...');
        console.log('📡 URL:', window.PRIVATE_CONFIG.supabaseUrl);

        // 5. Créer et retourner le client
        const { createClient } = window.supabase;
        const client = createClient(
            window.PRIVATE_CONFIG.supabaseUrl,
            window.PRIVATE_CONFIG.supabaseAnonKey
        );

        console.log('✅ Client Supabase créé avec succès via module');
        return client;

    } catch (error) {
        console.error('❌ Erreur lors de la création du client Supabase:', error);
        // Retourne un client factice pour éviter toute erreur bloquante
        return {
            from: () => ({ select: () => Promise.resolve({ data: [], error: 'Erreur lors de la création du client Supabase.' }) }),
        };
    }
}

// Fonction utilitaire pour vérifier l'état
export function checkSupabaseStatus() {
    return {
        libraryLoaded: typeof window.supabase !== 'undefined',
        configAvailable: !!(window.PRIVATE_CONFIG?.supabaseUrl && window.PRIVATE_CONFIG?.supabaseAnonKey),
        createClientAvailable: typeof window.supabase?.createClient === 'function'
    };
}

// Logs de débogage
console.log('📦 Module supabaseClient.js chargé');
console.log('🔍 État initial:', checkSupabaseStatus());