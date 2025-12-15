import { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

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

// Composant pour impression thermique (80mm) - Design moderne
const TicketPrint = forwardRef<HTMLDivElement, TicketPrintProps>(({ ticket }, ref) => {
  const ticketDate = new Date(ticket.createdAt);
  const birthDate = new Date(ticket.patient.dateOfBirth);
  const age = new Date().getFullYear() - birthDate.getFullYear();

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
        width: '80mm',
        padding: '4mm',
        fontFamily: "'Segoe UI', Arial, sans-serif",
        fontSize: '11px',
        backgroundColor: 'white',
        color: '#1f2937',
      }}
    >
      {/* En-tête avec logo stylisé */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '4mm', 
        background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
        padding: '4mm',
        borderRadius: '3mm',
        color: 'white'
      }}>
        <div style={{ fontSize: '20px', marginBottom: '1mm' }}>👁️</div>
        <div style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '1px' }}>CAMG-BOPP</div>
        <div style={{ fontSize: '9px', opacity: 0.9 }}>Dispensaire Ophtalmologique</div>
      </div>

      {/* Numéro de ticket - Design moderne */}
      <div style={{ 
        textAlign: 'center', 
        margin: '4mm 0',
        padding: '4mm',
        background: '#f8fafc',
        borderRadius: '3mm',
        border: '2px solid #e2e8f0'
      }}>
        <div style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '2px' }}>
          Votre numéro
        </div>
        <div style={{ 
          fontSize: '48px', 
          fontWeight: 'bold', 
          color: '#1e40af',
          lineHeight: 1.1,
          margin: '2mm 0'
        }}>
          {ticket.ticketNumber.split('-').pop()}
        </div>
        <div style={{ 
          fontSize: '10px', 
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
          padding: '3mm',
          margin: '3mm 0',
          backgroundColor: priorityStyle.bg,
          border: `2px solid ${priorityStyle.border}`,
          borderRadius: '2mm',
          color: priorityStyle.text,
          fontWeight: 'bold',
          fontSize: '12px',
        }}>
          {priorityStyle.icon} {PRIORITY_LABELS[ticket.priority]}
        </div>
      )}

      {/* Informations patient - Card style */}
      <div style={{ 
        background: '#f1f5f9',
        borderRadius: '2mm',
        padding: '3mm',
        margin: '3mm 0'
      }}>
        <div style={{ 
          fontSize: '8px', 
          color: '#64748b', 
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '1mm'
        }}>
          Patient
        </div>
        <div style={{ 
          fontSize: '14px', 
          fontWeight: 'bold',
          color: '#1e293b'
        }}>
          {ticket.patient.lastName.toUpperCase()} {ticket.patient.firstName}
        </div>
        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '1mm' }}>
          {age} ans
        </div>
      </div>

      {/* QR Code avec cadre */}
      <div style={{ 
        textAlign: 'center', 
        margin: '4mm 0',
        padding: '3mm',
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '2mm'
      }}>
        <QRCodeSVG
          value={ticket.qrCode}
          size={80}
          level="M"
          includeMargin={false}
        />
        <div style={{ fontSize: '7px', marginTop: '2mm', color: '#94a3b8' }}>
          Scanner pour vérification
        </div>
      </div>

      {/* Date et heure - Style badge */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '2mm',
        margin: '3mm 0'
      }}>
        <div style={{
          background: '#dbeafe',
          padding: '2mm 3mm',
          borderRadius: '2mm',
          fontSize: '9px',
          color: '#1e40af'
        }}>
          📅 {ticketDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
        </div>
        <div style={{
          background: '#dbeafe',
          padding: '2mm 3mm',
          borderRadius: '2mm',
          fontSize: '9px',
          color: '#1e40af',
          fontWeight: 'bold'
        }}>
          🕐 {ticketDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Instructions - Design moderne */}
      <div style={{
        margin: '3mm 0',
        padding: '3mm',
        background: '#fef3c7',
        borderRadius: '2mm',
        fontSize: '8px',
        borderLeft: '3px solid #f59e0b'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '2mm', color: '#92400e' }}>📋 INSTRUCTIONS</div>
        <div style={{ color: '#78350f' }}>• Gardez ce ticket précieusement</div>
        <div style={{ color: '#78350f' }}>• Surveillez l'écran d'appel</div>
        <div style={{ color: '#78350f' }}>• Présentez-vous au guichet indiqué</div>
      </div>

      {/* Validité */}
      <div style={{ 
        textAlign: 'center', 
        fontSize: '7px', 
        color: '#94a3b8',
        margin: '2mm 0'
      }}>
        ⏰ Ticket valable pour la journée uniquement
      </div>

      {/* Pied de page élégant */}
      <div style={{
        marginTop: '3mm',
        paddingTop: '3mm',
        borderTop: '1px dashed #cbd5e1',
        textAlign: 'center',
        fontSize: '8px',
        color: '#64748b'
      }}>
        <div style={{ marginBottom: '1mm' }}>✨ Merci de votre confiance ✨</div>
        <div style={{ fontWeight: 'bold' }}>www.camg-bopp.sn</div>
      </div>
    </div>
  );
});

TicketPrint.displayName = 'TicketPrint';

export default TicketPrint;
