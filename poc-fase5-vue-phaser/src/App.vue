<script setup>
import { ref, onBeforeUnmount, watch } from 'vue';
import PhaserCanvas from './components/PhaserCanvas.vue';
import { useRealtime } from './composables/useRealtime.js';

const zonaActiva = ref(null); // Guarda { nom, titolMonitor, streamUrl } o null
const refCanvas = ref(null);   // Referència al component pont PhaserCanvas
const modalObert = ref(false); // Estat d'obertura de la finestra modal gran
const preparat = ref(false);   // [FASE 5] Phaser ja coneix el spawn real

// Perfil local editable abans i després de connectar.
const elMeuNom = ref('Alumne');
const elMeuColor = ref('#10b981');
const idsPropers = ref([]);
const volumSala = ref(0);
const {
  estatXarxa, usuarisRemots, connectar,
  enviarMoviment, enviarPerfil, desconnectar
} = useRealtime();

watch(usuarisRemots, (tots) => {
  refCanvas.value?.enviarJugadors(tots);
});
function aplicarPerfil() {
  const perfil = {
    nom: elMeuNom.value.trim() || 'Convidat',
    color: elMeuColor.value
  };
  refCanvas.value?.actualitzarPerfil(perfil);
  enviarPerfil(perfil);
}
function iniciarConnexio(posicio) {
  preparat.value = true;
  aplicarPerfil();
  connectar({
    nom: elMeuNom.value.trim() || 'Convidat',
    color: elMeuColor.value
  }, posicio);
}
onBeforeUnmount(desconnectar);

// [ADAPTACIÓ FASE 4 -> 5] El <video> de la sala viu a Vue: hi apliquem el volum (0.0 a 1.0)
// que calcula Multiplayer.js segons la distància al centre de la sala.
const videoMini = ref(null);
const videoGran = ref(null);
function aplicarVolum() {
  for (const v of [videoMini.value, videoGran.value]) {
    if (v) v.volume = volumSala.value / 100;
  }
}
watch(volumSala, aplicarVolum);

function obrirModalGran() {
  modalObert.value = true;
  refCanvas.value?.bloquejarControls(true); // <-- CLAU: Atura el teclat de Phaser
}
function tancarModalGran() {
  modalObert.value = false;
  refCanvas.value?.bloquejarControls(false); // <-- CLAU: Reactiva el teclat de Phaser
}
</script>

<template>
  <main class="layout-oficina">
    <PhaserCanvas
      ref="refCanvas"
      @canvi-zona="zonaActiva = $event"
      @preparat="iniciarConnexio"
      @moviment-local="enviarMoviment"
      @proximitat-canviada="idsPropers = $event"
      @volum-sala="volumSala = $event"
    />

    <aside class="panell-lateral">
      <h2>Oficina Virtual</h2>
      <section class="multijugador">
        <h2>El meu perfil</h2>
        <p role="status">Xarxa: {{ estatXarxa }}</p>
        <fieldset
          @focusin="refCanvas?.bloquejarControls(true)"
          @focusout="refCanvas?.bloquejarControls(false)"
        >
          <label>Nom
            <input v-model="elMeuNom" maxlength="24"
              @change="aplicarPerfil" />
          </label>
          <label>Color
            <input v-model="elMeuColor" type="color"
              @input="aplicarPerfil" />
          </label>
        </fieldset>
      </section>
      <section class="multijugador" aria-label="Radar">
        <h2>Companys ({{ Object.keys(usuarisRemots).length }})</h2>
        <p v-if="!Object.keys(usuarisRemots).length">Encara no hi ha companys.</p>
        <ul>
          <li v-for="u in usuarisRemots" :key="u.id">
            <span class="led"
              :class="{ proper: idsPropers.includes(u.id) }"></span>
            {{ u.nom }}:
            {{ idsPropers.includes(u.id) ? 'A prop' : 'Lluny' }}
          </li>
        </ul>
        <p>Volum de sala: {{ volumSala }}%</p>
        <small>El LED indica distància. No obre cap trucada.</small>
      </section>

      <p v-if="!zonaActiva" class="estat-passadis">Estàs al passadís</p>
      <!-- Monitor en miniatura: apareix quan zonaActiva té streamUrl -->
      <div v-if="zonaActiva?.streamUrl" class="monitor-mini" @click="obrirModalGran">
        <div class="monitor-capcalera"><span>{{ zonaActiva.titolMonitor }}</span><span>Ampliar</span></div>
        <!-- Punt d'injecció de SimplePeer (:srcObject="remoteStream") -->
        <video ref="videoMini" :src="zonaActiva.streamUrl" autoplay loop playsinline @loadedmetadata="aplicarVolum"></video>
      </div>
    </aside>

    <!-- Finestra Modal Gran superposada a tota la pantalla -->
    <div v-if="modalObert && zonaActiva" class="modal-overlay" @click.self="tancarModalGran">
      <div class="modal-caixa">
        <div class="modal-capcalera">
          <h3>{{ zonaActiva.nom }} · Vista Ampliada</h3>
          <button class="boto-tancar" @click="tancarModalGran">Tancar [X]</button>
        </div>
        <video ref="videoGran" :src="zonaActiva.streamUrl" autoplay controls loop class="video-gran" @loadedmetadata="aplicarVolum"></video>
      </div>
    </div>
  </main>
</template>

<style scoped>
.layout-oficina { display: flex; gap: 20px; padding: 20px; background: #0f172a; min-height: 100vh; color: #f8fafc; font-family: sans-serif; }
.panell-lateral { width: 320px; background: #1e293b; padding: 16px; border-radius: 12px; border: 1px solid #334155; }
.monitor-mini { margin-top: 16px; background: #0f172a; border: 2px solid #10b981; border-radius: 10px; overflow: hidden; cursor: pointer; transition: transform 0.15s; }
.monitor-mini:hover { transform: scale(1.02); border-color: #34d399; }
.monitor-capcalera { display: flex; justify-content: space-between; padding: 8px 12px; background: #064e3b; font-size: 13px; font-weight: bold; }
.monitor-mini video { width: 100%; display: block; }

/* Estils de la Finestra Modal Gran */
.modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.85); display: flex; align-items: center; justify-content: center; z-index: 50; }
.modal-caixa { background: #1e293b; border: 2px solid #38bdf8; border-radius: 14px; width: 90%; max-width: 820px; overflow: hidden; box-shadow: 0 25px 50px rgba(0,0,0,0.6); }
.modal-capcalera { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; background: #0f172a; border-bottom: 1px solid #334155; }
.boto-tancar { background: #ef4444; color: white; border: none; padding: 6px 14px; border-radius: 6px; font-weight: bold; cursor: pointer; }
.video-gran { width: 100%; max-height: 70vh; display: block; background: black; }
</style>
