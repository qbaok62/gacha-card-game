import { animated, useSpring } from "@react-spring/three";
import { useGesture } from "@use-gesture/react";
import { ComponentProps, useRef } from "react";
import { Euler } from "three";

const constrainedAngle = Math.PI / 7;
interface Props extends ComponentProps<"mesh"> {
  isClickable?: boolean;
  onClick?: () => void;
}

export const Pack = ({ geometry, material, isClickable, onClick }: Props) => {
  const cardRef = useRef(null);
  const [{ rotation, scale }, set] = useSpring(() => ({
    rotation: [0, 0, 0],
    scale: 1,
    config: { mass: 1, tension: 300, friction: 80 },
  }));

  const bind = useGesture(
    {
      onDrag: ({ event, active, down, movement: [mx, my] }) => {
        event.stopPropagation();
        const xAngle = Math.max(
          Math.min(my / 100, constrainedAngle),
          -constrainedAngle
        );
        const yAngle = mx / 100;

        if (down) {
          set({ rotation: [xAngle, yAngle, 0], immediate: active });
        } else {
          const yDampingAngle = Math.round(yAngle / Math.PI) * Math.PI;
          set({ rotation: [0, yDampingAngle, 0], immediate: active });
        }
      },
      onClick: ({ event }) => {
        event.stopPropagation();
        set({
          scale: 2.5,
        });
        onClick?.();
      },
    },
    {
      enabled: isClickable,
    }
  );

  return (
    <>
      {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
      {/* @ts-ignore */}
      <animated.mesh
        {...bind()}
        ref={cardRef}
        scale={scale}
        geometry={geometry}
        material={material}
        rotation={rotation as unknown as Euler}
      />
    </>
  );
};
