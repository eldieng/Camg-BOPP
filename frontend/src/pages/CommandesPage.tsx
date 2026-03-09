import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, RefreshCw, Package, CheckCircle, Clock, X, Trash2, Send } from 'lucide-react';
import { Button, Card, CardContent, Input, Alert } from '../components/ui';
import { orderService, InternalOrder, OrderStatus, Station, CreateOrderItemDto, orderStatusLabels, orderStatusColors, stationLabels } from '../services/order.service';
import { useAuth } from '../contexts/AuthContext';

export default function CommandesPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<InternalOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<InternalOrder | null>(null);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | ''>('');

  // Formulaire création
  const [formData, setFormData] = useState<{
    station: Station;
    priority: string;
    neededByDate: string;
    notes: string;
    items: CreateOrderItemDto[];
  }>({
    station: 'LUNETTES',
    priority: 'NORMAL',
    neededByDate: '',
    notes: '',
    items: [{ itemName: '', quantity: 1, unit: 'pièces', description: '' }],
  });

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      setError('');
      const filters: any = {};
      if (filterStatus) filters.status = filterStatus;
      const data = await orderService.getAll(filters);
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [filterStatus]);

  const handleCreate = async () => {
    const validItems = formData.items.filter(i => i.itemName.trim() && i.quantity > 0);
    if (validItems.length === 0) {
      setError('Ajoutez au moins un article valide');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      await orderService.create({
        station: formData.station,
        priority: formData.priority,
        neededByDate: formData.neededByDate || undefined,
        notes: formData.notes || undefined,
        items: validItems,
      });
      setSuccess('Commande créée avec succès');
      setShowCreateModal(false);
      resetForm();
      loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (id: string) => {
    try {
      setIsLoading(true);
      await orderService.submit(id);
      setSuccess('Commande soumise');
      loadOrders();
      setSelectedOrder(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setIsLoading(true);
      await orderService.approve(id);
      setSuccess('Commande approuvée');
      loadOrders();
      setSelectedOrder(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      setIsLoading(true);
      await orderService.complete(id);
      setSuccess('Commande livrée');
      loadOrders();
      setSelectedOrder(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      setIsLoading(true);
      await orderService.cancel(id);
      setSuccess('Commande annulée');
      loadOrders();
      setSelectedOrder(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      station: 'LUNETTES',
      priority: 'NORMAL',
      neededByDate: '',
      notes: '',
      items: [{ itemName: '', quantity: 1, unit: 'pièces', description: '' }],
    });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { itemName: '', quantity: 1, unit: 'pièces', description: '' }],
    });
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData({
        ...formData,
        items: formData.items.filter((_, i) => i !== index),
      });
    }
  };

  const updateItem = (index: number, field: keyof CreateOrderItemDto, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'DRAFT': return <Clock className="w-4 h-4" />;
      case 'SUBMITTED': return <Send className="w-4 h-4" />;
      case 'APPROVED': return <CheckCircle className="w-4 h-4" />;
      case 'IN_PROGRESS': return <RefreshCw className="w-4 h-4" />;
      case 'COMPLETED': return <Package className="w-4 h-4" />;
      case 'CANCELLED': return <X className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-teal-600" />
          Commandes Matériel (Stock)
        </h1>
        <div className="flex gap-2">
          <Button onClick={loadOrders} variant="secondary" leftIcon={<RefreshCw className="w-4 h-4" />} size="sm" isLoading={isLoading}>
            Actualiser
          </Button>
          <Button onClick={() => setShowCreateModal(true)} leftIcon={<Plus className="w-4 h-4" />} size="sm">
            Nouvelle commande
          </Button>
        </div>
      </div>

      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Filtres */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4 items-center">
            <span className="text-sm font-medium text-gray-700">Filtrer par statut:</span>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterStatus('')}
                className={`px-3 py-1 text-sm rounded-full transition ${!filterStatus ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                Tous
              </button>
              {(['DRAFT', 'SUBMITTED', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as OrderStatus[]).map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1 text-sm rounded-full transition ${filterStatus === status ? orderStatusColors[status] : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  {orderStatusLabels[status]}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des commandes */}
      <div className="grid gap-4">
        {orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              Aucune commande trouvée
            </CardContent>
          </Card>
        ) : (
          orders.map(order => (
            <Card key={order.id} className="hover:shadow-md transition cursor-pointer" onClick={() => setSelectedOrder(order)}>
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono font-bold text-lg text-teal-600">{order.orderNumber}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 ${orderStatusColors[order.status]}`}>
                        {getStatusIcon(order.status)}
                        {orderStatusLabels[order.status]}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{stationLabels[order.station]}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{order.items.length} article(s)</span>
                      {order.items.slice(0, 3).map((item, idx) => (
                        <span key={idx} className="ml-2">• {item.itemName} ({item.quantity})</span>
                      ))}
                      {order.items.length > 3 && <span className="ml-2 text-gray-400">+{order.items.length - 3} autres</span>}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 text-right">
                    <p>{new Date(order.requestDate).toLocaleDateString('fr-FR')}</p>
                    {order.neededByDate && (
                      <p className="text-orange-600">Souhaité: {new Date(order.neededByDate).toLocaleDateString('fr-FR')}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal création */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Nouveau Bon de Commande</h2>
              <button onClick={() => { setShowCreateModal(false); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Station *</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    value={formData.station}
                    onChange={(e) => setFormData({ ...formData, station: e.target.value as Station })}
                  >
                    {Object.entries(stationLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="EMERGENCY">Urgent</option>
                  </select>
                </div>
              </div>

              <Input
                type="date"
                label="Date souhaitée"
                value={formData.neededByDate}
                onChange={(e) => setFormData({ ...formData, neededByDate: e.target.value })}
              />

              {/* Articles */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Articles *</label>
                  <Button size="sm" variant="secondary" onClick={addItem} leftIcon={<Plus className="w-4 h-4" />}>
                    Ajouter
                  </Button>
                </div>
                <div className="space-y-3">
                  {formData.items.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-start p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <input
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="Nom de l'article"
                          value={item.itemName}
                          onChange={(e) => updateItem(idx, 'itemName', e.target.value)}
                        />
                      </div>
                      <div className="w-20">
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="Qté"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div className="w-24">
                        <input
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="Unité"
                          value={item.unit || ''}
                          onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                        />
                      </div>
                      <button
                        onClick={() => removeItem(idx)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                        disabled={formData.items.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  rows={2}
                  placeholder="Notes supplémentaires..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <Button variant="secondary" onClick={() => { setShowCreateModal(false); resetForm(); }}>Annuler</Button>
              <Button onClick={handleCreate} isLoading={isLoading}>Créer la commande</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal détail */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold font-mono">{selectedOrder.orderNumber}</h2>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${orderStatusColors[selectedOrder.status]}`}>
                  {getStatusIcon(selectedOrder.status)}
                  {orderStatusLabels[selectedOrder.status]}
                </span>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Station</p>
                  <p className="font-medium">{stationLabels[selectedOrder.station]}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date de demande</p>
                  <p className="font-medium">{new Date(selectedOrder.requestDate).toLocaleDateString('fr-FR')}</p>
                </div>
                {selectedOrder.neededByDate && (
                  <div>
                    <p className="text-sm text-gray-500">Date souhaitée</p>
                    <p className="font-medium text-orange-600">{new Date(selectedOrder.neededByDate).toLocaleDateString('fr-FR')}</p>
                  </div>
                )}
                {selectedOrder.approvedDate && (
                  <div>
                    <p className="text-sm text-gray-500">Date d'approbation</p>
                    <p className="font-medium text-green-600">{new Date(selectedOrder.approvedDate).toLocaleDateString('fr-FR')}</p>
                  </div>
                )}
              </div>

              {/* Articles */}
              <div>
                <h3 className="font-semibold mb-2">Articles ({selectedOrder.items.length})</h3>
                <div className="border rounded-lg divide-y">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="p-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{item.itemName}</p>
                        {item.description && <p className="text-sm text-gray-500">{item.description}</p>}
                      </div>
                      <div className="text-right">
                        <span className="font-semibold">{item.quantity}</span>
                        {item.unit && <span className="text-gray-500 ml-1">{item.unit}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="text-gray-700">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Actions:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedOrder.status === 'DRAFT' && (
                    <>
                      <Button size="sm" onClick={() => handleSubmit(selectedOrder.id)} leftIcon={<Send className="w-4 h-4" />}>
                        Soumettre
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleCancel(selectedOrder.id)}>
                        Annuler
                      </Button>
                    </>
                  )}
                  {selectedOrder.status === 'SUBMITTED' && user?.role === 'ADMIN' && (
                    <>
                      <Button size="sm" variant="success" onClick={() => handleApprove(selectedOrder.id)} leftIcon={<CheckCircle className="w-4 h-4" />}>
                        Approuver
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleCancel(selectedOrder.id)}>
                        Rejeter
                      </Button>
                    </>
                  )}
                  {(selectedOrder.status === 'APPROVED' || selectedOrder.status === 'IN_PROGRESS') && user?.role === 'ADMIN' && (
                    <Button size="sm" variant="success" onClick={() => handleComplete(selectedOrder.id)} leftIcon={<Package className="w-4 h-4" />}>
                      Marquer comme livré
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end">
              <Button variant="secondary" onClick={() => setSelectedOrder(null)}>Fermer</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
