import { useState, useEffect, useRef } from 'react';
import { UserPlus, Ticket, Search, RefreshCw, Printer, X } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, Input } from '../components/ui';
import { patientService, Patient, CreatePatientDto } from '../services/patient.service';
import { ticketService, Ticket as TicketType, TicketsSummary } from '../services/ticket.service';
import TicketPrint from '../components/TicketPrint';
import { QRCodeSVG } from 'qrcode.react';
import QRCode from 'qrcode';

export default function AccueilPage() {
  const [activeTab, setActiveTab] = useState<'new' | 'search'>('new');
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [summary, setSummary] = useState<TicketsSummary | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [createdTicket, setCreatedTicket] = useState<TicketType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const ticketPrintRef = useRef<HTMLDivElement>(null);

  // Formulaire nouveau patient
  const [formData, setFormData] = useState<CreatePatientDto>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'MALE',
    phone: '',
    address: '',
    isPregnant: false,
    isDisabled: false,
  });

  // Charger les tickets du jour
  const loadTickets = async () => {
    try {
      const data = await ticketService.getTodayTickets();
      setTickets(data.tickets);
      setSummary(data.summary);
    } catch (err) {
      console.error('Erreur chargement tickets:', err);
    }
  };

  useEffect(() => {
    loadTickets();
    const interval = setInterval(loadTickets, 30000); // Refresh toutes les 30s
    return () => clearInterval(interval);
  }, []);

  // Recherche de patients
  useEffect(() => {
    const searchPatients = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      try {
        const results = await patientService.quickSearch(searchQuery);
        setSearchResults(results);
      } catch (err) {
        console.error('Erreur recherche:', err);
      }
    };
    const debounce = setTimeout(searchPatients, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  // Créer un nouveau patient et ticket
  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // Créer le patient
      const patient = await patientService.create(formData);
      // Créer le ticket
      const ticket = await ticketService.create({ patientId: patient.id });
      setCreatedTicket(ticket);
      setSuccess(`Ticket ${ticket.ticketNumber} créé pour ${patient.firstName} ${patient.lastName}`);
      setTimeout(() => setSuccess(''), 5000);
      loadTickets();
      // Reset form
      setFormData({
        firstName: '', lastName: '', dateOfBirth: '', gender: 'MALE',
        phone: '', address: '', isPregnant: false, isDisabled: false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création');
    } finally {
      setIsLoading(false);
    }
  };

  // Créer un ticket pour un patient existant
  const handleCreateTicketForPatient = async () => {
    if (!selectedPatient) return;
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const ticket = await ticketService.create({ patientId: selectedPatient.id });
      setCreatedTicket(ticket);
      setSuccess(`Ticket ${ticket.ticketNumber} créé pour ${selectedPatient.firstName} ${selectedPatient.lastName}`);
      setTimeout(() => setSuccess(''), 5000);
      setSelectedPatient(null);
      setSearchQuery('');
      setSearchResults([]);
      loadTickets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Accueil - Gestion des Tickets</h1>
        <Button onClick={loadTickets} variant="secondary" leftIcon={<RefreshCw className="w-4 h-4" />} size="sm">
          Actualiser
        </Button>
      </div>

      {/* Messages feedback */}
      {success && (
        <div className="p-3 rounded-lg bg-green-50 text-green-800 border border-green-200">
          {success}
        </div>
      )}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-800 border border-red-200">
          {error}
        </div>
      )}

      {/* Résumé */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-4">
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
            <p className="text-xs sm:text-sm text-gray-600">Total</p>
            <p className="text-xl sm:text-2xl font-bold">{summary.total}</p>
          </div>
          <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg shadow-sm border border-yellow-200">
            <p className="text-xs sm:text-sm text-yellow-700">En attente</p>
            <p className="text-xl sm:text-2xl font-bold text-yellow-800">{summary.waiting}</p>
          </div>
          <div className="bg-blue-50 p-3 sm:p-4 rounded-lg shadow-sm border border-blue-200">
            <p className="text-xs sm:text-sm text-blue-700">En cours</p>
            <p className="text-xl sm:text-2xl font-bold text-blue-800">{summary.inProgress}</p>
          </div>
          <div className="bg-green-50 p-3 sm:p-4 rounded-lg shadow-sm border border-green-200">
            <p className="text-xs sm:text-sm text-green-700">Terminés</p>
            <p className="text-xl sm:text-2xl font-bold text-green-800">{summary.completed}</p>
          </div>
          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg shadow-sm border col-span-2 sm:col-span-1">
            <p className="text-xs sm:text-sm text-gray-600">Annulés</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-800">{summary.cancelled}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Formulaire */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setActiveTab('new')}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg font-medium text-sm sm:text-base ${activeTab === 'new' ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <UserPlus className="w-4 h-4 inline mr-1 sm:mr-2" />
                Nouveau
              </button>
              <button
                onClick={() => setActiveTab('search')}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg font-medium text-sm sm:text-base ${activeTab === 'search' ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Search className="w-4 h-4 inline mr-1 sm:mr-2" />
                Existant
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {activeTab === 'new' ? (
              <form onSubmit={handleCreatePatient} className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <Input label="Prénom *" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required />
                  <Input label="Nom *" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <Input type="date" label="Date de naissance *" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} required />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Genre *</label>
                    <select className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-base" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'MALE' | 'FEMALE' })}>
                      <option value="MALE">Homme</option>
                      <option value="FEMALE">Femme</option>
                    </select>
                  </div>
                </div>
                <Input label="Téléphone" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                <Input label="Adresse" value={formData.address || ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
                  <label className="flex items-center">
                    <input type="checkbox" checked={formData.isPregnant} onChange={(e) => setFormData({ ...formData, isPregnant: e.target.checked })} className="mr-2" />
                    Femme enceinte
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" checked={formData.isDisabled} onChange={(e) => setFormData({ ...formData, isDisabled: e.target.checked })} className="mr-2" />
                    Personne handicapée
                  </label>
                </div>
                <Button type="submit" className="w-full" isLoading={isLoading} leftIcon={<Ticket className="w-5 h-5" />}>
                  Créer Patient & Ticket
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <Input label="Rechercher un patient" placeholder="Nom, prénom ou téléphone..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                {searchResults.length > 0 && (
                  <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                    {searchResults.map((patient) => (
                      <button key={patient.id} onClick={() => setSelectedPatient(patient)} className={`w-full p-3 text-left hover:bg-gray-50 ${selectedPatient?.id === patient.id ? 'bg-primary-50' : ''}`}>
                        <p className="font-medium">{patient.lastName} {patient.firstName}</p>
                        <p className="text-sm text-gray-500">{patient.phone || 'Pas de téléphone'}</p>
                      </button>
                    ))}
                  </div>
                )}
                {selectedPatient && (
                  <div className="p-4 bg-primary-50 rounded-lg">
                    <p className="font-medium">{selectedPatient.lastName} {selectedPatient.firstName}</p>
                    <p className="text-sm text-gray-600">Né(e) le {new Date(selectedPatient.dateOfBirth).toLocaleDateString('fr-FR')}</p>
                    <Button onClick={handleCreateTicketForPatient} className="mt-3 w-full" isLoading={isLoading} leftIcon={<Ticket className="w-5 h-5" />}>
                      Créer un Ticket
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ticket créé */}
        {createdTicket && (
          <Card className="border-2 border-green-500">
            <CardHeader>
              <CardTitle className="text-green-700">✅ Ticket Créé</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-4xl sm:text-6xl font-bold text-primary-600 mb-4">{createdTicket.ticketNumber}</div>
              {/* QR Code généré côté frontend avec l'URL de vérification */}
              <div className="flex justify-center mb-4">
                <QRCodeSVG
                  value={`${window.location.origin}/ticket/${createdTicket.qrCode}`}
                  size={150}
                  level="M"
                />
              </div>
              <p className="text-lg mb-2">{createdTicket.patient.lastName} {createdTicket.patient.firstName}</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm ${ticketService.getPriorityColor(createdTicket.priority)}`}>
                {ticketService.getPriorityLabel(createdTicket.priority)}
              </span>
              {createdTicket.estimatedWaitTime && (
                <p className="mt-4 text-gray-600">Temps d'attente estimé: ~{createdTicket.estimatedWaitTime} min</p>
              )}
              <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:space-x-2 justify-center">
                <Button 
                  variant="secondary" 
                  leftIcon={<Printer className="w-4 h-4" />}
                  onClick={async () => {
                    if (!createdTicket) return;
                    
                    // Générer le QR code en base64
                    const qrCodeUrl = `${window.location.origin}/ticket/${createdTicket.qrCode}`;
                    const qrImageBase64 = await QRCode.toDataURL(qrCodeUrl, { width: 80, margin: 1 });
                    
                    const printWindow = window.open('', '_blank');
                    if (printWindow && ticketPrintRef.current) {
                      let htmlContent = ticketPrintRef.current.innerHTML;
                      
                      // Remplacer le canvas par l'image base64
                      const canvasRegex = /<canvas[^>]*>.*?<\/canvas>/gi;
                      htmlContent = htmlContent.replace(canvasRegex, `<img src="${qrImageBase64}" style="width:60px;height:60px;" />`);
                      
                      printWindow.document.write('<html><head><title>Ticket CAMG-BOPP</title></head><body>');
                      printWindow.document.write(htmlContent);
                      printWindow.document.write('</body></html>');
                      printWindow.document.close();
                      printWindow.print();
                    }
                  }}
                >
                  Imprimer
                </Button>
                <Button variant="ghost" onClick={() => setCreatedTicket(null)} leftIcon={<X className="w-4 h-4" />}>Fermer</Button>
              </div>
              
              {/* Composant d'impression caché */}
              <div style={{ display: 'none' }}>
                <TicketPrint ref={ticketPrintRef} ticket={createdTicket} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Liste des tickets en attente */}
        {!createdTicket && (
          <Card>
            <CardHeader>
              <CardTitle>File d'attente ({tickets.filter(t => t.status === 'WAITING').length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {tickets.filter(t => t.status === 'WAITING').length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Aucun patient en attente</p>
                ) : (
                  tickets.filter(t => t.status === 'WAITING').map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                        <span className="text-base sm:text-lg font-bold text-primary-600 flex-shrink-0">{ticket.ticketNumber.split('-')[1]}</span>
                        <div className="min-w-0">
                          <p className="font-medium text-sm sm:text-base truncate">{ticket.patient.lastName} {ticket.patient.firstName}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${ticketService.getPriorityColor(ticket.priority)}`}>
                            {ticketService.getPriorityLabel(ticket.priority)}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs sm:text-sm text-gray-500 flex-shrink-0">#{ticket.queueEntry?.position || '-'}</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
