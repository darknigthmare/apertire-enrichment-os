import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import type { Chamber } from "../types";

interface Chamber3DViewProps {
  chamber: Chamber;
  subjectCoords?: { x: number; y: number } | null;
  portalBeams?: { start: { x: number; y: number }; end: { x: number; y: number }; color: string }[];
  laserBeams?: { start: { x: number; y: number }; end: { x: number; y: number } }[];
}

export const Chamber3DView: React.FC<Chamber3DViewProps> = ({ 
  chamber,
  subjectCoords = null,
  portalBeams = [],
  laserBeams = []
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Scene references to update position smoothly without rebuilding the world
  const sceneRef = useRef<THREE.Scene | null>(null);
  const subjectMeshRef = useRef<THREE.Mesh | null>(null);
  const portalGroupRef = useRef<THREE.Group | null>(null);
  const laserGroupRef = useRef<THREE.Group | null>(null);
  
  // Element maps for real-time 3D state animations (depressing buttons, opening doors)
  const buttonsMap = useRef<Map<string, THREE.Mesh>>(new Map());
  const exitGlowRef = useRef<THREE.Mesh | null>(null);

  const gridW = chamber.width;
  const gridH = chamber.height;
  const offsetX = -gridW / 2;
  const offsetZ = -gridH / 2;

  // 1. Initial creation of static 3D world
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 450;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a0d10);
    scene.fog = new THREE.FogExp2(0x0a0d10, 0.025);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xe5f3ff, 0.7);
    dirLight.position.set(20, 40, 20);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Dynamic Groups
    const portalGroup = new THREE.Group();
    portalGroupRef.current = portalGroup;
    scene.add(portalGroup);

    const laserGroup = new THREE.Group();
    laserGroupRef.current = laserGroup;
    scene.add(laserGroup);

    // Floor and Walls setup
    const wallColor = chamber.style === "old_aperture" ? 0x2b2520 : 0x1f262e;
    const floorColor = chamber.style === "old_aperture" ? 0x473f37 : 0xeef2f7;

    const wallMaterial = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.8 });
    const floorMaterial = new THREE.MeshStandardMaterial({ color: floorColor, roughness: 0.4 });
    const gooMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff66, roughness: 0.1, metalness: 0.8, transparent: true, opacity: 0.7 });

    const tileGeo = new THREE.BoxGeometry(0.96, 0.2, 0.96);
    const gooGeo = new THREE.BoxGeometry(0.96, 0.1, 0.96);
    const elementsGroup = new THREE.Group();
    scene.add(elementsGroup);

    buttonsMap.current.clear();
    exitGlowRef.current = null;

    for (let x = 0; x < gridW; x++) {
      for (let z = 0; z < gridH; z++) {
        const posX = x + offsetX + 0.5;
        const posZ = z + offsetZ + 0.5;
        const el = chamber.elements.find((e) => e.x === x && e.y === z);

        if (el?.type === "goo") {
          const goo = new THREE.Mesh(gooGeo, gooMaterial);
          goo.position.set(posX, -0.15, posZ);
          elementsGroup.add(goo);
        } else {
          const tile = new THREE.Mesh(tileGeo, floorMaterial);
          tile.position.set(posX, -0.1, posZ);
          tile.receiveShadow = true;
          elementsGroup.add(tile);
        }

        if (x === 0 || x === gridW - 1 || z === 0 || z === gridH - 1 || el?.type === "wall") {
          const wallGeo = new THREE.BoxGeometry(1, 3, 1);
          const wall = new THREE.Mesh(wallGeo, wallMaterial);
          wall.position.set(posX, 1.4, posZ);
          wall.castShadow = true;
          wall.receiveShadow = true;
          elementsGroup.add(wall);
        }
      }
    }

    // Static items
    chamber.elements.forEach((el) => {
      const posX = el.x + offsetX + 0.5;
      const posZ = el.y + offsetZ + 0.5;
      
      const itemGroup = new THREE.Group();
      itemGroup.position.set(posX, 0, posZ);
      itemGroup.rotation.y = (el.rotation * Math.PI) / 180;
      elementsGroup.add(itemGroup);

      if (el.type === "entrance" || el.type === "exit") {
        const frameGeo = new THREE.BoxGeometry(0.8, 1.8, 0.2);
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x576d7d, metalness: 0.6 });
        const door = new THREE.Mesh(frameGeo, frameMat);
        door.position.set(0, 0.9, 0);
        itemGroup.add(door);

        const lightGeo = new THREE.PlaneGeometry(0.5, 1.4);
        const lightColor = el.type === "entrance" ? 0x00a2ff : 0xff7b00;
        const glowMat = new THREE.MeshBasicMaterial({ color: lightColor, side: THREE.DoubleSide });
        const glow = new THREE.Mesh(lightGeo, glowMat);
        glow.position.set(0, 0.9, 0.05);
        itemGroup.add(glow);

        if (el.type === "exit") {
          exitGlowRef.current = glow;
        }
      }

      else if (el.type === "button") {
        const baseGeo = new THREE.CylinderGeometry(0.4, 0.45, 0.15, 12);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3c, metalness: 0.5 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.set(0, 0.075, 0);
        itemGroup.add(base);

        const capGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.08, 12);
        const capMat = new THREE.MeshStandardMaterial({ color: 0xff3b30, roughness: 0.2 });
        const cap = new THREE.Mesh(capGeo, capMat);
        cap.position.set(0, 0.16, 0);
        itemGroup.add(cap);

        // Store cap mesh reference
        buttonsMap.current.set(`${el.x}-${el.y}`, cap);
      }

      else if (el.type === "cube" || el.type === "companion_cube" || el.type === "redirection_cube") {
        const cubeGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const cubeColor = el.type === "companion_cube" ? 0xffb3d1 : el.type === "redirection_cube" ? 0x00ffcc : 0x8e8e93;
        const cubeMat = new THREE.MeshStandardMaterial({ color: cubeColor, metalness: 0.4, roughness: 0.3 });
        const box = new THREE.Mesh(cubeGeo, cubeMat);
        box.position.set(0, 0.25, 0);
        box.castShadow = true;
        itemGroup.add(box);
      }

      else if (el.type === "turret") {
        const bodyGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.6, 8);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xe5f3ff, roughness: 0.1 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.set(0, 0.5, 0);
        itemGroup.add(body);

        const eyeGeo = new THREE.SphereGeometry(0.04, 8, 8);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const eye = new THREE.Mesh(eyeGeo, eyeMat);
        eye.position.set(0, 0.68, 0.08);
        itemGroup.add(eye);

        const legMat = new THREE.LineBasicMaterial({ color: 0x1c1c1e });
        const points = [
          new THREE.Vector3(0, 0.3, 0), new THREE.Vector3(-0.2, 0, 0.2),
          new THREE.Vector3(0, 0.3, 0), new THREE.Vector3(0.2, 0, 0.2),
          new THREE.Vector3(0, 0.3, 0), new THREE.Vector3(0, 0, -0.25)
        ];
        const legGeo = new THREE.BufferGeometry().setFromPoints(points);
        const legs = new THREE.LineSegments(legGeo, legMat);
        itemGroup.add(legs);
      }

      else if (el.type === "laser_emitter") {
        const emitterGeo = new THREE.BoxGeometry(0.3, 0.3, 0.4);
        const emitterMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50 });
        const emitter = new THREE.Mesh(emitterGeo, emitterMat);
        emitter.position.set(0, 0.3, 0);
        itemGroup.add(emitter);

        const nozzleGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.15, 8);
        const nozzleMat = new THREE.MeshStandardMaterial({ color: 0xe74c3c });
        const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
        nozzle.rotation.x = Math.PI / 2;
        nozzle.position.set(0, 0.3, 0.2);
        itemGroup.add(nozzle);
      }

      else if (el.type === "laser_receiver") {
        const recGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.1, 6);
        const recMat = new THREE.MeshStandardMaterial({ color: 0x27ae60 });
        const rec = new THREE.Mesh(recGeo, recMat);
        rec.rotation.x = Math.PI / 2;
        rec.position.set(0, 0.3, 0);
        itemGroup.add(rec);
      }

      else if (el.type === "faith_plate") {
        const baseGeo = new THREE.BoxGeometry(0.6, 0.05, 0.6);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.set(0, 0.025, 0);
        itemGroup.add(base);

        const padGeo = new THREE.BoxGeometry(0.4, 0.04, 0.4);
        const padMat = new THREE.MeshStandardMaterial({ color: 0xff7b00 });
        const pad = new THREE.Mesh(padGeo, padMat);
        pad.position.set(0, 0.06, 0);
        itemGroup.add(pad);
      }
    });

    // 3D Subject representation
    const subGeo = new THREE.SphereGeometry(0.24, 16, 16);
    const subMat = new THREE.MeshStandardMaterial({
      color: 0x00a2ff,
      roughness: 0.1,
      metalness: 0.6,
      emissive: 0x0044bb,
    });
    const subjectMesh = new THREE.Mesh(subGeo, subMat);
    subjectMesh.position.set(0, -500, 0); // Hide below initially
    subjectMesh.castShadow = true;
    scene.add(subjectMesh);
    subjectMeshRef.current = subjectMesh;

    // Static linkage lines
    const lineMat = new THREE.LineDashedMaterial({ color: 0x00a2ff, dashSize: 0.2, gapSize: 0.1 });
    chamber.elements.forEach((el) => {
      if (el.linkedTo && el.linkedTo.length > 0) {
        el.linkedTo.forEach((tid) => {
          const target = chamber.elements.find((e) => e.id === tid);
          if (target) {
            const startX = el.x + offsetX + 0.5;
            const startZ = el.y + offsetZ + 0.5;
            const endX = target.x + offsetX + 0.5;
            const endZ = target.y + offsetZ + 0.5;

            const points = [
              new THREE.Vector3(startX, 0.05, startZ),
              new THREE.Vector3(endX, 0.05, endZ),
            ];
            const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(lineGeo, lineMat);
            line.computeLineDistances();
            scene.add(line);
          }
        });
      }
    });

    // Camera initial angle orbits
    let theta = Math.PI / 4;
    let phi = Math.PI / 6;
    let radius = Math.max(gridW, gridH) * 1.5;
    const center = new THREE.Vector3(0, 0, 0);

    const updateCameraPosition = () => {
      phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, phi));
      camera.position.x = center.x + radius * Math.sin(theta) * Math.cos(phi);
      camera.position.y = center.y + radius * Math.sin(phi);
      camera.position.z = center.z + radius * Math.cos(theta) * Math.cos(phi);
      camera.lookAt(center);
    };

    updateCameraPosition();

    // Orbit listeners
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;

      theta -= deltaX * 0.007;
      phi += deltaY * 0.007;

      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
      updateCameraPosition();
    };

    const handleMouseUp = () => { isDragging = false; };
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      radius += e.deltaY * 0.015;
      radius = Math.max(3, Math.min(50, radius));
      updateCameraPosition();
    };

    const canvas = canvasRef.current;
    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("wheel", handleWheel, { passive: false });

    // Loop
    let animId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Goo sludge wave
      elementsGroup.children.forEach((obj) => {
        if (obj instanceof THREE.Mesh && obj.material === gooMaterial) {
          obj.position.y = -0.15 + Math.sin(time * 2.2 + obj.position.x * 2) * 0.015;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight || 450;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("wheel", handleWheel);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, [chamber]);

  // 2. Real-time update of live simulation elements (Subject position, portals, lasers)
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Reset button states and exit glow
    buttonsMap.current.forEach((cap) => {
      cap.position.y = 0.16; // Normal height
    });
    if (exitGlowRef.current) {
      (exitGlowRef.current.material as THREE.MeshBasicMaterial).color.setHex(0xff7b00); // Orange locked
    }

    // Position Subject Mesh
    if (subjectMeshRef.current) {
      if (subjectCoords) {
        subjectMeshRef.current.position.set(
          subjectCoords.x + offsetX + 0.5,
          0.3,
          subjectCoords.y + offsetZ + 0.5
        );
        subjectMeshRef.current.visible = true;

        // Check if subject is on a button cell
        const cellKey = `${subjectCoords.x}-${subjectCoords.y}`;
        const activeCap = buttonsMap.current.get(cellKey);
        if (activeCap) {
          activeCap.position.y = 0.075; // Depress
          
          // Nominally unlock exit glowing green
          if (exitGlowRef.current) {
            (exitGlowRef.current.material as THREE.MeshBasicMaterial).color.setHex(0x27ae60);
          }
        }
      } else {
        subjectMeshRef.current.visible = false;
      }
    }

    // Redraw Portal Beams in 3D
    const portalGroup = portalGroupRef.current;
    if (portalGroup) {
      // Clear old beams
      while (portalGroup.children.length > 0) {
        portalGroup.remove(portalGroup.children[0]);
      }

      portalBeams.forEach((beam) => {
        const startX = beam.start.x + offsetX + 0.5;
        const startZ = beam.start.y + offsetZ + 0.5;
        const endX = beam.end.x + offsetX + 0.5;
        const endZ = beam.end.y + offsetZ + 0.5;

        const points = [
          new THREE.Vector3(startX, 0.3, startZ),
          new THREE.Vector3(endX, 0.3, endZ)
        ];

        const lineMat = new THREE.LineBasicMaterial({
          color: beam.color === "var(--portal-blue)" ? 0x00a2ff : 0xff7b00,
          linewidth: 2,
        });

        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(lineGeo, lineMat);
        portalGroup.add(line);
      });
    }

    // Redraw Lasers in 3D
    const laserGroup = laserGroupRef.current;
    if (laserGroup) {
      while (laserGroup.children.length > 0) {
        laserGroup.remove(laserGroup.children[0]);
      }

      laserBeams.forEach((beam) => {
        const startX = beam.start.x + offsetX + 0.5;
        const startZ = beam.start.y + offsetZ + 0.5;
        const endX = beam.end.x + offsetX + 0.5;
        const endZ = beam.end.y + offsetZ + 0.5;

        const points = [
          new THREE.Vector3(startX, 0.3, startZ),
          new THREE.Vector3(endX, 0.3, endZ)
        ];

        const lineMat = new THREE.LineBasicMaterial({
          color: 0xff3b30, // Red laser
        });

        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(lineGeo, lineMat);
        laserGroup.add(line);
      });
    }

  }, [subjectCoords, portalBeams, laserBeams]);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%", minHeight: "350px", position: "relative" }}>
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%", borderRadius: "4px" }} />
      <div 
        style={{ 
          position: "absolute", 
          top: "10px", 
          left: "10px", 
          backgroundColor: "rgba(11, 14, 17, 0.8)", 
          border: "1px solid var(--border-color)",
          color: "var(--text-secondary)",
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          padding: "4px 8px",
          borderRadius: "2px",
          pointerEvents: "none"
        }}
      >
        CLIC ET GLISSER : pivoter | MOLETTE : zoom
      </div>
    </div>
  );
};
