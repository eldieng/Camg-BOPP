import { useState, useEffect } from 'react';
import { Glasses, RefreshCw, Clock, CheckCircle, Package, Truck, Play, User, Phone } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Alert } from '../components/ui';
import { glassesOrderService, GlassesOrder, GlassesOrderStats, glassesOrderStatusLabels, glassesOrderStatusColors } from '../services/glassesOrder.service';

type Tab = 'pending' | 'ready' | 'all';

export default function AtelierLunettesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [pendingOrders, setPendingOrders] = useState<GlassesOrder[]>([]);
  const [readyOrders, setReadyOrders] = useState<GlassesOrder[]>([]);
  const [allOrders, setAllOrders] = useState<GlassesOrder[]>([]);
  const [stats, setStats] = useState<GlassesOrderStats | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<GlassesOrder | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [workshopNotes, setWorkshopNotes] = useState('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [pending, ready, statsData] = await Promise.all([
        glassesOrderService.getPending(),
        glassesOrderService.getReady(),
        glassesOrderService.getStats(),
      ]);
      setPendingOrders(pending);
      setReadyOrders(ready);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllOrders = async () => {
    try {
      const orders = await glassesOrderService.getAll();
      setAllOrders(orders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === 'all') loadAllOrders();
  }, [activeTab]);

  const handleStartProgress = async (id: string) => {
    try {
      setIsLoading(true);
      await glassesOrderService.startProgress(id);
      setSuccess('Fabrication démarrée');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkReady = async (id: string) => {
    try {
      setIsLoading(true);
      await glassesOrderService.markReady(id, workshopNotes);
      setSuccess('Commande marquée comme prête');
      setSelectedOrder(null);
      setWorkshopNotes('');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkDelivered = async (id: string) => {
    try {
      setIsLoading(true);
      await glassesOrderService.markDelivered(id);
      setSuccess('Lunettes remises au patient');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(''), 4000); return () => clearTimeout(t); }
  }, [success]);
  useEffect(() => {
    if (error) { const t = setTimeout(() => setError(''), 6000); return () => clearTimeout(t); }
  }, [error]);

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'pending', label: 'En attente', count: stats?.pending || 0 },
    { key: 'ready', label: 'Prêtes', count: stats?.ready || 0 },
    { key: 'all', label: 'Toutes' },
  ];

  const renderPrescription = (order: GlassesOrder) => (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div className="p-2 bg-blue-50 rounded">
        <p className="font-medium text-blue-800">OD (Œil Droit)</p>
        <div className="grid grid-cols-4 gap-1 mt-1 text-xs">
          <span>Sph: {order.odSphere ?? '-'}</span>
          <span>Cyl: {order.odCylinder ?? '-'}</span>
          <span>Axe: {order.odAxis ?? '-'}°</span>
          <span>Add: {order.odAddition ?? '-'}</span>
        </div>
      </div>
      <div className="p-2 bg-green-50 rounded">
        <p className="font-medium text-green-800">OG (Œil Gauche)</p>
        <div className="grid grid-cols-4 gap-1 mt-1 text-xs">
          <span>Sph: {order.ogSphere ?? '-'}</span>
          <span>Cyl: {order.ogCylinder ?? '-'}</span>
          <span>Axe: {order.ogAxis ?? '-'}°</span>
          <span>Add: {order.ogAddition ?? '-'}</span>
        </div>
      </div>
    </div>
  );

  const renderOrderCard = (order: GlassesOrder, showActions: boolean = true) => (
    <Card key={order.id} className={order.priority === 'EMERGENCY' ? 'border-red-300 border-2' : ''}>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-bold text-lg">{order.orderNumber}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${glassesOrderStatusColors[order.status]}`}>
                {glassesOrderStatusLabels[order.status]}
              </span>
              {order.priority === 'EMERGENCY' && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-800">🚨 Urgent</span>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <User className="w-4 h-4" />
              <span className="font-medium">{order.patient.lastName} {order.patient.firstName}</span>
              <span className="text-gray-400">({order.patient.registrationNumber})</span>
              {order.patient.phone && (
                <>
                  <Phone className="w-4 h-4 ml-2" />
                  <span>{order.patient.phone}</span>
                </>
              )}
            </div>

            {renderPrescription(order)}

            <div className="mt-2 text-xs text-gray-500 space-y-1">
              {order.lensType && <p><strong>Verre:</strong> {order.lensType}</p>}
              {order.coating && <p><strong>Traitement:</strong> {order.coating}</p>}
              {order.frameType && <p><strong>Monture:</strong> {order.frameType} {order.frameReference && `(${order.frameReference})`}</p>}
              {order.pupillaryDistance && <p><strong>Écart pupillaire:</strong> {order.pupillaryDistance} mm</p>}
              {order.notes && <p><strong>Notes:</strong> {order.notes}</p>}
              <p><strong>Commandé le:</strong> {new Date(order.orderDate).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>

          {showActions && (
            <div className="flex flex-col gap-2">
              {order.status === 'PENDING' && (
                <Button size="sm" onClick={() => handleStartProgress(order.id)} leftIcon={<Play className="w-4 h-4" />}>
                  Démarrer
                </Button>
              )}
              {order.status === 'IN_PROGRESS' && (
                <Button size="sm" variant="success" onClick={() => setSelectedOrder(order)} leftIcon={<CheckCircle className="w-4 h-4" />}>
                  Terminer
                </Button>
              )}
              {order.status === 'READY' && (
                <Button size="sm" variant="success" onClick={() => handleMarkDelivered(order.id)} leftIcon={<Truck className="w-4 h-4" />}>
                  Remettre
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Glasses className="w-6 sm:w-8 h-6 sm:h-8 text-purple-600" />
            Atelier Lunettes
          </h1>
          <p className="text-sm text-gray-600">Gestion des commandes de lunettes</p>
        </div>
        <Button onClick={loadData} variant="secondary" leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}>
          Actualiser
        </Button>
      </div>

      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-xs text-gray-500">En attente</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Package className="w-8 h-8 mx-auto text-blue-500 mb-2" />
              <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              <p className="text-xs text-gray-500">En fabrication</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-2" />
              <p className="text-2xl font-bold text-green-600">{stats.ready}</p>
              <p className="text-xs text-gray-500">Prêtes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Truck className="w-8 h-8 mx-auto text-gray-500 mb-2" />
              <p className="text-2xl font-bold text-gray-600">{stats.deliveredToday}</p>
              <p className="text-xs text-gray-500">Livrées aujourd'hui</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 bg-white p-1 rounded-lg shadow-sm border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.key ? 'bg-purple-200' : 'bg-gray-200'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-3">
        {activeTab === 'pending' && (
          <>
            {pendingOrders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  <Glasses className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>Aucune commande en attente</p>
                </CardContent>
              </Card>
            ) : (
              pendingOrders.map((order) => renderOrderCard(order))
            )}
          </>
        )}

        {activeTab === 'ready' && (
          <>
            {readyOrders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>Aucune commande prête à remettre</p>
                </CardContent>
              </Card>
            ) : (
              readyOrders.map((order) => renderOrderCard(order))
            )}
          </>
        )}

        {activeTab === 'all' && (
          <>
            {allOrders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  <p>Aucune commande</p>
                </CardContent>
              </Card>
            ) : (
              allOrders.map((order) => renderOrderCard(order, false))
            )}
          </>
        )}
      </div>

      {/* Modal terminer fabrication */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Terminer la fabrication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Commande <strong>{selectedOrder.orderNumber}</strong> pour{' '}
                <strong>{selectedOrder.patient.lastName} {selectedOrder.patient.firstName}</strong>
              </p>
              <Input
                label="Notes atelier (optionnel)"
                value={workshopNotes}
                onChange={(e) => setWorkshopNotes(e.target.value)}
                placeholder="Ex: Monture ajustée, verres traités..."
              />
              <div className="flex gap-2">
                <Button onClick={() => handleMarkReady(selectedOrder.id)} isLoading={isLoading} className="flex-1">
                  Marquer comme prêt
                </Button>
                <Button variant="secondary" onClick={() => { setSelectedOrder(null); setWorkshopNotes(''); }} className="flex-1">
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
