import * as THREE from 'three';
import { SCENE_CONFIG } from '../../constants/sceneConfig';
import { getWaterHeight } from '../../utils/waveMath';

/**
 * Creates a procedural corrugated steel normal map for shipping containers.
 */
function createContainerNormalTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#8080ff'; // neutral normal (0, 0, 1) in tangent space
    ctx.fillRect(0, 0, 128, 128);

    // Draw vertical corrugated ridges
    const stripeWidth = 8;
    for (let x = 0; x < 128; x += stripeWidth) {
      // Left slope (normal tilted left)
      ctx.fillStyle = '#6580ff';
      ctx.fillRect(x, 0, stripeWidth / 2, 128);
      // Right slope (normal tilted right)
      ctx.fillStyle = '#9b80ff';
      ctx.fillRect(x + stripeWidth / 2, 0, stripeWidth / 2, 128);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 2);
  return texture;
}

export class ProceduralShip {
  public group: THREE.Group;
  public funnelPosition: THREE.Vector3;
  public bowPosition: THREE.Vector3;
  public sternPosition: THREE.Vector3;

  private containersMesh: THREE.InstancedMesh | null = null;
  private radarMastBar: THREE.Mesh | null = null;
  private deckLightsGroup: THREE.Group;

  // Inertial physics state
  private currentY = 0;
  private currentPitch = 0;
  private currentRoll = 0;
  public speed = SCENE_CONFIG.ship.speed;

  constructor() {
    this.group = new THREE.Group();
    this.funnelPosition = new THREE.Vector3(0, 24, -30);
    this.bowPosition = new THREE.Vector3(0, 4, 58);
    this.sternPosition = new THREE.Vector3(0, 2, -56);
    this.deckLightsGroup = new THREE.Group();

    this.buildHull();
    this.buildSuperstructure();
    this.buildLashingBridges();
    this.buildDeckDetails();
    this.buildContainers();
    this.buildNavigationLights();

    this.group.add(this.deckLightsGroup);
  }

  /**
   * Builds the multi-section ship hull:
   * Upper navy/charcoal hull, white waterline stripe, red anti-fouling lower hull,
   * bulbous bow, raked prow, and transom stern.
   */
  private buildHull() {
    const { length, beam, hullHeight, upperHullColor, lowerHullColor, waterlineStripeColor, deckColor } =
      SCENE_CONFIG.ship;

    // --- 1. Upper Hull (Dark Navy / Charcoal) ---
    const upperHullGeo = new THREE.BoxGeometry(beam, hullHeight * 0.55, length);
    const upperHullMat = new THREE.MeshStandardMaterial({
      color: upperHullColor,
      roughness: 0.42,
      metalness: 0.28,
    });
    const upperHull = new THREE.Mesh(upperHullGeo, upperHullMat);
    upperHull.position.y = hullHeight * 0.28;
    upperHull.castShadow = true;
    upperHull.receiveShadow = true;
    this.group.add(upperHull);

    // --- 2. Waterline Stripe (Crisp Marine White Band) ---
    const stripeGeo = new THREE.BoxGeometry(beam + 0.08, 0.55, length);
    const stripeMat = new THREE.MeshStandardMaterial({
      color: waterlineStripeColor,
      roughness: 0.35,
      metalness: 0.1,
    });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.y = 0;
    this.group.add(stripe);

    // --- 3. Lower Submerged Hull (Anti-fouling Red Oxide) ---
    const lowerHullGeo = new THREE.BoxGeometry(beam * 0.94, hullHeight * 0.45, length * 0.96);
    const lowerHullMat = new THREE.MeshStandardMaterial({
      color: lowerHullColor,
      roughness: 0.65,
      metalness: 0.15,
    });
    const lowerHull = new THREE.Mesh(lowerHullGeo, lowerHullMat);
    lowerHull.position.y = -hullHeight * 0.22;
    lowerHull.castShadow = true;
    this.group.add(lowerHull);

    // --- 4. Pointed Raked Bow Section (Forward) ---
    const bowLength = 18;
    const bowShape = new THREE.Shape();
    bowShape.moveTo(0, 0);
    bowShape.lineTo(beam / 2, 0);
    bowShape.lineTo(0.5, bowLength);
    bowShape.lineTo(-0.5, bowLength);
    bowShape.lineTo(-beam / 2, 0);
    bowShape.closePath();

    const extrudeSettings = {
      depth: hullHeight * 0.6,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.4,
      bevelThickness: 0.4,
    };
    const bowUpperGeo = new THREE.ExtrudeGeometry(bowShape, extrudeSettings);
    bowUpperGeo.rotateX(-Math.PI / 2);
    const bowUpper = new THREE.Mesh(bowUpperGeo, upperHullMat);
    bowUpper.position.set(0, 0.2, length / 2);
    bowUpper.castShadow = true;
    this.group.add(bowUpper);

    // Lower Bow (Red Oxide)
    const bowLowerGeo = new THREE.ExtrudeGeometry(bowShape, {
      ...extrudeSettings,
      depth: hullHeight * 0.42,
    });
    bowLowerGeo.rotateX(Math.PI / 2);
    const bowLower = new THREE.Mesh(bowLowerGeo, lowerHullMat);
    bowLower.position.set(0, -0.1, length / 2 - 0.2);
    this.group.add(bowLower);

    // --- 5. Bulbous Bow (Submerged Torpedo Bulb under prow) ---
    const bulbGeo = new THREE.SphereGeometry(2.4, 16, 16);
    bulbGeo.scale(0.85, 0.9, 2.5);
    const bulbMesh = new THREE.Mesh(bulbGeo, lowerHullMat);
    bulbMesh.position.set(0, -hullHeight * 0.28, length / 2 + 12);
    bulbMesh.castShadow = true;
    this.group.add(bulbMesh);

    // --- 6. Rounded Transom Stern (Aft) ---
    const sternGeo = new THREE.CylinderGeometry(beam / 2, beam * 0.46, hullHeight * 0.6, 24, 1, false, 0, Math.PI);
    sternGeo.rotateY(Math.PI / 2);
    const sternUpper = new THREE.Mesh(sternGeo, upperHullMat);
    sternUpper.position.set(0, hullHeight * 0.28, -length / 2);
    sternUpper.castShadow = true;
    this.group.add(sternUpper);

    // --- 7. Main Deck Plating & Breakwater ---
    const deckGeo = new THREE.BoxGeometry(beam - 0.6, 0.35, length + bowLength * 0.8);
    const deckMat = new THREE.MeshStandardMaterial({
      color: deckColor,
      roughness: 0.8,
      metalness: 0.2,
    });
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.set(0, hullHeight * 0.55 + 0.15, 6);
    deck.receiveShadow = true;
    this.group.add(deck);

    // V-shaped Bow Breakwater Shield
    const breakwaterGeo = new THREE.BoxGeometry(beam * 0.75, 1.8, 0.4);
    const breakwater = new THREE.Mesh(breakwaterGeo, upperHullMat);
    breakwater.position.set(0, hullHeight * 0.55 + 1.1, length / 2 + 6);
    breakwater.rotation.y = 0;
    this.group.add(breakwater);
  }

  /**
   * Multi-deck accommodation block / bridge tower near stern,
   * with panoramic tinted bridge windows, wing walks, radar mast, and company funnel.
   */
  private buildSuperstructure() {
    const { superstructureColor, funnelColor } = SCENE_CONFIG.ship;
    const bridgeZ = -30;
    const baseDeckY = SCENE_CONFIG.ship.hullHeight * 0.55 + 0.3;

    const blockMat = new THREE.MeshStandardMaterial({
      color: superstructureColor,
      roughness: 0.38,
      metalness: 0.2,
    });

    const windowMat = new THREE.MeshStandardMaterial({
      color: '#0B1C2D',
      roughness: 0.1,
      metalness: 0.95,
      envMapIntensity: 2.0,
    });

    // 5-Tier stepped accommodation tower
    const towerGroup = new THREE.Group();
    towerGroup.position.set(0, baseDeckY, bridgeZ);

    const tierHeights = [3.2, 3.0, 2.8, 2.6, 2.4];
    let currentTierY = 0;

    for (let i = 0; i < tierHeights.length; i++) {
      const h = tierHeights[i];
      const w = 15 - i * 0.8;
      const d = 16 - i * 0.9;

      const tierGeo = new THREE.BoxGeometry(w, h, d);
      const tierMesh = new THREE.Mesh(tierGeo, blockMat);
      tierMesh.position.y = currentTierY + h / 2;
      tierMesh.castShadow = true;
      tierMesh.receiveShadow = true;
      towerGroup.add(tierMesh);

      // Window strips on tiers
      const winW = w - 1.2;
      const winGeo = new THREE.BoxGeometry(winW, 0.7, d + 0.08);
      const winMesh = new THREE.Mesh(winGeo, windowMat);
      winMesh.position.y = currentTierY + h * 0.65;
      towerGroup.add(winMesh);

      currentTierY += h;
    }

    // Top Navigation Bridge with Extended Bridge Wings (Protruding past beam)
    const bridgeWingW = 23; // wider than ship beam so officers can see hull sides
    const bridgeWingGeo = new THREE.BoxGeometry(bridgeWingW, 1.8, 4.2);
    const bridgeWing = new THREE.Mesh(bridgeWingGeo, blockMat);
    bridgeWing.position.set(0, currentTierY + 0.9, 0);
    bridgeWing.castShadow = true;
    towerGroup.add(bridgeWing);

    // Panoramic bridge window glass on navigation bridge
    const panoWinGeo = new THREE.BoxGeometry(bridgeWingW - 1.5, 0.9, 4.3);
    const panoWin = new THREE.Mesh(panoWinGeo, windowMat);
    panoWin.position.set(0, currentTierY + 1.1, 0);
    towerGroup.add(panoWin);

    // Radar Mast and Communications Radomes
    const mastHeight = 8.0;
    const mastGeo = new THREE.CylinderGeometry(0.25, 0.4, mastHeight, 8);
    const mastMat = new THREE.MeshStandardMaterial({ color: '#DCE2EC', metalness: 0.5, roughness: 0.3 });
    const mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.set(0, currentTierY + 1.8 + mastHeight / 2, 0);
    towerGroup.add(mast);

    // Rotating Radar Scanner Bar
    const radarBarGeo = new THREE.BoxGeometry(4.0, 0.3, 0.5);
    const radarBarMat = new THREE.MeshStandardMaterial({ color: '#F0ECE1', metalness: 0.2 });
    this.radarMastBar = new THREE.Mesh(radarBarGeo, radarBarMat);
    this.radarMastBar.position.set(0, currentTierY + mastHeight + 1.2, 0);
    towerGroup.add(this.radarMastBar);

    // Satellite Communication Domes (Spheres)
    const radomeGeo = new THREE.SphereGeometry(0.85, 12, 12);
    const radome1 = new THREE.Mesh(radomeGeo, blockMat);
    radome1.position.set(-2.5, currentTierY + 2.2, -1.0);
    towerGroup.add(radome1);
    const radome2 = new THREE.Mesh(radomeGeo, blockMat);
    radome2.position.set(2.5, currentTierY + 2.2, -1.0);
    towerGroup.add(radome2);

    this.group.add(towerGroup);

    // --- Modern Aerodynamic Funnel / Exhaust Stack ---
    const funnelGroup = new THREE.Group();
    funnelGroup.position.set(0, baseDeckY, bridgeZ - 13);

    const funnelGeo = new THREE.BoxGeometry(4.8, 9.5, 7.5);
    const funnelMat = new THREE.MeshStandardMaterial({
      color: funnelColor,
      roughness: 0.35,
      metalness: 0.3,
    });
    const funnel = new THREE.Mesh(funnelGeo, funnelMat);
    funnel.position.y = 4.75;
    funnel.rotation.x = -0.12; // sleek aft rake
    funnel.castShadow = true;
    funnelGroup.add(funnel);

    // Black cowl rim at funnel top
    const cowlGeo = new THREE.BoxGeometry(5.0, 1.2, 7.7);
    const cowlMat = new THREE.MeshStandardMaterial({ color: '#1B2028', roughness: 0.6 });
    const cowl = new THREE.Mesh(cowlGeo, cowlMat);
    cowl.position.set(0, 9.3, -0.6);
    funnelGroup.add(cowl);

    // Exhaust pipes protruding from funnel top
    const pipeGeo = new THREE.CylinderGeometry(0.45, 0.45, 2.2, 12);
    const pipe1 = new THREE.Mesh(pipeGeo, cowlMat);
    pipe1.position.set(-1.1, 10.3, -0.8);
    funnelGroup.add(pipe1);
    const pipe2 = new THREE.Mesh(pipeGeo, cowlMat);
    pipe2.position.set(1.1, 10.3, -0.8);
    funnelGroup.add(pipe2);

    this.group.add(funnelGroup);

    // Update global world position of funnel for smoke particle generator
    this.funnelPosition.set(0, baseDeckY + 11.5, bridgeZ - 13.8);
  }

  /**
   * Lashing bridges (steel framework rows between container bays).
   */
  private buildLashingBridges() {
    const bridgeGeo = new THREE.BoxGeometry(16.5, 9.5, 0.45);
    const bridgeMat = new THREE.MeshStandardMaterial({
      color: '#60728A',
      roughness: 0.7,
      metalness: 0.45,
      wireframe: false,
    });

    const deckY = SCENE_CONFIG.ship.hullHeight * 0.55 + 0.3;

    // Place lashing bridges between major bays
    const bridgeZPositions = [-14, 0, 14, 28, 42];
    for (const z of bridgeZPositions) {
      const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
      bridge.position.set(0, deckY + 4.75, z);
      bridge.castShadow = true;
      this.group.add(bridge);
    }
  }

  /**
   * Forecastle mooring winches, anchor windlasses, and deck railings.
   */
  private buildDeckDetails() {
    const deckY = SCENE_CONFIG.ship.hullHeight * 0.55 + 0.3;
    const winchGeo = new THREE.CylinderGeometry(0.7, 0.7, 1.2, 8);
    winchGeo.rotateZ(Math.PI / 2);
    const winchMat = new THREE.MeshStandardMaterial({ color: '#3A4250', metalness: 0.6, roughness: 0.4 });

    // Forward winches on bow
    const winch1 = new THREE.Mesh(winchGeo, winchMat);
    winch1.position.set(-4.5, deckY + 0.8, 62);
    this.group.add(winch1);

    const winch2 = new THREE.Mesh(winchGeo, winchMat);
    winch2.position.set(4.5, deckY + 0.8, 62);
    this.group.add(winch2);

    // Bow Jackstaff / Foremast
    const foremastGeo = new THREE.CylinderGeometry(0.12, 0.22, 6.5, 8);
    const foremastMat = new THREE.MeshStandardMaterial({ color: '#E8ECF2' });
    const foremast = new THREE.Mesh(foremastGeo, foremastMat);
    foremast.position.set(0, deckY + 3.4, 66);
    this.group.add(foremast);
  }

  /**
   * Hundreds of cargo containers stacked across bays using InstancedMesh
   * with corrugated normal map and randomized palette colors.
   */
  private buildContainers() {
    const { containerLength, containerWidth, containerHeight, palette } = SCENE_CONFIG.containers;
    const deckY = SCENE_CONFIG.ship.hullHeight * 0.55 + 0.3;

    // Normal map for container ribbed corrugation
    const normalMap = createContainerNormalTexture();

    const containerGeo = new THREE.BoxGeometry(
      containerWidth * 0.94,
      containerHeight * 0.96,
      containerLength * 0.96
    );

    const containerMat = new THREE.MeshStandardMaterial({
      roughness: 0.48,
      metalness: 0.22,
      normalMap,
      normalScale: new THREE.Vector2(0.65, 0.65),
    });

    // Calculate instance positions
    // Bays along length: 5 forward bays, 2 aft bays behind bridge
    const forwardBays = [-7, 7, 21, 35, 49];
    const aftBays = [-44, -51];
    const allBays = [...aftBays, ...forwardBays];

    const rowsAcross = 6;
    const maxTiers = 7;
    const maxPossibleInstances = allBays.length * rowsAcross * maxTiers;

    this.containersMesh = new THREE.InstancedMesh(containerGeo, containerMat, maxPossibleInstances);
    this.containersMesh.castShadow = true;
    this.containersMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    const colorObj = new THREE.Color();
    let instanceIndex = 0;

    // Palette colors converted to Three.Color
    const threeColors = palette.map((c) => new THREE.Color(c));

    for (let b = 0; b < allBays.length; b++) {
      const bayZ = allBays[b];
      // Tiers step down towards bow for visibility
      const tierLimit = bayZ > 40 ? 4 : bayZ > 20 ? 6 : maxTiers;

      for (let r = 0; r < rowsAcross; r++) {
        // Centered across beam
        const posX = (r - (rowsAcross - 1) / 2) * (containerWidth * 1.02);

        // Realistic pyramid stacking: center rows are taller than edge rows
        const distFromCenter = Math.abs(r - (rowsAcross - 1) / 2);
        const stackHeight = Math.max(2, tierLimit - (distFromCenter > 1.5 ? 1 : 0));

        for (let t = 0; t < stackHeight; t++) {
          // Occasional random missing container for realistic operational pattern
          if (t >= 4 && (r === 0 || r === rowsAcross - 1) && Math.sin(b * 13 + r * 7 + t) > 0.4) {
            continue;
          }

          const posY = deckY + t * containerHeight + containerHeight / 2;

          dummy.position.set(posX, posY, bayZ);
          dummy.updateMatrix();
          this.containersMesh.setMatrixAt(instanceIndex, dummy.matrix);

          // Select color with subtle jitter
          const baseColor = threeColors[Math.floor(Math.abs(Math.sin(instanceIndex * 997)) * threeColors.length)];
          colorObj.copy(baseColor);
          // slight variation in tone
          const lumJitter = (Math.sin(instanceIndex * 31) - 0.5) * 0.12;
          colorObj.offsetHSL(0, 0, lumJitter);

          this.containersMesh.setColorAt(instanceIndex, colorObj);
          instanceIndex++;
        }
      }
    }

    this.containersMesh.count = instanceIndex;
    if (this.containersMesh.instanceColor) {
      this.containersMesh.instanceColor.needsUpdate = true;
    }
    this.group.add(this.containersMesh);
  }

  /**
   * Navigation lights (Port Red, Starboard Green, Masthead White)
   * and glowing safety deck lamps.
   */
  private buildNavigationLights() {
    const deckY = SCENE_CONFIG.ship.hullHeight * 0.55 + 0.3;
    const lightSphereGeo = new THREE.SphereGeometry(0.2, 8, 8);

    // Port Light (Red) - Left side facing forward
    const portMat = new THREE.MeshBasicMaterial({ color: '#FF2222' });
    const portLight = new THREE.Mesh(lightSphereGeo, portMat);
    portLight.position.set(-11.5, deckY + 16.5, -30);
    this.deckLightsGroup.add(portLight);

    // Starboard Light (Green) - Right side facing forward
    const stbMat = new THREE.MeshBasicMaterial({ color: '#00FF66' });
    const stbLight = new THREE.Mesh(lightSphereGeo, stbMat);
    stbLight.position.set(11.5, deckY + 16.5, -30);
    this.deckLightsGroup.add(stbLight);

    // Foremast White Navigation Light
    const whiteMat = new THREE.MeshBasicMaterial({ color: '#FFFFEE' });
    const mastLight = new THREE.Mesh(lightSphereGeo, whiteMat);
    mastLight.position.set(0, deckY + 6.6, 66);
    this.deckLightsGroup.add(mastLight);

    // Deck floodlight glows along walkways
    const deckLightPositions = [
      [-9.0, deckY + 1.2, 20],
      [9.0, deckY + 1.2, 20],
      [-9.0, deckY + 1.2, -10],
      [9.0, deckY + 1.2, -10],
    ];

    const warmLightMat = new THREE.MeshBasicMaterial({ color: '#FFA54F' });
    for (const pos of deckLightPositions) {
      const lamp = new THREE.Mesh(lightSphereGeo, warmLightMat);
      lamp.position.set(pos[0], pos[1], pos[2]);
      this.deckLightsGroup.add(lamp);
    }
  }

  /**
   * Updates ship buoyancy, pitch, roll, heave, and navigation animations.
   * Uses sample points from shared waveMath so the ship rides crests and troughs accurately!
   */
  public update(time: number, waveHeightMult = 1.0, waveSpeedMult = 1.0) {
    // 1. Rotate Radar Bar
    if (this.radarMastBar) {
      this.radarMastBar.rotation.y = time * 2.8;
    }

    // 2. Sample wave height at 4 strategic vessel buoyancy points:
    // Bow (forward), Stern (aft), Port (left), Starboard (right)
    const bowSample = getWaterHeight(0, 52, time, waveHeightMult, waveSpeedMult);
    const sternSample = getWaterHeight(0, -50, time, waveHeightMult, waveSpeedMult);
    const portSample = getWaterHeight(-9, 0, time, waveHeightMult, waveSpeedMult);
    const stbSample = getWaterHeight(9, 0, time, waveHeightMult, waveSpeedMult);

    // Target Heave (average vertical water lift)
    const targetHeave = ((bowSample + sternSample) * 0.5) * SCENE_CONFIG.ship.heaveMultiplier;

    // Target Pitch (bow up / stern down)
    const lengthBetweenSamples = 102;
    const targetPitch = Math.atan2(bowSample - sternSample, lengthBetweenSamples) * SCENE_CONFIG.ship.pitchMultiplier * 15;

    // Target Roll (port vs starboard tilt)
    const beamBetweenSamples = 18;
    const targetRoll = Math.atan2(stbSample - portSample, beamBetweenSamples) * SCENE_CONFIG.ship.rollMultiplier * 12;

    // Smooth inertia lerp (simulate 200,000 ton container ship mass damping)
    const lerpRate = 0.045;
    this.currentY += (targetHeave - this.currentY) * lerpRate;
    this.currentPitch += (targetPitch - this.currentPitch) * lerpRate;
    this.currentRoll += (targetRoll - this.currentRoll) * lerpRate;

    // Apply translations and rotations
    this.group.position.y = this.currentY;
    this.group.rotation.x = -this.currentPitch; // pitch
    this.group.rotation.z = this.currentRoll;   // roll

    // Update dynamic world positions for particles
    this.funnelPosition.set(0, this.currentY + 24, -43);
    this.bowPosition.set(0, this.currentY + 1.5, 68);
    this.sternPosition.set(0, this.currentY + 0.8, -60);
  }
}
