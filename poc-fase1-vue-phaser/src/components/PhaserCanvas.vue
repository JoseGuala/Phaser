<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import Phaser from 'phaser';
import { MainScene } from '../game/MainScene';

const props = defineProps(['nomUsuari', 'colorAvatar', 'estat', 'pausat']);
const contenidor = ref(null);
let game = null;

// [REPTE 1] Converteix '#ff0000' a número per a Phaser
const hexANumero = (hex) => parseInt(hex.replace('#', ''), 16);

// [REPTE 3] Pausa o reprèn l'escena
const aplicarPausa = (pausat) => {
  const escena = game?.scene.getScene('MainScene');
  if (pausat) escena?.scene.pause();
  else escena?.scene.resume();
};

onMounted(() => {
  game = new Phaser.Game({ type: Phaser.AUTO, width: 640, height: 400,
    backgroundColor: '#1e293b', parent: contenidor.value, scene: [MainScene] });
  // Sincronitza els valors actuals només acabar d'arrencar (útil amb v-if)
  game.events.once('ready', () => {
    const escena = game?.scene.getScene('MainScene');
    escena?.actualitzarNom(props.nomUsuari);
    escena?.canviarColor(hexANumero(props.colorAvatar));
    escena?.actualitzarEstat(props.estat);
    aplicarPausa(props.pausat);
  });
});
onUnmounted(() => game?.destroy(true));

// Al MATEIX nivell que onMounted (MAI dins d'onMounted)
watch(() => props.nomUsuari, (nouNom) => {
  const escena = game?.scene.getScene('MainScene');
  escena?.actualitzarNom(nouNom);
});

// [REPTE 1] Segon watch per al color
watch(() => props.colorAvatar, (nouColor) => {
  const escena = game?.scene.getScene('MainScene');
  escena?.canviarColor(hexANumero(nouColor));
});

// [REPTE 2] Watch per a l'estat
watch(() => props.estat, (nouEstat) => {
  const escena = game?.scene.getScene('MainScene');
  escena?.actualitzarEstat(nouEstat);
});

// [REPTE 3] Watch per a la pausa
watch(() => props.pausat, aplicarPausa);
</script>
<template><div ref="contenidor"></div></template>
