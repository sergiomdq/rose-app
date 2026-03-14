"use client";
import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function RoseApp() {
  const [loading, setLoading] = useState(false);
  const [chat, setChat] = useState("La niebla te rodea... ¿Qué gasto has hecho hoy?");

  async function handleImage(e: any) {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setChat("Rose está analizando el ticket... separando la realidad de las sombras.");

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      
      const res = await fetch('/api/analizar-ticket', {
        method: 'POST',
        body: JSON.stringify({ imagenBase64: base64 }),
      });

      const data = await res.json();
      
      // Guardar cada categoría en Supabase
      for (const item of data.desglose) {
        await supabase.from('gastos').insert({
          descripcion: item.producto,
          monto: item.precio,
          categoria: item.categoria
        });
      }

      setChat(data.mensajeRose);
      setLoading(false);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div style={{ color: '#e0e0e0', minHeight: '100vh', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1 style={{ color: '#b30000', fontSize: '3rem', marginBottom: '0' }}>ROSE</h1>
      <p style={{ fontStyle: 'italic', marginBottom: '40px' }}>"Cada moneda cuenta antes de que la oscuridad llegue"</p>

      <div style={{ width: '100%', maxWidth: '400px', backgroundColor: '#1e1e1e', borderRadius: '15px', padding: '20px', border: '1px solid #333' }}>
        <label style={{ display: 'block', padding: '20px', backgroundColor: '#b30000', borderRadius: '10px', textAlign: 'center', cursor: 'pointer', fontWeight: 'bold' }}>
          📷 ESCANEAR TICKET
          <input type="file" accept="image/*" capture="environment" hidden onChange={handleImage} />
        </label>

        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#000', borderRadius: '10px', borderLeft: '4px solid #b30000' }}>
          <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '5px' }}>ROSE DICE:</p>
          <p style={{ margin: 0, lineHeight: '1.4' }}>{loading ? "Rose está mirando a través de la niebla..." : chat}</p>
        </div>
      </div>
    </div>
  );
}