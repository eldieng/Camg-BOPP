import { X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  type: AlertType;
  message: string;
  onClose?: () => void;
  className?: string;
}

const alertStyles: Record<AlertType, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    icon: <CheckCircle className="w-5 h-5 text-green-600" />,
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: <XCircle className="w-5 h-5 text-red-600" />,
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    icon: <Info className="w-5 h-5 text-blue-600" />,
  },
};

function formatErrorMessage(message: string): string {
  if (message.includes('status code 400')) {
    return 'Données invalides. Veuillez vérifier les informations saisies.';
  }
  if (message.includes('status code 401')) {
    return 'Session expirée. Veuillez vous reconnecter.';
  }
  if (message.includes('status code 403')) {
    return 'Accès refusé. Vous n\'avez pas les permissions nécessaires.';
  }
  if (message.includes('status code 404')) {
    return 'Ressource non trouvée.';
  }
  if (message.includes('status code 409')) {
    return 'Conflit. Cette ressource existe déjà.';
  }
  if (message.includes('status code 500')) {
    return 'Erreur serveur. Veuillez réessayer plus tard.';
  }
  if (message.includes('Network Error') || message.includes('network')) {
    return 'Erreur de connexion. Vérifiez votre connexion internet.';
  }
  return message;
}

export function Alert({ type, message, onClose, className = '' }: AlertProps) {
  const styles = alertStyles[type];
  const displayMessage = type === 'error' ? formatErrorMessage(message) : message;

  return (
    <div className={`p-4 rounded-lg border flex items-center justify-between shadow-sm ${styles.bg} ${styles.border} ${styles.text} ${className}`}>
      <div className="flex items-center gap-3">
        {styles.icon}
        <span className="font-medium">{displayMessage}</span>
      </div>
      {onClose && (
        <button 
          onClick={onClose} 
          className={`${styles.text} hover:opacity-70 transition-opacity`}
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export default Alert;
