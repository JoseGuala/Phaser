import Phaser from 'phaser';
import { Ombra2D } from './Ombra2D';

// Decorats del mapa: nom de la propietat 'decor' de Tiled -> frame de decorats.png (48x48)
const DECORATS = { roure: 0, pi: 1, roca: 2, bota: 3, tron: 4, pou: 5, caixa: 6, tenda: 7 };
const ESCALA_DRAC = 1.5; // Drac més gran (80x80 -> 120x120 px)

export class OfficeScene extends Phaser.Scene {
  constructor() { super('OfficeScene'); }

  preload() {
    this.load.image('tiles_regne', '/assets/tilesets/medieval.png');
    this.load.tilemapTiledJSON('mapa_regne', '/assets/maps/regne.json');
    this.load.spritesheet('decorats', '/assets/sprites/decorats.png', { frameWidth: 48, frameHeight: 48 });
    // Drac de gel (f6_frostdrake, Duelyst · CC0): frames de 80x80
    // Frames 0-7 = córrer | Frames 8-25 = quiet (respiració)
    this.load.spritesheet('drac', '/assets/sprites/drac.png', { frameWidth: 80, frameHeight: 80 });
  }

  create() {
    const map = this.make.tilemap({ key: 'mapa_regne' });
    const tileset = map.addTilesetImage('medieval_tiles', 'tiles_regne');
    map.createLayer('Terra', tileset, 0, 0);
    this.capaParets = map.createLayer('Parets', tileset, 0, 0);
    this.capaParets?.setCollisionByProperty({ collides: true });

    // Llegim la capa 'Objectes' per trobar el spawn i dibuixar les zones
    this.zones = [];
    this.monitors = []; // [REPTE 2] Monitors del mapa
    this.decorats = this.physics.add.staticGroup(); // Arbres, roques, botes... (bloquegen el pas)
    map.getObjectLayer('Objectes')?.objects.forEach((obj) => {
      const props = this.obtenirPropietats(obj);
      const cx = obj.x + (obj.width || 0) / 2, cy = obj.y + (obj.height || 0) / 2;
      if (props.tipus === 'spawn') {
        this.jugador = this.physics.add.sprite(cx, cy, 'drac', 8).setScale(ESCALA_DRAC); // Frame 8 = quiet mirant a la dreta
        // Hitbox petit als peus (16x12 px) desplaçat (32, 52) dins del frame 80x80 (Phaser l'escala x1.5)
        this.jugador.body.setSize(16, 12);
        this.jugador.body.setOffset(32, 52);
        this.jugador.setCollideWorldBounds(true); // Evita sortir dels marges del mapa
        // Activa el debug visual (requadre rosa als peus). Comenta-ho un cop validat!
        // this.physics.world.createDebugGraphic();
        // Bloqueja el pas contra les rajoles de 'Parets' amb collides: true
        if (this.capaParets) this.physics.add.collider(this.jugador, this.capaParets);
        // Ombra dinàmica (Shadow2DDynamic): segueix l'animació i el gir del drac
        this.ombraDrac = new Ombra2D(this, this.jugador, { dinamica: true, peuY: 0.8 });
      }
      // Decorats amb ombra estàtica (Shadow2DStatic) i col·lisió a la base
      if (props.tipus === 'decor' && props.decor in DECORATS) {
        const base = obj.y + obj.height;
        const deco = this.decorats.create(cx, base, 'decorats', DECORATS[props.decor]).setOrigin(0.5, 1).refreshBody();
        deco.body.setSize(20, 10, false).setOffset(14, 38); // Només la base bloqueja el pas
        deco.setDepth(base); // Ordenació 2.5D per la Y dels peus
        new Ombra2D(this, deco, { dinamica: false, peuY: 1 });
      }
      // Dins del forEach d'Objectes a create(): registrem cada sala de reunions
      if (props.tipus === 'zona') {
        const rect = new Phaser.Geom.Rectangle(obj.x, obj.y, obj.width, obj.height);
        this.zones.push({ nom: props.nomSala || 'Sala', rect });
        this.add.rectangle(cx, cy, obj.width, obj.height, 0x10b981, 0.18).setStrokeStyle(1.5, 0x10b981).setDepth(1);
        this.add.text(cx, obj.y + 12, props.nomSala || 'Sala', { fontSize: '11px', color: '#a7f3d0' }).setOrigin(0.5).setDepth(2000);
      }
      // [REPTE 2] Registrem els monitors per calcular la proximitat
      if (props.tipus === 'monitor') {
        this.monitors.push({ titol: props.titol || 'Monitor', x: cx, y: cy });
        this.add.rectangle(cx, cy, 14, 10, 0xf59e0b).setStrokeStyle(1, 0xffffff).setDepth(1);
        this.add.text(cx, cy - 12, props.titol || 'Monitor', { fontSize: '10px', color: '#fde68a' }).setOrigin(0.5).setDepth(2000);
      }
    });
    this.physics.add.collider(this.jugador, this.decorats);
    this.zonaActual = null; // Guarda la sala on som ara per detectar canvis
    this.monitorActual = null; // [REPTE 2] Monitor proper actual

    // Inicialitzem l'etiqueta del nom, les animacions i el teclat
    this.etiqueta = this.add.text(this.jugador.x, this.jugador.y - 28 * ESCALA_DRAC, 'Drac',
      { fontSize: '13px', fontFamily: 'sans-serif', color: '#ffffff', backgroundColor: '#0f172a88' }).setOrigin(0.5).setDepth(2000);
    this.crearAnimacions();
    this.cursors = this.input.keyboard.createCursorKeys();
    this.teclesWASD = this.input.keyboard.addKeys('W,A,S,D');
    this.teclaShift = this.input.keyboard.addKey('SHIFT'); // [REPTE 1] Mode sprint
  }

  // El drac només està dibuixat mirant a la dreta: 1 animació de córrer + 1 de quiet
  crearAnimacions() {
    this.anims.create({
      key: 'caminar',
      frames: this.anims.generateFrameNumbers('drac', { start: 0, end: 7 }),
      frameRate: 12, repeat: -1
    });
    this.anims.create({
      key: 'quiet',
      frames: this.anims.generateFrameNumbers('drac', { start: 8, end: 25 }),
      frameRate: 12, repeat: -1
    });
  }

  update() {
    if (!this.jugador) return;
    let vx = 0, vy = 0;
    if (this.cursors.left.isDown || this.teclesWASD.A.isDown)  vx = -1;
    if (this.cursors.right.isDown || this.teclesWASD.D.isDown) vx =  1;
    if (this.cursors.up.isDown || this.teclesWASD.W.isDown)    vy = -1;
    if (this.cursors.down.isDown || this.teclesWASD.S.isDown)  vy =  1;

    // [REPTE 1] Shift: de 160 a 260 px/s i animació més ràpida
    const sprint = this.teclaShift.isDown;
    this.jugador.anims.timeScale = sprint ? 1.6 : 1.0;

    // Normalitzem perquè caminar en diagonal no sigui un 41% més ràpid
    const vel = new Phaser.Math.Vector2(vx, vy).normalize().scale(sprint ? 260 : 160);
    this.jugador.setVelocity(vel.x, vel.y);

    // Esquerra = sprite girat (flipX); amunt/avall mantenen l'última mirada horitzontal
    if (vx < 0) this.jugador.setFlipX(true);
    if (vx > 0) this.jugador.setFlipX(false);
    this.jugador.anims.play(vx !== 0 || vy !== 0 ? 'caminar' : 'quiet', true); // true = no reiniciïs si ja sona
    this.etiqueta.setPosition(this.jugador.x, this.jugador.y - 28 * ESCALA_DRAC);
    this.jugador.setDepth(this.jugador.y + 18 * ESCALA_DRAC); // Ordenació 2.5D: passa per davant o darrere dels arbres
    this.comprovarZones();
    this.comprovarMonitors(); // [REPTE 2]
  }

  // Al final de update(): comprovem si els peus del drac són dins d'alguna zona
  comprovarZones() {
    const peuY = this.jugador.y + 18 * ESCALA_DRAC; // Punt exacte dels peus (centre del hitbox)
    const trobada = this.zones.find((z) => Phaser.Geom.Rectangle.Contains(z.rect, this.jugador.x, peuY)) || null;
    if (trobada?.nom !== this.zonaActual?.nom) {
      this.zonaActual = trobada;
      this.game.events.emit('canvi-zona', trobada ? { nom: trobada.nom } : null);
    }
  }

  // [REPTE 2] Avisa a Vue quan el drac és a menys de 40 px d'un monitor
  comprovarMonitors() {
    const proper = this.monitors.find((mon) =>
      Phaser.Math.Distance.Between(this.jugador.x, this.jugador.y, mon.x, mon.y) < 40) || null;
    if (proper?.titol !== this.monitorActual?.titol) {
      this.monitorActual = proper;
      this.game.events.emit('a-prop-monitor', proper ? { titol: proper.titol } : null);
    }
  }

  obtenirPropietats(obj) {
    const res = {}; (obj.properties || []).forEach((p) => { res[p.name] = p.value; }); return res;
  }
}
