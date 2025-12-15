import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, User, Ticket, Calendar } from 'lucide-react';

interface TicketInfo {
  ticketNumber: string;
  patient: { firstName: string; lastName: string };
  status: string;
  priority: string;
  createdAt: string;
  isValid: boolean;
  validUntil: string;
  currentStation: string | null;
  queuePosition: number | null;
}

const STATUS_LABELS: Record<string, string> = {
  WAITING: 'En attente',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminé',
  CANCELLED: 'Annulé',
  NO_SHOW: 'Absent',
};

const PRIORITY_LABELS: Record<string, string> = {
  NORMAL: 'Normal',
  ELDERLY: '3ème Âge',
  PREGNANT: 'Femme Enceinte',
  DISABLED: 'Prioritaire',
  EMERGENCY: 'Urgence',
};

const STATION_LABELS: Record<string, string> = {
  TEST_VUE: 'Test de Vue',
  CONSULTATION: 'Consultation',
  LUNETTES: 'Lunettes',
};

export default function TicketVerifyPage() {
  const { qrCode } = useParams<{ qrCode: string }>();
  const [ticket, setTicket] = useState<TicketInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyTicket = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const response = await fetch(`${apiUrl}/tickets/verify/${qrCode}`);
        const data = await response.json();
        
        if (data.success) {
          setTicket(data.data);
        } else {
          setError(data.message || 'Ticket non trouvé');
        }
      } catch (err) {
        setError('Erreur de connexion au serveur');
      } finally {
        setLoading(false);
      }
    };

    if (qrCode) {
      verifyTicket();
    }
  }, [qrCode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification du ticket...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Ticket Invalide</h1>
          <p className="text-gray-600">{error || 'Ce ticket n\'existe pas ou a été annulé.'}</p>
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Code scanné: {qrCode}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      ticket.isValid 
        ? 'bg-gradient-to-br from-green-50 to-green-100' 
        : 'bg-gradient-to-br from-orange-50 to-orange-100'
    }`}>
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl">👁️</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">CAMG-BOPP</h1>
          <p className="text-sm text-gray-500">Dispensaire Ophtalmologique</p>
        </div>

        {/* Statut de validité */}
        <div className={`p-4 rounded-xl mb-6 ${
          ticket.isValid 
            ? 'bg-green-50 border-2 border-green-200' 
            : 'bg-orange-50 border-2 border-orange-200'
        }`}>
          <div className="flex items-center justify-center gap-2">
            {ticket.isValid ? (
              <>
                <CheckCircle className="w-6 h-6 text-green-600" />
                <span className="text-lg font-semibold text-green-700">Ticket Valide</span>
              </>
            ) : (
              <>
                <XCircle className="w-6 h-6 text-orange-600" />
                <span className="text-lg font-semibold text-orange-700">Ticket Expiré</span>
              </>
            )}
          </div>
        </div>

        {/* Numéro de ticket */}
        <div className="text-center mb-6">
          <p className="text-sm text-gray-500 uppercase tracking-wider">Numéro de ticket</p>
          <p className="text-4xl font-bold text-blue-600">{ticket.ticketNumber.split('-').pop()}</p>
          <p className="text-xs text-gray-400 font-mono">{ticket.ticketNumber}</p>
        </div>

        {/* Infos patient */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <User className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Patient</p>
              <p className="font-semibold">{ticket.patient.lastName.toUpperCase()} {ticket.patient.firstName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Ticket className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Statut</p>
              <p className="font-semibold">{STATUS_LABELS[ticket.status] || ticket.status}</p>
            </div>
          </div>

          {ticket.currentStation && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Clock className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-xs text-gray-500">Station actuelle</p>
                <p className="font-semibold text-blue-700">
                  {STATION_LABELS[ticket.currentStation] || ticket.currentStation}
                  {ticket.queuePosition && ` - Position #${ticket.queuePosition}`}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Créé le</p>
              <p className="font-semibold">
                {new Date(ticket.createdAt).toLocaleDateString('fr-FR', {
                  day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
          </div>

          {ticket.priority !== 'NORMAL' && (
            <div className={`p-3 rounded-lg ${
              ticket.priority === 'EMERGENCY' ? 'bg-red-50' :
              ticket.priority === 'PREGNANT' ? 'bg-pink-50' :
              ticket.priority === 'DISABLED' ? 'bg-purple-50' : 'bg-amber-50'
            }`}>
              <p className="text-xs text-gray-500">Priorité</p>
              <p className="font-semibold">{PRIORITY_LABELS[ticket.priority]}</p>
            </div>
          )}
        </div>

        {/* Validité */}
        <div className="text-center text-sm text-gray-500 border-t pt-4">
          <p>Valide jusqu'au {new Date(ticket.validUntil).toLocaleDateString('fr-FR')}</p>
        </div>
      </div>
    </div>
  );
}
