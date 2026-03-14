"use client";
import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Camera, Send, TrendingUp, BarChart3, History, MessageCircle, Trash2 } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function RoseApp() {
  const [activeTab, setActiveTab] = useState('camera');
  const [loading, setLoading] = useState(false);
  const [chat, setChat] = useState("La niebla te rodea... Sube un ticket para comenzar.");
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estado para tickets y gastos
  const [gastos, setGastos] = useState<any[]>([]);
  const [estadisticas, setEstadisticas] = useState({
    totalGastos: 0,
    totalIngresos: 2000,
    porcentajeAhorrado: 0,
    categoriasDesglose: {} as Record<string, number>
  });

  // Cargar datos al montar
  useEffect(() => {
    cargarDatos();
    const intervalo = setInterval(cargarDatos, 10000); // Actualizar cada 10 segundos
    return () => clearInterval(intervalo);
  }, []);

  async function cargarDatos() {
    try {
      const { data: gastosData, error } = await supabase
        .from('gastos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando datos:', error);
        return;
      }

      if (gastosData) {
        setGastos(gastosData);
        calcularEstadisticas(gastosData);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }

  function calcularEstadisticas(datos: any[]) {
    let total = 0;
    let desglose: Record<string, number> = {};

    datos.forEach(gasto => {
      const monto = parseFloat(gasto.monto) || 0;
      total += monto;
      const categoria = gasto.categoria || 'Otros';
      desglose[categoria] = (desglose[categoria] || 0) + monto;
    });

    setEstadisticas({
      totalGastos: total,
      totalIngresos: 2000,
      porcentajeAhorrado: ((2000 - total) / 2000) * 100,
      categoriasDesglose: desglose
    });
  }

  async function handleImageUpload(e: any) {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setChat("🔮 Rose está analizando... entre las sombras...");

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];

        const response = await fetch('/api/analizar-ticket', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imagenBase64: base64 })
        });

        const datosTicket = await response.json();

        if (datosTicket.desglose && datosTicket.desglose.length > 0) {
          // Guardar cada item en Supabase
          for (const item of datosTicket.desglose) {
            await supabase.from('gastos').insert({
              descripcion: item.producto || 'Producto',
              monto: item.precio || 0,
              categoria: item.categoria || 'Otros',
              tipo_movimiento: 'gasto'
            });
          }

          // Actualizar UI
          await cargarDatos();
          
          const detalles = datosTicket.desglose
            .map((i: any) => `✓ ${i.producto}: $${parseFloat(i.precio).toFixed(2)} (${i.categoria})`)
            .join('\n');
          
          const totalTicket = datosTicket.desglose
            .reduce((sum: number, i: any) => sum + (parseFloat(i.precio) || 0), 0)
            .toFixed(2);

          setChat(`✨ Rose ha analizado tu compra:\n\n${detalles}\n\n💰 Total: $${totalTicket}\n\n"${datosTicket.mensajeRose}"`);
        } else {
          setChat("❌ No pude leer el ticket. Intenta con una foto más clara.");
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error:', error);
      setChat("⚠️ La niebla es demasiado densa... intenta de nuevo.");
    }

    setLoading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function enviarMensaje() {
    if (!message.trim()) return;
    
    const mensajeUsuario = message;
    setMessage("");
    
    setChat(prev => prev + `\n\n👤 Tú: ${mensajeUsuario}\n\n🔮 Rose está pensando...`);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mensaje: mensajeUsuario,
          estadisticas: estadisticas 
        })
      });

      const datos = await response.json();
      setChat(prev => prev.replace('🔮 Rose está pensando...', '🔮 ' + datos.respuesta));
    } catch (error) {
      setChat(prev => prev.replace('🔮 Rose está pensando...', '⚠️ La niebla impidió escuchar...'));
    }
  }

  async function eliminarGasto(id: number) {
    if (!confirm('¿Eliminar este gasto?')) return;
    
    const { error } = await supabase
      .from('gastos')
      .delete()
      .eq('id', id);

    if (!error) {
      await cargarDatos();
      setChat("🗑️ Gasto eliminado. La niebla lo olvida.");
    }
  }

  const ColorPorCategoria: Record<string, string> = {
    'Alimentación': 'bg-green-500',
    'Limpieza': 'bg-blue-500',
    'Salud': 'bg-red-500',
    'Mascotas': 'bg-purple-500',
    'Transporte': 'bg-yellow-500',
    'Ocio': 'bg-pink-500',
    'Otros': 'bg-gray-500',
    'Comida_Saludable': 'bg-emerald-500',
    'Carne_Animal': 'bg-orange-500',
    'Lacteos_Huevos': 'bg-amber-500',
    'Legumbres': 'bg-lime-500',
    'Verduras': 'bg-green-600',
    'Frutas': 'bg-red-400',
    'Granos_Integrales': 'bg-yellow-600',
    'Frutos_Secos': 'bg-orange-600'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white pb-24">
      {/* HEADER MÓVIL */}
      <header className="fixed top-0 left-0 right-0 bg-black/70 backdrop-blur z-50 border-b border-rose-900/30">
        <div className="px-4 py-3">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-rose-400 to-pink-600 bg-clip-text text-transparent">
            🔮 LA PERDEDORA
          </h1>
          <p className="text-rose-400/60 text-xs">En la niebla, cada gasto es una lección</p>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="pt-20 px-3 space-y-4">
        
        {/* TAB: CÁMARA */}
        {activeTab === 'camera' && (
          <div className="space-y-4">
            {/* BOTÓN CÁMARA - ENORME PARA MÓVIL */}
            <div className="bg-gradient-to-br from-rose-900/40 to-pink-900/40 backdrop-blur border border-rose-500/50 rounded-3xl p-6">
              <div className="text-center space-y-4">
                <div className="inline-block p-4 bg-rose-500/30 rounded-full">
                  <Camera size={40} className="text-rose-400" />
                </div>
                <h2 className="text-xl font-bold">Escanea tu Ticket</h2>
                <p className="text-gray-300 text-sm">Rose analizará cada producto</p>

                <label className="block">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={loading}
                  />
                  <div className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-2xl cursor-pointer transition active:scale-95 text-lg w-full text-center">
                    {loading ? '🔍 Analizando...' : '📷 TOMAR FOTO'}
                  </div>
                </label>

                {loading && (
                  <div className="mt-4 space-y-3">
                    <div className="flex justify-center">
                      <div className="animate-spin">
                        <div className="h-10 w-10 border-4 border-rose-500 border-t-pink-300 rounded-full"></div>
                      </div>
                    </div>
                    <p className="text-rose-400 text-sm animate-pulse">Observando entre las sombras...</p>
                  </div>
                )}
              </div>
            </div>

            {/* ÚLTIMAS COMPRAS */}
            {gastos.length > 0 && (
              <div>
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <TrendingUp size={20} className="text-rose-400" />
                  Últimas Compras
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {gastos.slice(0, 6).map((gasto, idx) => (
                    <div key={idx} className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-lg p-3 hover:border-rose-500/30 transition">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{gasto.descripcion}</p>
                          <p className="text-xs text-gray-400">{gasto.categoria}</p>
                        </div>
                        <span className="text-rose-400 font-bold ml-2">
                          ${parseFloat(gasto.monto).toFixed(2)}
                        </span>
                      </div>
                      <div className={`h-1 ${ColorPorCategoria[gasto.categoria] || 'bg-gray-500'} rounded-full`}></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            {/* MÉTRICAS PRINCIPALES */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 backdrop-blur border border-blue-500/30 rounded-xl p-4">
                <p className="text-gray-400 text-xs mb-1">💰 Gastos</p>
                <p className="text-2xl font-bold text-cyan-400">${estadisticas.totalGastos.toFixed(0)}</p>
              </div>
              <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 backdrop-blur border border-green-500/30 rounded-xl p-4">
                <p className="text-gray-400 text-xs mb-1">💵 Disponible</p>
                <p className="text-2xl font-bold text-emerald-400">${(estadisticas.totalIngresos - estadisticas.totalGastos).toFixed(0)}</p>
              </div>
              <div className="bg-gradient-to-br from-rose-900/30 to-pink-900/30 backdrop-blur border border-rose-500/30 rounded-xl p-4">
                <p className="text-gray-400 text-xs mb-1">📈 Ahorro</p>
                <p className="text-2xl font-bold text-rose-400">{estadisticas.porcentajeAhorrado.toFixed(0)}%</p>
              </div>
              <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur border border-purple-500/30 rounded-xl p-4">
                <p className="text-gray-400 text-xs mb-1">🎯 Ingresos</p>
                <p className="text-2xl font-bold text-purple-400">${estadisticas.totalIngresos.toFixed(0)}</p>
              </div>
            </div>

            {/* DESGLOSE POR CATEGORÍA */}
            <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-4">
              <h3 className="font-bold mb-4 text-lg">Gastos por Categoría</h3>
              <div className="space-y-3">
                {Object.entries(estadisticas.categoriasDesglose)
                  .sort((a, b) => b[1] - a[1])
                  .map(([categoria, monto]) => {
                    const porcentaje = (monto / Math.max(estadisticas.totalGastos, 1)) * 100;
                    return (
                      <div key={categoria}>
                        <div className="flex justify-between mb-1">
                          <span className="font-semibold text-sm">{categoria}</span>
                          <span className="text-rose-400 text-sm">${monto.toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full ${ColorPorCategoria[categoria] || 'bg-gray-500'} transition-all`}
                            style={{ width: `${Math.min(porcentaje, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* TAB: HISTORIAL */}
        {activeTab === 'historial' && (
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <History size={24} className="text-rose-400" />
              Historial
            </h2>
            {gastos.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>Sin gastos registrados</p>
                <p className="text-sm">Sube tu primer ticket 📷</p>
              </div>
            ) : (
              <div className="space-y-3">
                {gastos.map((gasto, idx) => (
                  <div key={idx} className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-lg p-3 hover:border-rose-500/30 transition">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-white text-sm truncate">{gasto.descripcion}</h4>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          <span className={`text-xs px-2 py-1 rounded-full text-white ${ColorPorCategoria[gasto.categoria] || 'bg-gray-600'}`}>
                            {gasto.categoria}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(gasto.created_at).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <div>
                          <p className="font-bold text-rose-400">${parseFloat(gasto.monto).toFixed(2)}</p>
                        </div>
                        <button
                          onClick={() => eliminarGasto(gasto.id)}
                          className="p-2 hover:bg-red-900/30 rounded-lg transition"
                        >
                          <Trash2 size={16} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: CHAT */}
        {activeTab === 'chat' && (
          <div className="space-y-4">
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-4 min-h-64 max-h-64 overflow-y-auto">
              <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                {chat}
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && enviarMensaje()}
                placeholder="Pregunta a Rose..."
                className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-rose-500/50"
              />
              <button
                onClick={enviarMensaje}
                className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-4 py-2 rounded-lg font-semibold transition active:scale-95"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* NAVEGACIÓN INFERIOR MÓVIL (FIJA) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur border-t border-rose-900/30">
        <div className="flex gap-1 p-2">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-lg transition text-xs font-semibold ${
              activeTab === 'camera'
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white'
                : 'text-gray-300 hover:bg-rose-900/20'
            }`}
          >
            <Camera size={20} />
            <span>Cámara</span>
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-lg transition text-xs font-semibold ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white'
                : 'text-gray-300 hover:bg-rose-900/20'
            }`}
          >
            <BarChart3 size={20} />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('historial')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-lg transition text-xs font-semibold ${
              activeTab === 'historial'
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white'
                : 'text-gray-300 hover:bg-rose-900/20'
            }`}
          >
            <History size={20} />
            <span>Historial</span>
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-lg transition text-xs font-semibold ${
              activeTab === 'chat'
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white'
                : 'text-gray-300 hover:bg-rose-900/20'
            }`}
          >
            <MessageCircle size={20} />
            <span>Rose</span>
          </button>
        </div>
      </nav>
    </div>
  );
}