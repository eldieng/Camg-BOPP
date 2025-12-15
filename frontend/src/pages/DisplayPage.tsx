import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Maximize, Clock } from 'lucide-react';

interface QueueDisplay {
  station: string;
  stationLabel: string;
  currentNumber: string | null;
  currentPatient: string | null;
  waitingCount: number;
  nextNumbers: string[];
}

interface Announcement {
  ticketNumber: string;
  station: string;
  stationLabel: string;
  patientName: string;
  timestamp: number;
}

const STATION_LABELS: Record<string, string> = {
  TEST_VUE: 'Test de Vue',
  CONSULTATION_1: 'Consultation 1',
  CONSULTATION_2: 'Consultation 2',
  LUNETTES: 'Salle des Lunettes',
};

const STATION_VOICE_LABELS: Record<string, string> = {
  TEST_VUE: 'salle de Test de Vue',
  CONSULTATION_1: 'salle de Consultation numéro 1',
  CONSULTATION_2: 'salle de Consultation numéro 2',
  LUNETTES: 'salle des Lunettes',
};

const STATION_COLORS: Record<string, string> = {
  TEST_VUE: 'from-blue-500 to-blue-600',
  CONSULTATION_1: 'from-green-500 to-green-600',
  CONSULTATION_2: 'from-teal-500 to-teal-600',
  LUNETTES: 'from-purple-500 to-purple-600',
};

export default function DisplayPage() {
  const [queues, setQueues] = useState<QueueDisplay[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);
  const previousQueuesRef = useRef<Map<string, string | null>>(new Map());
  const soundEnabledRef = useRef(true);
  const audioUnlockedRef = useRef(false);

  // Test de la synthèse vocale
  const testVoice = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(
        'Test du système d\'annonce. Ticket numéro 1, veuillez vous présenter au guichet.'
      );
      utterance.lang = 'fr-FR';
      utterance.rate = 0.9;
      utterance.volume = 1;
      speechSynthesis.speak(utterance);
    } else {
      alert('La synthèse vocale n\'est pas supportée par ce navigateur');
    }
  };

  const unlockAudio = async () => {
    try {
      // 1) Débloquer l'audio via Web Audio API (pas de fichier requis)
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioContextRef.current.state !== 'running') {
        await audioContextRef.current.resume();
      }

      // Petit beep très court pour valider que l'audio est débloqué
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.value = 0.001;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);

      // 2) Débloquer speechSynthesis (nécessite souvent un geste utilisateur)
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance('Activation du son');
        utterance.lang = 'fr-FR';
        utterance.rate = 1;
        speechSynthesis.speak(utterance);
      }

      setAudioUnlocked(true);
      audioUnlockedRef.current = true;
      setSoundEnabled(true);
      soundEnabledRef.current = true;
    } catch (e) {
      console.error('Impossible de débloquer le son:', e);
    }
  };

  // Charger les données des files d'attente
  const loadQueues = async () => {
    try {
      const stations = ['TEST_VUE', 'CONSULTATION_1', 'CONSULTATION_2', 'LUNETTES'];
      const queueData: QueueDisplay[] = [];

      for (const station of stations) {
        try {
          // Utiliser la route publique /display/ sans authentification
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
          const response = await fetch(`${apiUrl}/queue/display/${station}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              const { queue, stats } = data.data;
              
              // Trouver le patient appelé ou en service (priorité à CALLED pour l'annonce)
              const called = queue.find((q: any) => q.status === 'CALLED');
              const inService = called || queue.find((q: any) => q.status === 'IN_SERVICE');
              const waiting = queue.filter((q: any) => q.status === 'WAITING');
              
              queueData.push({
                station,
                stationLabel: STATION_LABELS[station],
                currentNumber: inService?.ticket?.ticketNumber || null,
                currentPatient: inService ? `${inService.ticket.patient.firstName} ${inService.ticket.patient.lastName}` : null,
                waitingCount: stats.waiting,
                nextNumbers: waiting.slice(0, 5).map((q: any) => q.ticket.ticketNumber),
              });

              // Vérifier s'il y a un nouveau patient en cours (changement)
              const previousPatient = previousQueuesRef.current.get(station);
              const currentPatient = inService?.ticket?.ticketNumber || null;
              
              if (currentPatient && currentPatient !== previousPatient) {
                // Nouveau patient détecté - déclencher l'annonce
                triggerAnnouncement({
                  ticketNumber: inService.ticket.ticketNumber,
                  station,
                  stationLabel: STATION_LABELS[station],
                  patientName: `${inService.ticket.patient.firstName} ${inService.ticket.patient.lastName}`,
                  timestamp: Date.now(),
                });
              }
              
              // Mettre à jour le tracking
              previousQueuesRef.current.set(station, currentPatient);
            }
          }
        } catch (err) {
          console.error(`Erreur chargement queue ${station}:`, err);
        }
      }

      setQueues(queueData);
    } catch (err) {
      console.error('Erreur chargement queues:', err);
    }
  };

  // Déclencher une annonce
  const triggerAnnouncement = (ann: Announcement) => {
    setAnnouncement(ann);
    
    // Jouer le son (utiliser les refs pour avoir les valeurs actuelles)
    if (soundEnabledRef.current && audioUnlockedRef.current && audioContextRef.current) {
      try {
        const ctx = audioContextRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = 1000;
        gain.gain.value = 0.02;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } catch {
        // ignore
      }
    }

    // Synthèse vocale (utiliser les refs pour avoir les valeurs actuelles)
    if (soundEnabledRef.current && audioUnlockedRef.current && 'speechSynthesis' in window) {
      const voiceLabel = STATION_VOICE_LABELS[ann.station] || ann.stationLabel;
      const utterance = new SpeechSynthesisUtterance(
        `Ticket numéro ${ann.ticketNumber.split('-').pop()}, ${ann.patientName}, veuillez vous présenter à la ${voiceLabel}`
      );
      utterance.lang = 'fr-FR';
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }

    // Masquer l'annonce après 10 secondes
    setTimeout(() => {
      setAnnouncement(null);
    }, 10000);
  };

  // Basculer en plein écran
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // Mise à jour de l'heure
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Charger les données toutes les 5 secondes
  useEffect(() => {
    loadQueues();
    const interval = setInterval(loadQueues, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white' 
        : 'bg-gradient-to-br from-gray-100 via-white to-gray-100 text-gray-900'
    }`}>
      {!audioUnlocked && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl">
            <div className="text-6xl mb-4">🔊</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Activer les annonces vocales</h2>
            <p className="text-gray-600 mb-6">
              Pour que les patients soient appelés vocalement, vous devez activer le son une seule fois.
            </p>
            <button
              onClick={unlockAudio}
              className="w-full px-6 py-4 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-xl transition-colors"
            >
              🔈 Activer le son
            </button>
            <p className="text-xs text-gray-400 mt-4">
              Cette action est requise par les navigateurs pour des raisons de sécurité.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center">
            <span className="text-3xl">👁️</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold">CAMG-BOPP</h1>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Dispensaire Ophtalmologique</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Heure */}
          <div className={`flex items-center gap-2 text-4xl font-mono px-6 py-3 rounded-xl ${
            darkMode ? 'bg-gray-800' : 'bg-white shadow-lg'
          }`}>
            <Clock className={`w-8 h-8 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </div>

          {/* Contrôles */}
          <button
            onClick={testVoice}
            className="p-3 rounded-xl bg-blue-600 hover:bg-blue-500"
            title="Tester le son"
          >
            🔊 Test
          </button>

          {!audioUnlocked && (
            <button
              onClick={unlockAudio}
              className="p-3 rounded-xl bg-red-600 hover:bg-red-500 font-semibold"
              title="Activer le son (obligatoire sur certains navigateurs)"
            >
              Activer le son
            </button>
          )}

          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              soundEnabledRef.current = !soundEnabled;
            }}
            className={`p-3 rounded-xl ${soundEnabled ? 'bg-green-600' : 'bg-gray-700'} ${!audioUnlocked ? 'opacity-60 cursor-not-allowed' : ''}`}
            title={soundEnabled ? 'Son activé' : 'Son désactivé'}
            disabled={!audioUnlocked}
          >
            {soundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
          </button>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-3 rounded-xl ${darkMode ? 'bg-yellow-500 hover:bg-yellow-400' : 'bg-gray-800 hover:bg-gray-700'}`}
            title={darkMode ? 'Mode clair' : 'Mode sombre'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>

          <button
            onClick={toggleFullscreen}
            className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-300 hover:bg-gray-400'}`}
            title="Plein écran"
          >
            <Maximize className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Annonce en cours */}
      {announcement && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-pulse">
          <div className="bg-gradient-to-br from-yellow-500 to-orange-600 p-12 rounded-3xl text-center max-w-3xl mx-4 shadow-2xl">
            <div className="text-2xl mb-4 text-yellow-100">🔔 APPEL</div>
            <div className="text-8xl font-bold mb-6">{announcement.ticketNumber.split('-').pop()}</div>
            <div className="text-4xl font-semibold mb-4">{announcement.patientName}</div>
            <div className="text-2xl text-yellow-100">
              Veuillez vous présenter au <span className="font-bold">{announcement.stationLabel}</span>
            </div>
          </div>
        </div>
      )}

      {/* Grille des stations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {queues.map((queue) => (
          <div
            key={queue.station}
            className={`bg-gradient-to-br ${STATION_COLORS[queue.station]} rounded-2xl p-6 shadow-xl`}
          >
            {/* Titre station */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">{queue.stationLabel}</h2>
              <p className="text-white/70">{queue.waitingCount} en attente</p>
            </div>

            {/* Numéro actuel */}
            <div className="bg-white/20 backdrop-blur rounded-xl p-6 mb-6">
              <div className="text-center">
                <p className="text-sm uppercase tracking-wider text-white/70 mb-2">En cours</p>
                {queue.currentNumber ? (
                  <>
                    <div className="text-6xl font-bold mb-2">
                      {queue.currentNumber.split('-').pop()}
                    </div>
                    <div className="text-lg text-white/90">{queue.currentPatient}</div>
                  </>
                ) : (
                  <div className="text-3xl text-white/50">—</div>
                )}
              </div>
            </div>

            {/* Prochains numéros */}
            <div>
              <p className="text-sm uppercase tracking-wider text-white/70 mb-3">Prochains</p>
              <div className="space-y-2">
                {queue.nextNumbers.length > 0 ? (
                  queue.nextNumbers.map((num, idx) => (
                    <div
                      key={num}
                      className={`bg-white/10 rounded-lg px-4 py-2 flex items-center justify-between ${
                        idx === 0 ? 'bg-white/20 font-semibold' : ''
                      }`}
                    >
                      <span className="text-white/60">#{idx + 1}</span>
                      <span className="text-xl">{num.split('-').pop()}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-white/50 py-4">Aucun patient en attente</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bandeau d'information */}
      <div className="mt-8 bg-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-center gap-8 text-gray-400">
          <span>📍 Dispensaire Ophtalmologique CAMG-BOPP</span>
          <span>•</span>
          <span>🕐 {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          <span>•</span>
          <span>👴 Priorité aux personnes âgées, femmes enceintes et personnes handicapées</span>
        </div>
      </div>

      {/* Message de priorité */}
      <div className="mt-4 text-center">
        <div className="inline-flex items-center gap-4 bg-yellow-500/20 text-yellow-400 px-6 py-3 rounded-xl">
          <span className="text-2xl">⚠️</span>
          <span className="text-lg">Les personnes âgées, femmes enceintes et personnes à mobilité réduite sont prioritaires</span>
        </div>
      </div>
    </div>
  );
}
