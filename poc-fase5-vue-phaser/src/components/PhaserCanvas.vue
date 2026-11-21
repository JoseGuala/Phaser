<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import Phaser from 'phaser';
import { OfficeScene } from '../game/OfficeScene.js';

const contenidorJoc = ref(null);
let game = null;
const emit = defineEmits([
  'canviZona',
  'preparat',
  'movimentLocal',
  'proximitatCanviada',
  'volumSala',
]);

// Dades planes de Vue cap al bus del joc.
function enviarJugadors(tots) {
  game?.events.emit('xarxa:jugadors', tots);
}
function actualitzarPerfil(perfil) {
  game?.events.emit('perfil:local', perfil);
}
// Funció pont: rep l'ordre de App.vue i la delega a l'escena de Phaser
function bloquejarControls(estat) {
  game?.scene.getScene('OfficeScene')?.bloquejarControls(estat);
}
defineExpose({
  enviarJugadors, actualitzarPerfil, bloquejarControls
});

onMounted(() => {
  game = new Phaser.Game({
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: contenidorJoc.value,
    physics: { default: 'arcade', arcade: { debug: false } },
    scene: [OfficeScene],
    callbacks: {
      preBoot(g) {
        // Registrem listeners abans de create() per no perdre els primers missatges.
        g.events.on('canvi-zona', (dadaZona) => emit('canviZona', dadaZona));
        g.events.on('preparat', (pos) => emit('preparat', pos));
        g.events.on('proximitat-canviada', (ids) => {
          emit('proximitatCanviada', ids);
        });
        g.events.on('volum-sala', (volum) => emit('volumSala', volum));
        g.events.on('jugador-mogut-local', (pos) => {
          emit('movimentLocal', pos);
        });
      },
    },
  });
});

onBeforeUnmount(() => {
  game?.destroy(true);
});
</script>

<template>
  <div ref="contenidorJoc" class="marc-canvas"></div>
</template>
