import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, User, Ticket, Calendar, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

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

        {/* Bouton télécharger le ticket électronique */}
        <button
          onClick={() => downloadTicket()}
          className="w-full mt-4 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
        >
          <Download className="w-5 h-5" />
          Télécharger mon ticket
        </button>
      </div>
    </div>
  );

  function downloadTicket() {
    if (!ticket) return;
    
    const ticketHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket ${ticket.ticketNumber} - CAMG-BOPP</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Arial, sans-serif; 
      background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .ticket {
      max-width: 350px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      color: white;
      padding: 20px;
      text-align: center;
    }
    .header h1 { font-size: 24px; margin-bottom: 5px; }
    .header p { opacity: 0.9; font-size: 12px; }
    .content { padding: 20px; }
    .ticket-number {
      text-align: center;
      background: #f8fafc;
      border-radius: 12px;
      padding: 15px;
      margin-bottom: 15px;
      border: 2px solid #e2e8f0;
    }
    .ticket-number .label { 
      font-size: 10px; 
      color: #64748b; 
      text-transform: uppercase; 
      letter-spacing: 2px; 
    }
    .ticket-number .number { 
      font-size: 48px; 
      font-weight: bold; 
      color: #1e40af; 
      line-height: 1.2;
    }
    .ticket-number .full { 
      font-size: 12px; 
      color: #94a3b8; 
      font-family: monospace; 
    }
    .info-card {
      background: #f1f5f9;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 10px;
    }
    .info-card .label { font-size: 10px; color: #64748b; text-transform: uppercase; }
    .info-card .value { font-size: 16px; font-weight: 600; color: #1e293b; }
    .priority {
      text-align: center;
      padding: 10px;
      border-radius: 8px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .priority.emergency { background: #fee2e2; color: #b91c1c; border: 2px solid #ef4444; }
    .priority.pregnant { background: #fce7f3; color: #be185d; border: 2px solid #ec4899; }
    .priority.disabled { background: #ede9fe; color: #6d28d9; border: 2px solid #8b5cf6; }
    .priority.elderly { background: #fef3c7; color: #b45309; border: 2px solid #f59e0b; }
    .valid {
      text-align: center;
      padding: 15px;
      background: ${ticket.isValid ? '#dcfce7' : '#fef3c7'};
      border: 2px solid ${ticket.isValid ? '#22c55e' : '#f59e0b'};
      border-radius: 12px;
      margin-bottom: 15px;
    }
    .valid .icon { font-size: 24px; }
    .valid .text { font-weight: 600; color: ${ticket.isValid ? '#15803d' : '#b45309'}; }
    .qr-section {
      text-align: center;
      padding: 15px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      margin-bottom: 15px;
    }
    .qr-section img { max-width: 120px; }
    .qr-section p { font-size: 10px; color: #94a3b8; margin-top: 5px; }
    .footer {
      text-align: center;
      padding: 15px;
      border-top: 1px dashed #e2e8f0;
      font-size: 12px;
      color: #64748b;
    }
    .validity-date {
      text-align: center;
      font-size: 12px;
      color: #64748b;
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="header">
      <h1>👁️ CAMG-BOPP</h1>
      <p>Dispensaire Ophtalmologique</p>
    </div>
    <div class="content">
      <div class="valid">
        <div class="icon">${ticket.isValid ? '✅' : '⚠️'}</div>
        <div class="text">${ticket.isValid ? 'Ticket Valide' : 'Ticket Expiré'}</div>
      </div>
      
      <div class="ticket-number">
        <div class="label">Votre numéro</div>
        <div class="number">${ticket.ticketNumber.split('-').pop()}</div>
        <div class="full">${ticket.ticketNumber}</div>
      </div>
      
      ${ticket.priority !== 'NORMAL' ? `
      <div class="priority ${ticket.priority.toLowerCase()}">
        ${ticket.priority === 'EMERGENCY' ? '🚨 Urgence' : 
          ticket.priority === 'PREGNANT' ? '🤰 Femme Enceinte' : 
          ticket.priority === 'DISABLED' ? '♿ Prioritaire' : '👴 3ème Âge'}
      </div>
      ` : ''}
      
      <div class="info-card">
        <div class="label">Patient</div>
        <div class="value">${ticket.patient.lastName.toUpperCase()} ${ticket.patient.firstName}</div>
      </div>
      
      <div class="info-card">
        <div class="label">Statut</div>
        <div class="value">${STATUS_LABELS[ticket.status] || ticket.status}</div>
      </div>
      
      ${ticket.currentStation ? `
      <div class="info-card" style="background: #dbeafe;">
        <div class="label">Station actuelle</div>
        <div class="value" style="color: #1e40af;">${STATION_LABELS[ticket.currentStation] || ticket.currentStation}${ticket.queuePosition ? ` - Position #${ticket.queuePosition}` : ''}</div>
      </div>
      ` : ''}
      
      <div class="info-card">
        <div class="label">Créé le</div>
        <div class="value">${new Date(ticket.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
      </div>
      
      <div class="validity-date">
        ⏰ Valide jusqu'au ${new Date(ticket.validUntil).toLocaleDateString('fr-FR')}
      </div>
      
      <div class="qr-section">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(window.location.href)}" alt="QR Code" />
        <p>Scanner pour vérification</p>
      </div>
      
      <div class="footer">
        ✨ Merci de votre confiance ✨<br/>
        www.camg-bopp.sn
      </div>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([ticketHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-${ticket.ticketNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
