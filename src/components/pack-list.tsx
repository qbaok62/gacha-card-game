import { animated, useSpring, useSprings } from "@react-spring/three";
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

const PACK_COUNT = 12;
const ANGLE_STEP = (2 * Math.PI) / PACK_COUNT;
const VELOCITY_INTENSITY = 0.7;
const CARD_SIZE = {
  WIDTH: 0.35,
  HEIGHT: 0.6,
};

const geometry = new THREE.PlaneGeometry(CARD_SIZE.WIDTH, CARD_SIZE.HEIGHT);
const material = new THREE.MeshBasicMaterial({
  color: "red",
  side: THREE.DoubleSide,
});

const snapToClosest = (angle: number) => {
  return Math.round(angle / ANGLE_STEP) * ANGLE_STEP;
};

export const PackList = () => {
  const [isInit, setIsInit] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSelected, setIsSelected] = useState(false);

  const [{ rotation, scale }, set] = useSpring(() => ({
    rotation: INIT_ROTATION,
    scale: SCALE.INIT,
    config: { mass: 1, tension: 150, friction: 40 },
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
          ? (snappedY / ANGLE_STEP) % PACK_COUNT
          : Math.abs((PACK_COUNT - (-1 * snappedY) / ANGLE_STEP) % PACK_COUNT);
      setActiveIndex(newActiveIndex);
      setIsDragging(false);
    },
  }));

  const [springs, setPacks] = useSprings(PACK_COUNT, (i) => {
    const angle = ANGLE_STEP * i;
    const x = RADIUS * Math.sin(angle);
    const z = RADIUS * Math.cos(angle);
    return {
      from: {
        rotation: [0, angle, 0],
        position: [x / 10, 0, z / 10],
      },
      to: {
        rotation: [0, angle, 0],
        position: [x, 0, z],
      },
      delay: i * 100,
      onRest: () => {
        if (i === PACK_COUNT - 1) {
          setIsInit(false);
        }
      },
    };
  });

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
          config: { mass: 0.5, tension: 50, friction: 20 },
        });
      }
    },
    {
      filterTaps: true,
      delay: 300,
      enabled: !isInit && !isSelected,
    }
  );

  const handlePackClick = () => {
    setIsSelected(true);
    setPacks.start((i) => {
      if (i === activeIndex) {
        return {};
      }
      const prevPosition = springs[i].position.get();
      return {
        position: [prevPosition[0], -10, prevPosition[2]],
        config: {
          mass: 1,
          tension: 150,
        },
      };
    });
  };

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
        rotation={rotation as unknown as THREE.Euler}
      >
        {springs.map((item, idx) => {
          const isClickable = !isInit && !isDragging && activeIndex === idx;
          return (
            <animated.group
              key={idx}
              rotation={item.rotation as unknown as THREE.Euler}
              position={item.position as unknown as THREE.Vector3}
            >
              <Pack
                geometry={geometry}
                material={material}
                isClickable={isClickable}
                onClick={handlePackClick}
              />
              <Html position={[0, 0, 0.1]} occlude="raycast">
                {idx}
              </Html>
            </animated.group>
          );
        })}
      </animated.group>
    </>
  );
};
