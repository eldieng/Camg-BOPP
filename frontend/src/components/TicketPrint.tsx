import { forwardRef } from 'react';

interface TicketPrintProps {
  ticket: {
    ticketNumber: string;
    qrCode: string;
    priority: string;
    createdAt: string;
    patient: {
      firstName: string;
      lastName: string;
      dateOfBirth: string;
    };
  };
}

const PRIORITY_LABELS: Record<string, string> = {
  NORMAL: 'Normal',
  ELDERLY: '3ème Âge',
  PREGNANT: 'Femme Enceinte',
  DISABLED: 'Prioritaire',
  EMERGENCY: 'Urgence',
};

// Composant pour impression thermique (58mm) - Design moderne
const TicketPrint = forwardRef<HTMLDivElement, TicketPrintProps>(({ ticket }, ref) => {
  const ticketDate = new Date(ticket.createdAt);
  const birthDate = new Date(ticket.patient.dateOfBirth);
  const age = new Date().getFullYear() - birthDate.getFullYear();
  
  // URL de base pour le QR code - utilise l'URL actuelle ou l'URL de production
  const baseUrl = typeof window !== 'undefined' && window.location.origin 
    ? window.location.origin 
    : 'https://camg-bopp.netlify.app';
  const qrCodeUrl = `${baseUrl}/ticket/${ticket.qrCode}`;

  const getPriorityStyle = () => {
    switch (ticket.priority) {
      case 'EMERGENCY': return { bg: '#fee2e2', border: '#ef4444', text: '#b91c1c', icon: '🚨' };
      case 'PREGNANT': return { bg: '#fce7f3', border: '#ec4899', text: '#be185d', icon: '🤰' };
      case 'DISABLED': return { bg: '#ede9fe', border: '#8b5cf6', text: '#6d28d9', icon: '♿' };
      case 'ELDERLY': return { bg: '#fef3c7', border: '#f59e0b', text: '#b45309', icon: '👴' };
      default: return null;
    }
  };

  const priorityStyle = getPriorityStyle();

  return (
    <div
      ref={ref}
      className="ticket-print"
      style={{
        width: '58mm', // Taille réduite pour imprimantes thermiques 58mm
        padding: '2mm',
        fontFamily: "'Segoe UI', Arial, sans-serif",
        fontSize: '9px',
        backgroundColor: 'white',
        color: '#1f2937',
      }}
    >
      {/* En-tête avec logo stylisé */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '2mm', 
        background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
        padding: '2mm',
        borderRadius: '2mm',
        color: 'white'
      }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>👁️ CAMG-BOPP</div>
        <div style={{ fontSize: '7px', opacity: 0.9 }}>Dispensaire Ophtalmologique</div>
      </div>

      {/* Numéro de ticket - Design moderne */}
      <div style={{ 
        textAlign: 'center', 
        margin: '2mm 0',
        padding: '2mm',
        background: '#f8fafc',
        borderRadius: '2mm',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ fontSize: '7px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Votre numéro
        </div>
        <div style={{ 
          fontSize: '32px', 
          fontWeight: 'bold', 
          color: '#1e40af',
          lineHeight: 1.1,
          margin: '1mm 0'
        }}>
          {ticket.ticketNumber.split('-').pop()}
        </div>
        <div style={{ 
          fontSize: '8px', 
          color: '#94a3b8',
          fontFamily: 'monospace'
        }}>
          {ticket.ticketNumber}
        </div>
      </div>

      {/* Priorité si applicable - Design coloré */}
      {priorityStyle && (
        <div style={{
          textAlign: 'center',
          padding: '1mm',
          margin: '1mm 0',
          backgroundColor: priorityStyle.bg,
          border: `1px solid ${priorityStyle.border}`,
          borderRadius: '1mm',
          color: priorityStyle.text,
          fontWeight: 'bold',
          fontSize: '9px',
        }}>
          {priorityStyle.icon} {PRIORITY_LABELS[ticket.priority]}
        </div>
      )}

      {/* Informations patient - Card style */}
      <div style={{ 
        background: '#f1f5f9',
        borderRadius: '1mm',
        padding: '2mm',
        margin: '2mm 0'
      }}>
        <div style={{ 
          fontSize: '7px', 
          color: '#64748b', 
          textTransform: 'uppercase'
        }}>
          Patient
        </div>
        <div style={{ 
          fontSize: '11px', 
          fontWeight: 'bold',
          color: '#1e293b'
        }}>
          {ticket.patient.lastName.toUpperCase()} {ticket.patient.firstName}
        </div>
        <div style={{ fontSize: '8px', color: '#64748b' }}>
          {age} ans
        </div>
      </div>

      {/* QR Code avec cadre - pointe vers l'URL de vérification */}
      <div style={{ 
        textAlign: 'center', 
        margin: '2mm 0',
        padding: '1mm',
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '1mm'
      }}>
        {/* Utiliser une API externe pour générer le QR code en image (fonctionne mieux à l'impression) */}
        <img 
          src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(qrCodeUrl)}`}
          alt="QR Code"
          style={{ width: '60px', height: '60px' }}
        />
        <div style={{ fontSize: '6px', marginTop: '1mm', color: '#94a3b8' }}>
          Scanner pour vérification
        </div>
      </div>

      {/* Date et heure - Style badge */}
      <div style={{ 
        textAlign: 'center',
        margin: '2mm 0',
        fontSize: '8px',
        color: '#1e40af'
      }}>
        📅 {ticketDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} 🕐 {ticketDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
      </div>

      {/* Instructions - Design moderne */}
      <div style={{
        margin: '1mm 0',
        padding: '1mm',
        background: '#fef3c7',
        borderRadius: '1mm',
        fontSize: '6px',
        borderLeft: '2px solid #f59e0b'
      }}>
        <div style={{ fontWeight: 'bold', color: '#92400e' }}>📋 Gardez ce ticket • Surveillez l'écran</div>
      </div>

      {/* Validité */}
      <div style={{ 
        textAlign: 'center', 
        fontSize: '6px', 
        color: '#94a3b8',
        margin: '1mm 0'
      }}>
        ⏰ Valable 10 jours
      </div>

      {/* Pied de page élégant */}
      <div style={{
        marginTop: '1mm',
        paddingTop: '1mm',
        borderTop: '1px dashed #cbd5e1',
        textAlign: 'center',
        fontSize: '6px',
        color: '#64748b'
      }}>
        ✨ Merci • www.camg-bopp.sn
      </div>
    </div>
  );
});

TicketPrint.displayName = 'TicketPrint';

export default TicketPrint;
