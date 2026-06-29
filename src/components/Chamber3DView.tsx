import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import type { Chamber } from "../types";

interface Chamber3DViewProps {
  chamber: Chamber;
}

export const Chamber3DView: React.FC<Chamber3DViewProps> = ({ chamber }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 450;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0d10);
    
    // Add fog for clinical atmosphere depth
    scene.fog = new THREE.FogExp2(0x0a0d10, 0.025);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    // 2. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.25);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xe5f3ff, 0.6);
    dirLight.position.set(20, 40, 20);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // 3. Grid Coordinates Offset
    const gridW = chamber.width;
    const gridH = chamber.height;
    const offsetX = -gridW / 2;
    const offsetZ = -gridH / 2;
    const center = new THREE.Vector3(0, 0, 0);

    // 4. Custom Materials
    const wallColor = chamber.style === "old_aperture" ? 0x2b2520 : 0x1f262e;
    const floorColor = chamber.style === "old_aperture" ? 0x473f37 : 0xeef2f7;

    const wallMaterial = new THREE.MeshStandardMaterial({
      color: wallColor,
      roughness: 0.8,
      metalness: 0.2,
    });

    const floorMaterial = new THREE.MeshStandardMaterial({
      color: floorColor,
      roughness: 0.4,
      metalness: 0.1,
    });


    const gooMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ff66,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.7,
    });

    // 5. Generate 3D Grid Elements
    const elementsGroup = new THREE.Group();
    scene.add(elementsGroup);

    // Create the base floor tiling
    const tileGeo = new THREE.BoxGeometry(0.96, 0.2, 0.96);
    const gooGeo = new THREE.BoxGeometry(0.96, 0.1, 0.96);

    const elementMap = new Map<string, THREE.Object3D>();

    // Renders the floor and handles elements placement
    for (let x = 0; x < gridW; x++) {
      for (let z = 0; z < gridH; z++) {
        const posX = x + offsetX + 0.5;
        const posZ = z + offsetZ + 0.5;

        // Check if there is an element at this cell
        const el = chamber.elements.find((e) => e.x === x && e.y === z);

        if (el?.type === "goo") {
          // Acid liquid container
          const goo = new THREE.Mesh(gooGeo, gooMaterial);
          goo.position.set(posX, -0.15, posZ);
          elementsGroup.add(goo);
        } else {
          // Normal floor tile
          const tile = new THREE.Mesh(tileGeo, floorMaterial);
          tile.position.set(posX, -0.1, posZ);
          tile.receiveShadow = true;
          elementsGroup.add(tile);
        }

        // Place wall borders or active walls
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

    // Render active chamber elements (turrets, buttons, cubes, portals, lasers)
    chamber.elements.forEach((el) => {
      const posX = el.x + offsetX + 0.5;
      const posZ = el.y + offsetZ + 0.5;
      
      const itemGroup = new THREE.Group();
      itemGroup.position.set(posX, 0, posZ);
      // Apply rotation
      itemGroup.rotation.y = (el.rotation * Math.PI) / 180;
      elementsGroup.add(itemGroup);

      elementMap.set(el.id, itemGroup);

      if (el.type === "entrance" || el.type === "exit") {
        // Door arches
        const frameGeo = new THREE.BoxGeometry(0.8, 1.8, 0.2);
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x576d7d, metalness: 0.6 });
        const door = new THREE.Mesh(frameGeo, frameMat);
        door.position.set(0, 0.9, 0);
        itemGroup.add(door);

        // Glowing light marker inside the door
        const lightGeo = new THREE.PlaneGeometry(0.5, 1.4);
        const lightColor = el.type === "entrance" ? 0x00a2ff : 0xff7b00;
        const glowMat = new THREE.MeshBasicMaterial({
          color: lightColor,
          side: THREE.DoubleSide,
        });
        const glow = new THREE.Mesh(lightGeo, glowMat);
        glow.position.set(0, 0.9, 0.05);
        itemGroup.add(glow);
      }

      else if (el.type === "button") {
        // Red weighted button base
        const baseGeo = new THREE.CylinderGeometry(0.4, 0.45, 0.15, 12);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3c, metalness: 0.5 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.set(0, 0.075, 0);
        itemGroup.add(base);

        // Red clicker top
        const capGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.08, 12);
        const capMat = new THREE.MeshStandardMaterial({ color: 0xff3b30, roughness: 0.2 });
        const cap = new THREE.Mesh(capGeo, capMat);
        cap.position.set(0, 0.16, 0);
        itemGroup.add(cap);
      }

      else if (el.type === "cube" || el.type === "companion_cube" || el.type === "redirection_cube") {
        // Beveled box representing storage cubes
        const cubeGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const cubeColor = el.type === "companion_cube" ? 0xffb3d1 : el.type === "redirection_cube" ? 0x00ffcc : 0x8e8e93;
        const cubeMat = new THREE.MeshStandardMaterial({ color: cubeColor, metalness: 0.4, roughness: 0.3 });
        const box = new THREE.Mesh(cubeGeo, cubeMat);
        box.position.set(0, 0.25, 0);
        box.castShadow = true;
        itemGroup.add(box);
      }

      else if (el.type === "turret") {
        // Sentry tripod body
        const bodyGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.6, 8);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xe5f3ff, roughness: 0.1 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.set(0, 0.5, 0);
        itemGroup.add(body);

        // red eye dot
        const eyeGeo = new THREE.SphereGeometry(0.04, 8, 8);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const eye = new THREE.Mesh(eyeGeo, eyeMat);
        eye.position.set(0, 0.68, 0.08);
        itemGroup.add(eye);

        // Thin wire tripod legs
        const legMat = new THREE.LineBasicMaterial({ color: 0x1c1c1e });
        const points = [
          new THREE.Vector3(0, 0.3, 0),
          new THREE.Vector3(-0.2, 0, 0.2),
          new THREE.Vector3(0, 0.3, 0),
          new THREE.Vector3(0.2, 0, 0.2),
          new THREE.Vector3(0, 0.3, 0),
          new THREE.Vector3(0, 0, -0.25)
        ];
        const legGeo = new THREE.BufferGeometry().setFromPoints(points);
        const legs = new THREE.LineSegments(legGeo, legMat);
        itemGroup.add(legs);
      }

      else if (el.type === "laser_emitter") {
        // Laser tube mount
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
        // Hexagonal sensor target
        const recGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.1, 6);
        const recMat = new THREE.MeshStandardMaterial({ color: 0x27ae60 });
        const rec = new THREE.Mesh(recGeo, recMat);
        rec.rotation.x = Math.PI / 2;
        rec.position.set(0, 0.3, 0);
        itemGroup.add(rec);
      }
      
      else if (el.type === "faith_plate") {
        // Diagonal launcher pad
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

    // 6. Draw connection lines between linked elements (triggers)
    const lineMat = new THREE.LineDashedMaterial({
      color: 0x00a2ff,
      dashSize: 0.2,
      gapSize: 0.1,
    });

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
              new THREE.Vector3(startX, 0.2, startZ),
              new THREE.Vector3(endX, 0.2, endZ),
            ];
            const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(lineGeo, lineMat);
            line.computeLineDistances(); // Required for dashed lines
            scene.add(line);
          }
        });
      }
    });

    // 7. Lightweight Vanilla Camera Orbit Controls (Theta, Phi, Radius)
    let theta = Math.PI / 4;
    let phi = Math.PI / 6;
    let radius = Math.max(gridW, gridH) * 1.5;

    const updateCameraPosition = () => {
      // Clamping Phi to prevent gimbal lock / flipping upside down
      phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, phi));

      camera.position.x = center.x + radius * Math.sin(theta) * Math.cos(phi);
      camera.position.y = center.y + radius * Math.sin(phi);
      camera.position.z = center.z + radius * Math.cos(theta) * Math.cos(phi);
      camera.lookAt(center);
    };

    updateCameraPosition();

    // Mouse Listeners
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

    const handleMouseUp = () => {
      isDragging = false;
    };

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

    // 8. Animation & Render loop
    let animId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Animate goo / acid height oscillation
      elementsGroup.children.forEach((obj) => {
        if (obj instanceof THREE.Mesh && obj.material === gooMaterial) {
          obj.position.y = -0.15 + Math.sin(time * 2 + obj.position.x) * 0.02;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight || 450;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup on unmount
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
