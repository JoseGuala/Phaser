<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import PhaserCanvas from './components/PhaserCanvas.vue';

const zonaActiva = ref(null); // null = passadís | { nom: '...' } = dins d'una sala
const monitorProper = ref(null); // [REPTE 2] null | { titol: '...' }
const segons = ref(0); // [REPTE 3] Temps dins la sala

// [REPTE 3] Reiniciem el comptador a cada canvi de zona
const onCanviZona = (zona) => {
  zonaActiva.value = zona;
  segons.value = 0;
};

// [REPTE 3] Incrementem cada segon mentre zonaActiva no sigui null
let interval = null;
onMounted(() => {
  interval = setInterval(() => { if (zonaActiva.value) segons.value++; }, 1000);
});
onUnmounted(() => clearInterval(interval));
</script>

<template>
  <main style="display: flex; gap: 20px; padding: 20px; font-family: sans-serif;">
    <PhaserCanvas @canvi-zona="onCanviZona" @a-prop-monitor="monitorProper = $event" />

    <aside style="width: 280px; background: #1e293b; color: white; padding: 18px; border-radius: 12px;">
      <h3>Estat de Proximitat</h3>
      <div v-if="zonaActiva" style="background: #065f46; border: 2px solid #10b981; padding: 14px; border-radius: 8px;">
        <strong>Dins de: {{ zonaActiva.nom }}</strong>
        <p style="margin: 6px 0 0; font-size: 13px; color: #a7f3d0;">Àudio de sala actiu (llest per Fase 4)</p>
        <!-- [REPTE 3] -->
        <p style="margin: 6px 0 0; font-size: 13px; color: #a7f3d0;">Temps dins la sala: {{ segons }} s</p>
      </div>
      <div v-else style="background: #334155; padding: 14px; border-radius: 8px;">
        <strong>Passadís / Zona comuna</strong>
        <p style="margin: 6px 0 0; font-size: 13px; color: #cbd5e1;">Sense conversa activa</p>
      </div>
      <!-- [REPTE 2] -->
      <div v-if="monitorProper" style="margin-top: 12px; background: #78350f; border: 2px solid #f59e0b; padding: 14px; border-radius: 8px;">
        <strong>A prop de: {{ monitorProper.titol }}</strong>
      </div>
      <p style="margin-top: 16px; font-size: 12px; color: #94a3b8;">Controls: WASD o Fletxes per moure el drac (Shift: córrer).</p>
    </aside>
  </main>
</template>
