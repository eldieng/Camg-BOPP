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

// Composant pour impression thermique (80mm)
const TicketPrint = forwardRef<HTMLDivElement, TicketPrintProps>(({ ticket }, ref) => {
  const ticketDate = new Date(ticket.createdAt);
  const birthDate = new Date(ticket.patient.dateOfBirth);
  const age = new Date().getFullYear() - birthDate.getFullYear();

  return (
    <div
      ref={ref}
      className="ticket-print"
      style={{
        width: '80mm',
        padding: '5mm',
        fontFamily: 'monospace',
        fontSize: '12px',
        backgroundColor: 'white',
        color: 'black',
      }}
    >
      {/* En-tête */}
      <div style={{ textAlign: 'center', marginBottom: '3mm', borderBottom: '1px dashed black', paddingBottom: '3mm' }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>CAMG-BOPP</div>
        <div style={{ fontSize: '10px' }}>Dispensaire Ophtalmologique</div>
        <div style={{ fontSize: '9px', marginTop: '1mm' }}>Dakar, Sénégal</div>
      </div>

      {/* Numéro de ticket - GRAND */}
      <div style={{ textAlign: 'center', margin: '5mm 0' }}>
        <div style={{ fontSize: '10px', marginBottom: '2mm' }}>TICKET N°</div>
        <div style={{ fontSize: '32px', fontWeight: 'bold', letterSpacing: '2px' }}>
          {ticket.ticketNumber.split('-').pop()}
        </div>
        <div style={{ fontSize: '9px', color: '#666' }}>{ticket.ticketNumber}</div>
      </div>

      {/* Priorité si applicable */}
      {ticket.priority !== 'NORMAL' && (
        <div style={{
          textAlign: 'center',
          padding: '2mm',
          margin: '3mm 0',
          border: '2px solid black',
          fontWeight: 'bold',
          fontSize: '14px',
        }}>
          ⚠️ {PRIORITY_LABELS[ticket.priority]}
        </div>
      )}

      {/* Informations patient */}
      <div style={{ borderTop: '1px dashed black', borderBottom: '1px dashed black', padding: '3mm 0', margin: '3mm 0' }}>
        <div style={{ marginBottom: '2mm' }}>
          <span style={{ fontWeight: 'bold' }}>Patient:</span>
          <div style={{ fontSize: '14px' }}>{ticket.patient.firstName} {ticket.patient.lastName}</div>
        </div>
        <div>
          <span style={{ fontWeight: 'bold' }}>Âge:</span> {age} ans
        </div>
      </div>

      {/* QR Code */}
      <div style={{ textAlign: 'center', margin: '5mm 0' }}>
        <QRCodeSVG
          value={ticket.qrCode}
          size={100}
          level="M"
          includeMargin={false}
        />
        <div style={{ fontSize: '8px', marginTop: '2mm', color: '#666' }}>
          Scanner pour vérification
        </div>
      </div>

      {/* Date et heure */}
      <div style={{ textAlign: 'center', fontSize: '10px', marginTop: '3mm' }}>
        <div>
          {ticketDate.toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </div>
        <div style={{ fontWeight: 'bold' }}>
          {ticketDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Instructions */}
      <div style={{
        marginTop: '5mm',
        padding: '3mm',
        backgroundColor: '#f5f5f5',
        fontSize: '9px',
        textAlign: 'center',
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '1mm' }}>INSTRUCTIONS</div>
        <div>1. Gardez ce ticket précieusement</div>
        <div>2. Attendez votre numéro à l'écran</div>
        <div>3. Présentez-vous au guichet appelé</div>
      </div>

      {/* Validité */}
      <div style={{ textAlign: 'center', marginTop: '3mm', fontSize: '8px', color: '#666' }}>
        Ticket valable pour la journée uniquement
      </div>

      {/* Pied de page */}
      <div style={{
        marginTop: '5mm',
        paddingTop: '3mm',
        borderTop: '1px dashed black',
        textAlign: 'center',
        fontSize: '8px',
      }}>
        <div>Merci de votre visite</div>
        <div>www.camg-bopp.sn</div>
      </div>
    </div>
  );
});

TicketPrint.displayName = 'TicketPrint';

export default TicketPrint;
