import Phaser from 'phaser';

/** Affine ground projection: the sprite's lateral axis never rotates or flips. */
export class ProjectedShadow extends Phaser.GameObjects.Image {
  shear = 0;
  private readonly projection = new Phaser.GameObjects.Components.TransformMatrix();
  private matrix(camera: Phaser.Cameras.Scene2D.Camera) {
    const footY = camera.roundPixels ? Math.floor(this.y) : this.y;
    return this.projection.setTransform(1,0,this.shear,1,-this.shear*footY,0);
  }
  renderWebGL(_renderer: Phaser.Renderer.WebGL.WebGLRenderer, src: ProjectedShadow, camera: Phaser.Cameras.Scene2D.Camera): void {
    camera.addToRenderList(src);
    (this.pipeline as Phaser.Renderer.WebGL.Pipelines.MultiPipeline).batchSprite(src,camera,this.matrix(camera));
  }
  renderCanvas(renderer: Phaser.Renderer.Canvas.CanvasRenderer, src: ProjectedShadow, camera: Phaser.Cameras.Scene2D.Camera): void {
    camera.addToRenderList(src);
    renderer.batchSprite(src,src.frame,camera,this.matrix(camera));
  }
}
