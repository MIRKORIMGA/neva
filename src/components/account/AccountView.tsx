import React, { useState } from 'react';
import { User, Package, Heart, MapPin, LogOut, Plus, Shield, CheckCircle2, Clock, Truck, Check, ChevronRight } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatKz, ANGOLA_PROVINCES } from '../../data/initialData';
import { OrderStatus } from '../../types';

export const AccountView: React.FC = () => {
  const {
    user,
    orders,
    logout,
    setIsAuthModalOpen,
    setCurrentTab,
    addAddress,
    deleteAddress,
    showToast,
    updateUserProfile,
  } = useStore();

  const [activeSubTab, setActiveSubTab] = useState<'orders' | 'addresses' | 'profile'>('orders');
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [addrLabel, setAddrLabel] = useState('Casa');
  const [addrName, setAddrName] = useState(user?.name || '');
  const [addrPhone, setAddrPhone] = useState(user?.phone || '+244 ');
  const [addrProvince, setAddrProvince] = useState('Luanda');
  const [addrMunicipality, setAddrMunicipality] = useState('Talatona');
  const [addrStreet, setAddrStreet] = useState('');

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 mx-auto flex items-center justify-center mb-6">
          <User className="w-10 h-10 text-neutral-400" />
        </div>
        <h2 className="text-2xl font-black text-white uppercase tracking-tight font-display mb-2">
          A tua Conta NEVA
        </h2>
        <p className="text-sm text-neutral-400 mb-8 max-w-sm mx-auto">
          Inicia sessão para acompanhares as tuas encomendas, guardares moradas de entrega e acederes aos teus artigos favoritos.
        </p>
        <button
          onClick={() => setIsAuthModalOpen(true)}
          className="px-8 py-3.5 bg-white text-black font-extrabold text-xs uppercase tracking-wider rounded-full hover:bg-neutral-200 transition-colors shadow-lg shadow-white/10 cursor-pointer"
        >
          Entrar ou Criar Conta
        </button>
      </div>
    );
  }

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrStreet.trim()) {
      showToast('Por favor insere o endereço.', 'error');
      return;
    }

    addAddress({
      label: addrLabel,
      name: addrName || user.name,
      phone: addrPhone || user.phone,
      province: addrProvince,
      municipality: addrMunicipality,
      address: addrStreet,
      isDefault: user.addresses.length === 0,
    });

    setIsAddingAddress(false);
    setAddrStreet('');
  };

  const getStatusBadge = (status: OrderStatus) => {
    const badges: Record<OrderStatus, { label: string; color: string; icon: any }> = {
      pending: { label: 'Pendente', color: 'bg-amber-950/60 text-amber-400 border-amber-800/50', icon: Clock },
      confirmed: { label: 'Confirmado', color: 'bg-blue-950/60 text-blue-400 border-blue-800/50', icon: CheckCircle2 },
      processing: { label: 'Em Preparação', color: 'bg-purple-950/60 text-purple-400 border-purple-800/50', icon: Package },
      shipped: { label: 'Em Trânsito / Enviado', color: 'bg-cyan-950/60 text-cyan-400 border-cyan-800/50', icon: Truck },
      delivered: { label: 'Entregue', color: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50', icon: Check },
      cancelled: { label: 'Cancelado', color: 'bg-red-950/60 text-red-400 border-red-800/50', icon: Clock },
    };
    const b = badges[status] || badges.pending;
    const Icon = b.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${b.color}`}>
        <Icon className="w-3.5 h-3.5" />
        {b.label}
      </span>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* User Header Profile Card */}
      <div className="bg-[#121212] border border-white/10 rounded-3xl p-6 sm:p-8 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-neutral-800 border-2 border-white/20 flex items-center justify-center font-bold text-xl text-white">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white font-display">
                {user.name}
              </h1>
              {user.role === 'admin' && (
                <span className="bg-amber-400/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-400/30 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Admin
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">{user.email} · {user.phone}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {user.role === 'admin' && (
            <button
              onClick={() => setCurrentTab('admin')}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Shield className="w-4 h-4" />
              <span>Painel Admin</span>
            </button>
          )}

          <button
            onClick={logout}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-[#1e1e1e] hover:bg-red-950/40 hover:text-red-400 text-neutral-300 text-xs font-semibold rounded-xl border border-white/5 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex border-b border-white/10 mb-8 space-x-8 text-sm font-semibold">
        <button
          onClick={() => setActiveSubTab('orders')}
          className={`pb-3 transition-colors cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'orders'
              ? 'text-white border-b-2 border-white'
              : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Histórico de Encomendas ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('addresses')}
          className={`pb-3 transition-colors cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'addresses'
              ? 'text-white border-b-2 border-white'
              : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Moradas Guardadas ({user.addresses.length})</span>
        </button>
      </div>

      {/* Orders Tab Content */}
      {activeSubTab === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="bg-[#141414] rounded-2xl border border-white/5 p-8 text-center">
              <Package className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
              <p className="text-white font-bold text-sm">Ainda não tens encomendas</p>
              <p className="text-xs text-neutral-400 mt-1 mb-4">
                Quando fizeres uma compra, poderás acompanhar o envio em tempo real aqui.
              </p>
              <button
                onClick={() => setCurrentTab('catalog')}
                className="px-5 py-2.5 bg-white text-black font-bold text-xs uppercase tracking-wider rounded-full hover:bg-neutral-200 transition-colors"
              >
                Começar a Comprar
              </button>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="bg-[#141414] border border-white/5 hover:border-white/15 rounded-2xl p-5 sm:p-6 transition-all space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
                  <div>
                    <span className="text-xs text-neutral-400">Encomenda</span>
                    <h3 className="text-base font-black text-white font-mono">
                      #{order.orderNumber}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-neutral-400">
                      {new Date(order.createdAt).toLocaleDateString('pt-PT')}
                    </span>
                    {getStatusBadge(order.orderStatus)}
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-[#202020] rounded-xl p-1 shrink-0 flex items-center justify-center">
                          {item.product.images[0] ? (
                            <img
                              src={item.product.images[0]}
                              alt={item.product.name}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <Package className="w-5 h-5 text-neutral-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white line-clamp-1">
                            {item.product.name}
                          </p>
                          <p className="text-[11px] text-neutral-400">
                            Qtd: {item.quantity} · Tam: {item.selectedSize} · Cor: {item.selectedColor.name}
                          </p>
                        </div>
                      </div>

                      <span className="text-xs font-bold text-white tabular-nums">
                        {formatKz(item.product.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Tracking Progress Bar */}
                <div className="pt-2 border-t border-white/5">
                  <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                    Progresso de Entrega
                  </p>
                  <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                    <div
                      className={`p-2 rounded-lg ${
                        order.orderStatus !== 'cancelled'
                          ? 'bg-emerald-950/60 text-emerald-300 font-bold'
                          : 'bg-neutral-800 text-neutral-500'
                      }`}
                    >
                      1. Registado
                    </div>
                    <div
                      className={`p-2 rounded-lg ${
                        ['confirmed', 'processing', 'shipped', 'delivered'].includes(order.orderStatus)
                          ? 'bg-emerald-950/60 text-emerald-300 font-bold'
                          : 'bg-neutral-900 text-neutral-500'
                      }`}
                    >
                      2. Confirmado
                    </div>
                    <div
                      className={`p-2 rounded-lg ${
                        ['shipped', 'delivered'].includes(order.orderStatus)
                          ? 'bg-emerald-950/60 text-emerald-300 font-bold'
                          : 'bg-neutral-900 text-neutral-500'
                      }`}
                    >
                      3. Em Trânsito
                    </div>
                    <div
                      className={`p-2 rounded-lg ${
                        order.orderStatus === 'delivered'
                          ? 'bg-emerald-950/60 text-emerald-300 font-bold'
                          : 'bg-neutral-900 text-neutral-500'
                      }`}
                    >
                      4. Entregue
                    </div>
                  </div>
                </div>

                {/* Footer summary */}
                <div className="flex items-center justify-between pt-2 text-xs">
                  <span className="text-neutral-400">
                    Destino: {order.municipality}, {order.province}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-neutral-400">Total:</span>
                    <span className="text-base font-black text-white tabular-nums font-display">
                      {formatKz(order.total)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Addresses Tab Content */}
      {activeSubTab === 'addresses' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Endereços para Envio
            </h3>
            <button
              onClick={() => setIsAddingAddress(!isAddingAddress)}
              className="px-4 py-2 bg-white text-black font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-neutral-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Morada</span>
            </button>
          </div>

          {/* Add Address Form */}
          {isAddingAddress && (
            <form onSubmit={handleSaveAddress} className="bg-[#161616] border border-white/10 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Nova Morada de Entrega
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-neutral-300 font-semibold block mb-1">Identificador</label>
                  <input
                    type="text"
                    value={addrLabel}
                    onChange={(e) => setAddrLabel(e.target.value)}
                    placeholder="Casa, Escritório, etc."
                    className="w-full bg-[#1c1c1c] border border-[#2b2b2b] text-xs text-white rounded-xl p-2.5"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-300 font-semibold block mb-1">Telefone</label>
                  <input
                    type="tel"
                    value={addrPhone}
                    onChange={(e) => setAddrPhone(e.target.value)}
                    className="w-full bg-[#1c1c1c] border border-[#2b2b2b] text-xs text-white rounded-xl p-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-neutral-300 font-semibold block mb-1">Província</label>
                  <select
                    value={addrProvince}
                    onChange={(e) => {
                      setAddrProvince(e.target.value);
                      setAddrMunicipality(ANGOLA_PROVINCES[e.target.value]?.[0] || 'Central');
                    }}
                    className="w-full bg-[#1c1c1c] border border-[#2b2b2b] text-xs text-white rounded-xl p-2.5"
                  >
                    {Object.keys(ANGOLA_PROVINCES).map((prov) => (
                      <option key={prov} value={prov}>{prov}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-neutral-300 font-semibold block mb-1">Município</label>
                  <select
                    value={addrMunicipality}
                    onChange={(e) => setAddrMunicipality(e.target.value)}
                    className="w-full bg-[#1c1c1c] border border-[#2b2b2b] text-xs text-white rounded-xl p-2.5"
                  >
                    {(ANGOLA_PROVINCES[addrProvince] || ['Central']).map((muni) => (
                      <option key={muni} value={muni}>{muni}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-neutral-300 font-semibold block mb-1">Morada / Ponto de Referência</label>
                <textarea
                  required
                  rows={2}
                  value={addrStreet}
                  onChange={(e) => setAddrStreet(e.target.value)}
                  placeholder="Bairro, Rua, Edifício, nº da casa..."
                  className="w-full bg-[#1c1c1c] border border-[#2b2b2b] text-xs text-white rounded-xl p-2.5 resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddingAddress(false)}
                  className="px-4 py-2 bg-[#202020] text-neutral-400 hover:text-white text-xs font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-white text-black font-bold text-xs uppercase rounded-xl hover:bg-neutral-200"
                >
                  Guardar Morada
                </button>
              </div>
            </form>
          )}

          {/* Saved Addresses List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {user.addresses.map((addr) => (
              <div
                key={addr.id}
                className="bg-[#141414] border border-white/5 rounded-2xl p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                      {addr.label}
                    </span>
                    {addr.isDefault && (
                      <span className="text-[10px] bg-white/10 text-neutral-300 px-2 py-0.5 rounded-full">
                        Padrão
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-neutral-300 font-medium">{addr.name}</p>
                  <p className="text-xs text-neutral-400 mt-1">{addr.address}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {addr.municipality}, {addr.province} · {addr.phone}
                  </p>
                </div>

                <div className="pt-4 mt-3 border-t border-white/5 flex justify-end">
                  <button
                    onClick={() => deleteAddress(addr.id)}
                    className="text-[11px] text-neutral-500 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
