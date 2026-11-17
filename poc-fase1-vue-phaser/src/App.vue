<script setup>
import { ref } from 'vue';
// Importem el component pont que conté el <canvas> de Phaser
import PhaserCanvas from './components/PhaserCanvas.vue';

// Variable reactiva que guarda el nom escrit a la caixa de text
const nom = ref('Anna');
// Booleà per muntar/desmuntar el joc i verificar onMounted / onUnmounted
const mostrarJoc = ref(true);
// [REPTE 1] Color de l'avatar
const colorAvatar = ref('#10b981');
// [REPTE 2] Estat de l'usuari
const estat = ref('Disponible');
// [REPTE 3] Pausa del Game Loop
const pausat = ref(false);
</script>

<template>
  <main class="contenidor-app">
    <!-- Tota la interfície d'usuari (inputs, botons) es fa en HTML/CSS dins de Vue -->
    <div class="controls">
      <input v-model="nom" placeholder="Escriu el teu nom d'usuari..." />
      <button @click="mostrarJoc = !mostrarJoc">
        {{ mostrarJoc ? 'Amaga el llenç' : 'Mostra el llenç' }}
      </button>
      <!-- [REPTE 1] Selector de color -->
      <input type="color" v-model="colorAvatar" />
      <!-- [REPTE 2] Indicador d'estat -->
      <select v-model="estat">
        <option>Disponible</option>
        <option>Ocupat</option>
        <option>Absent</option>
      </select>
      <!-- [REPTE 3] Pausa / Reprèn -->
      <button @click="pausat = !pausat">
        {{ pausat ? 'Reprèn' : 'Pausa' }}
      </button>
    </div>

    <!-- Passem 'nom' cap avall amb :nomUsuari i controlem el cicle amb v-if -->
    <PhaserCanvas v-if="mostrarJoc" :nomUsuari="nom" :colorAvatar="colorAvatar"
      :estat="estat" :pausat="pausat" />
  </main>
</template>
