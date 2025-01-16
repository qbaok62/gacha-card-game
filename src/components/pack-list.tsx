import { animated, useSpring } from "@react-spring/three";
import { Html } from "@react-three/drei";
import { useDrag } from "@use-gesture/react";
import { useState } from "react";
import * as THREE from "three";
import { Pack } from "./pack";

const RADIUS = 2;
const SCALE = {
  INIT: 1,
  ROTATED: 1.08,
};
const INIT_ROTATION = [0, 0, 0];

const PACK_NUMBER = 12;
const ANGLE_STEP = (2 * Math.PI) / PACK_NUMBER;
const VELOCITY_INTENSITY = 0.7;
const CARD_SIZE = {
  WIDTH: 0.35,
  HEIGHT: 0.6,
};

const packList = Array(PACK_NUMBER)
  .fill("")
  .map((_, idx) => {
    const angle = ANGLE_STEP * idx;
    const x = RADIUS * Math.sin(angle);
    const z = RADIUS * Math.cos(angle);
    return {
      angle,
      position: new THREE.Vector3(x, 0, z),
    };
  });
const geometry = new THREE.PlaneGeometry(CARD_SIZE.WIDTH, CARD_SIZE.HEIGHT);
const material = new THREE.MeshBasicMaterial({
  color: "red",
  side: THREE.DoubleSide,
});

const snapToClosest = (angle: number) => {
  return Math.round(angle / ANGLE_STEP) * ANGLE_STEP;
};

export const PackList = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const [{ rotation, scale }, set] = useSpring(() => ({
    rotation: INIT_ROTATION,
    scale: SCALE.INIT,
    config: { mass: 1, tension: 150, friction: 40 },
    loop: true,
    onRest: () => {
      // Snap back to the angle where the closest card is centered
      const snappedY = snapToClosest(rotation.get()[1]);
      const newRotation = [0, snappedY, 0];
      set.start({
        rotation: newRotation,
        scale: SCALE.INIT,
        config: { mass: 1, tension: 100, friction: 60 },
      });
      const newActiveIndex =
        snappedY >= 0
          ? (snappedY / ANGLE_STEP) % PACK_NUMBER
          : Math.abs(
              (PACK_NUMBER - (-1 * snappedY) / ANGLE_STEP) % PACK_NUMBER
            );
      setActiveIndex(newActiveIndex);
      setIsDragging(false);
    },
  }));

  const bind = useDrag(
    ({ velocity: [vx], direction: [dx], down, tap }) => {
      if (tap) {
        return;
      }
      setIsDragging(true);
      const prevAngle = rotation.get();
      const yAngle = dx * vx + prevAngle[1];

      if (down) {
        set({
          rotation: [0, yAngle, 0],
          scale: SCALE.ROTATED,
          config: { mass: 0.5, tension: 50, friction: 20 },
        });
      } else {
        const inertiaY = yAngle + dx * vx * VELOCITY_INTENSITY;

        set({
          rotation: [0, inertiaY, 0],
          scale: SCALE.ROTATED,
          immediate: false,
          config: { mass: 0.5, tension: 50, friction: 20 },
        });
      }
    },
    {
      filterTaps: true,
      delay: 300,
    }
  );

  return (
    <>
      {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
      {/* @ts-ignore */}
      <mesh {...bind()} position={[0, 0, 0]} scale={[5, 5, 1]} visible={false}>
        <planeGeometry args={[10, 10]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      <animated.group
        position={[0, -CARD_SIZE.HEIGHT / 4, 0]}
        scale={scale}
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        rotation={rotation}
      >
        {packList.map((item, idx) => {
          const isClickable = !isDragging && activeIndex === idx;
          return (
            <group
              key={idx}
              rotation={[0, item.angle, 0]}
              position={item.position}
            >
              <Pack
                geometry={geometry}
                material={material}
                isClickable={isClickable}
              />
              <Html position={[0, 0, 0.1]} occlude="raycast">
                {idx}
              </Html>
            </group>
          );
        })}
      </animated.group>
    </>
  );
};
