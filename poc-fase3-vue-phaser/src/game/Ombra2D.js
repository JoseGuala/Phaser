import Phaser from 'phaser';

// Port a Phaser 4 de Shadow2D-Unity (MIT · Amir Hawasly · github.com/amirishere101/Shadow2D-Unity)
// Mateixa idea que l'original: l'ombra és una còpia del sprite, tenyida de negre i semitransparent,
// girada 12.5° i aixafada al 90% en vertical, col·locada sota el personatge.
// Valors per defecte de Resources/Shadow2DConfigDefault.asset
const CONFIG = {
  rotacioZ: 12.5,              // defaultRotationZ (graus; a Unity positiu = antihorari)
  escala: { x: 1, y: 0.9 },    // defaultScale
  color: 0x000000,             // defaultShadowColor (r,g,b)
  alpha: 0.5,                  // defaultShadowColor (a)
  profunditat: 2               // Per sota de tots els objectes, per sobre del terra
};

export class Ombra2D {
  // dinamica = true  -> com Shadow2DDynamic: copia el frame i el flipX a cada fotograma
  // dinamica = false -> com Shadow2DStatic: es calcula un sol cop
  // peuY = alçada dels peus dins del frame (0 = dalt, 1 = baix): és el punt de pivot de l'ombra
  constructor(scene, caster, { dinamica = false, peuY = 1 } = {}) {
    this.caster = caster;
    this.peuY = peuY;
    this.sprite = scene.add.sprite(0, 0, caster.texture.key, caster.frame.name)
      .setTint(CONFIG.color).setTintMode(Phaser.TintModes.FILL)
      .setAlpha(CONFIG.alpha)
      .setOrigin(0.5, peuY)
      .setAngle(-CONFIG.rotacioZ) // Phaser gira en sentit horari: invertim el signe de Unity
      .setDepth(CONFIG.profunditat);
    this.sincronitzar();
    // LateUpdate de Unity = 'postupdate' de Phaser (després de físiques i animacions)
    if (dinamica) scene.events.on('postupdate', this.sincronitzar, this);
  }

  sincronitzar() {
    const c = this.caster;
    this.sprite.setPosition(c.x, c.y + (this.peuY - c.originY) * c.displayHeight);
    this.sprite.setFrame(c.frame.name);
    this.sprite.setFlipX(c.flipX);
    this.sprite.setScale(c.scaleX * CONFIG.escala.x, c.scaleY * CONFIG.escala.y);
  }
}
