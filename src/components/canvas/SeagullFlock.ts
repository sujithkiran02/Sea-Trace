import * as THREE from 'three';

interface Seagull {
  mesh: THREE.Group;
  leftWing: THREE.Mesh;
  rightWing: THREE.Mesh;
  center: THREE.Vector3;
  radius: number;
  speed: number;
  angle: number;
  height: number;
  flapSpeed: number;
  flapOffset: number;
}

export class SeagullFlock {
  public group: THREE.Group;
  private seagulls: Seagull[] = [];

  constructor(count = 10) {
    this.group = new THREE.Group();

    // Reusable wing geometry & material
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.lineTo(2.2, 0.4);
    wingShape.lineTo(2.0, -0.6);
    wingShape.closePath();

    const wingGeo = new THREE.ShapeGeometry(wingShape);
    const bodyGeo = new THREE.ConeGeometry(0.35, 2.2, 5);
    bodyGeo.rotateX(Math.PI / 2);

    const gullMat = new THREE.MeshBasicMaterial({ color: '#F0EBE1', side: THREE.DoubleSide });

    for (let i = 0; i < count; i++) {
      const birdGroup = new THREE.Group();

      const body = new THREE.Mesh(bodyGeo, gullMat);
      birdGroup.add(body);

      // Left wing
      const leftWing = new THREE.Mesh(wingGeo, gullMat);
      leftWing.position.set(-0.2, 0.1, 0);
      leftWing.rotation.y = Math.PI;
      birdGroup.add(leftWing);

      // Right wing
      const rightWing = new THREE.Mesh(wingGeo, gullMat);
      rightWing.position.set(0.2, 0.1, 0);
      birdGroup.add(rightWing);

      const scale = 0.55 + Math.random() * 0.35;
      birdGroup.scale.set(scale, scale, scale);

      this.group.add(birdGroup);

      this.seagulls.push({
        mesh: birdGroup,
        leftWing,
        rightWing,
        center: new THREE.Vector3(
          (Math.random() - 0.5) * 60,
          35 + Math.random() * 25,
          (Math.random() - 0.5) * 60
        ),
        radius: 35 + Math.random() * 50,
        speed: 0.25 + Math.random() * 0.2,
        angle: Math.random() * Math.PI * 2,
        height: 38 + Math.random() * 30,
        flapSpeed: 3.5 + Math.random() * 2.0,
        flapOffset: Math.random() * Math.PI * 2,
      });
    }
  }

  public update(time: number) {
    for (let i = 0; i < this.seagulls.length; i++) {
      const g = this.seagulls[i];
      g.angle += g.speed * 0.015;

      const x = g.center.x + Math.cos(g.angle) * g.radius;
      const z = g.center.z + Math.sin(g.angle) * g.radius;
      const y = g.height + Math.sin(time * 0.5 + i) * 3.0;

      // Calculate tangent forward direction for realistic flight banking
      const nextAngle = g.angle + 0.05;
      const nextX = g.center.x + Math.cos(nextAngle) * g.radius;
      const nextZ = g.center.z + Math.sin(nextAngle) * g.radius;

      g.mesh.position.set(x, y, z);
      g.mesh.lookAt(nextX, y, nextZ);

      // Subtle wing flap & banking roll
      const flap = Math.sin(time * g.flapSpeed + g.flapOffset);
      g.leftWing.rotation.z = flap * 0.45;
      g.rightWing.rotation.z = -flap * 0.45;
      g.mesh.rotation.z = -0.25; // banking into the turn
    }
  }
}
