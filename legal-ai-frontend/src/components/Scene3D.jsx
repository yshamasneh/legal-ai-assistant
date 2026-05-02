import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useRef } from "react";

// ميزان العدل 3D
function JusticeScale({ isTyping }) {
  const groupRef = useRef();
  const armRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // سرعة الدوران: عادي = 0.3 | لما البوت يفكر = 1.2
    const rotationSpeed = isTyping ? 1.2 : 0.3;
    groupRef.current.rotation.y = t * rotationSpeed;

    // سعة التأرجح: عادي = 0.15 | لما يفكر = 0.4 (أكبر)
    const swingAmount = isTyping ? 0.4 : 0.15;
    const swingSpeed = isTyping ? 4 : 1.5;
    armRef.current.rotation.z = Math.sin(t * swingSpeed) * swingAmount;
  });

  // اللون يتغير حسب الحالة
  const metalColor = isTyping ? "#ef4444" : "#fbbf24"; // أحمر | ذهبي
  const baseColor = isTyping ? "#7f1d1d" : "#1e3a8a";  // أحمر غامق | أزرق غامق

  return (
    <group ref={groupRef} position={[0, -0.5, 0]}>
      {/* القاعدة السفلية */}
      <mesh position={[0, -1, 0]}>
        <cylinderGeometry args={[0.7, 0.8, 0.2, 32]} />
        <meshStandardMaterial color={baseColor} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* العمود العمودي */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 2, 32]} />
        <meshStandardMaterial
          color={metalColor}
          metalness={0.9}
          roughness={0.2}
          emissive={isTyping ? "#dc2626" : "#000000"}
          emissiveIntensity={isTyping ? 0.3 : 0}
        />
      </mesh>

      {/* الذراع الأفقي + الكفّتين */}
      <group ref={armRef} position={[0, 0.9, 0]}>
        {/* الذراع الأفقي */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.05, 0.05, 2, 32]} />
          <meshStandardMaterial
            color={metalColor}
            metalness={0.9}
            roughness={0.2}
            emissive={isTyping ? "#dc2626" : "#000000"}
            emissiveIntensity={isTyping ? 0.3 : 0}
          />
        </mesh>

        {/* الكفة اليسرى */}
        <group position={[-1, -0.3, 0]}>
          <mesh position={[0, 0.15, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.3, 16]} />
            <meshStandardMaterial color={metalColor} metalness={0.9} />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.35, 0.4, 0.08, 32]} />
            <meshStandardMaterial
              color={metalColor}
              metalness={0.9}
              roughness={0.2}
              emissive={isTyping ? "#dc2626" : "#000000"}
              emissiveIntensity={isTyping ? 0.3 : 0}
            />
          </mesh>
        </group>

        {/* الكفة اليمنى */}
        <group position={[1, -0.3, 0]}>
          <mesh position={[0, 0.15, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.3, 16]} />
            <meshStandardMaterial color={metalColor} metalness={0.9} />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.35, 0.4, 0.08, 32]} />
            <meshStandardMaterial
              color={metalColor}
              metalness={0.9}
              roughness={0.2}
              emissive={isTyping ? "#dc2626" : "#000000"}
              emissiveIntensity={isTyping ? 0.3 : 0}
            />
          </mesh>
        </group>
      </group>
    </group>
  );
}

// المشهد الكامل
function Scene3D({ isTyping = false }) {
  // خلفية تتغير حسب الحالة
  const bgClass = isTyping
    ? "bg-gradient-to-br from-red-950 via-red-900 to-gray-900"
    : "bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900";

  return (
    <div className={`w-full h-48 rounded-xl overflow-hidden transition-colors duration-700 ${bgClass}`}>
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        <pointLight
          position={[-3, 2, 3]}
          color={isTyping ? "#ef4444" : "#fbbf24"}
          intensity={1}
        />
        <pointLight position={[3, -2, -3]} color="#3b82f6" intensity={0.5} />

        <JusticeScale isTyping={isTyping} />

        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  );
}

export default Scene3D;