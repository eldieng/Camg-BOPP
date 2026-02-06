/**
 * Job de keep-alive pour éviter le cold start de Render (plan gratuit)
 * Ping le serveur toutes les 14 minutes pour le garder éveillé
 */

let keepAliveInterval: NodeJS.Timeout | null = null;

export function startKeepAliveJob(): void {
  const appUrl = process.env.RENDER_EXTERNAL_URL || process.env.APP_URL;
  
  if (!appUrl) {
    console.log('[KeepAlive] Pas d\'URL configurée - job désactivé (local)');
    return;
  }

  const pingUrl = `${appUrl}/api/health`;
  const intervalMs = 14 * 60 * 1000; // 14 minutes

  console.log(`[KeepAlive] Ping automatique activé: ${pingUrl} toutes les 14 min`);

  keepAliveInterval = setInterval(async () => {
    try {
      const response = await fetch(pingUrl);
      if (response.ok) {
        console.log(`[KeepAlive] Ping OK - ${new Date().toLocaleTimeString()}`);
      } else {
        console.warn(`[KeepAlive] Ping échoué: ${response.status}`);
      }
    } catch (error) {
      console.warn('[KeepAlive] Erreur de ping:', error);
    }
  }, intervalMs);
}

export function stopKeepAliveJob(): void {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
    console.log('[KeepAlive] Job arrêté');
  }
}
