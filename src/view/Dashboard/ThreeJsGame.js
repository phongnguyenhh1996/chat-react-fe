import React, { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Grid, OrbitControls } from '@react-three/drei'
import { range } from "lodash";

function Box(props) {
  // This reference will give us direct access to the mesh
  const meshRef = useRef();
  // Set up state for the hovered and active state
  const [hovered, setHover] = useState(false);
  const [active, setActive] = useState(false);
  // Subscribe this component to the render-loop, rotate the mesh every frame
  // useFrame((state, delta) => (meshRef.current.rotation.x += delta));
  // Return view, these are regular three.js elements expressed in JSX
  return (
    <mesh
      {...props}
      ref={meshRef}
      scale={active ? 1.5 : 1}
      onPointerOver={(event) => setHover(true)}
      onPointerOut={(event) => setHover(false)}
    >
      <boxGeometry args={[2,0.1,2]}/>
      <meshStandardMaterial color={hovered ? "hotpink" : "orange"} />
    </mesh>
  );
}
const ThreeJsGame = () => {
  return (
    <div style={{height: '100vh'}} id="canvas-container">
      <Canvas>
        <ambientLight intensity={0.1} />
        <directionalLight color="white" position={[0, 5, 0]} />
        {range(0,9).map(x => {
          return range(0,9).map(y => {
            if (x === 0 || x=== 8 || y === 0 || y === 8)
            return <Box key={`${x}${y}` } position={[x*2.1 - 2.1*4, 0, y*2.1 - 2.1*4]}/>
          })
        })}
     
        <OrbitControls />
        <Grid />
      </Canvas>
    </div>
  );
};

export default ThreeJsGame;
