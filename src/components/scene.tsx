import { Environment, PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { PackList } from "./pack-list";

export const Scene = () => {
  return (
    <Canvas className="touch-none">
      <PerspectiveCamera position={[0, 0, 3]} fov={100} makeDefault />
      <PackList />
      <Environment background preset="sunset" blur={0.8} />
      {/* <OrbitControls /> */}
      <axesHelper />
    </Canvas>
  );
};
