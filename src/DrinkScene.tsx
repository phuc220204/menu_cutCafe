import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { RoundedBox, ContactShadows } from '@react-three/drei';
import { CanvasTexture, Color, DoubleSide, Group, MathUtils, Mesh, MeshStandardMaterial, SRGBColorSpace } from 'three';
import type { Drink, Variant } from './menu';
type Props = { drink: Drink; variant: Variant; reduced: boolean; active: boolean };

function Beverage({drink,variant,reduced}:Omit<Props,'active'>) {
 const root=useRef<Group>(null!);const cup=useRef<Group>(null!);const coconut=useRef<Group>(null!);
 const liquid=useRef<MeshStandardMaterial>(null!);const milk=useRef<Mesh>(null!);const cream=useRef<Mesh>(null!);const ice=useRef<Group>(null!);const handle=useRef<Mesh>(null!);const steam=useRef<Group>(null!);
 const color=useMemo(()=>new Color(drink.color),[drink.color]);
 const [initial] = useState(()=>({color:drink.color,coconut:!!drink.coconut,milk:!!drink.milk,cream:!!drink.cream,hot:drink.variants&&variant.temperature==='hot'}));
 const label=useMemo(()=>{const canvas=document.createElement('canvas');canvas.width=512;canvas.height=320;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#f6f0e5';ctx.beginPath();ctx.roundRect(12,12,488,296,146);ctx.fill();ctx.fillStyle='#30241f';ctx.textAlign='center';ctx.font='bold 114px Fraunces, Georgia';ctx.fillText('cụt cụt',256,170);ctx.font='22px "Be Vietnam Pro", sans-serif';ctx.letterSpacing='5px';ctx.fillText('A LITTLE JOY',256,228);const texture=new CanvasTexture(canvas);texture.colorSpace=SRGBColorSpace;return texture;},[]);
 useEffect(()=>()=>label.dispose(),[label]);
 useFrame((state,delta)=>{
  const dt=Math.min(delta,.05);const factor=reduced?1:1-Math.exp(-dt*5.5);const time=state.clock.elapsedTime;
  root.current.position.y=MathUtils.lerp(root.current.position.y,reduced?0:Math.sin(time*.85)*.07,factor);
  root.current.rotation.x=MathUtils.lerp(root.current.rotation.x,reduced?.03:.03+state.pointer.y*.06,factor);
  root.current.rotation.y=MathUtils.lerp(root.current.rotation.y,reduced?-.13:-.13+state.pointer.x*.13,factor);
  root.current.rotation.z=MathUtils.lerp(root.current.rotation.z,reduced?-.11:-.11+Math.sin(time*.5)*.025,factor);
  cup.current.scale.setScalar(MathUtils.lerp(cup.current.scale.x,drink.coconut?.001:1,factor));
  coconut.current.scale.setScalar(MathUtils.lerp(coconut.current.scale.x,drink.coconut?1:.001,factor));
  liquid.current.color.lerp(color,factor);
  const hot=!!drink.variants&&variant.temperature==='hot';
  milk.current.scale.y=MathUtils.lerp(milk.current.scale.y,drink.milk?(variant.milk==='oat'?.86:1):.001,factor);
  cream.current.scale.y=MathUtils.lerp(cream.current.scale.y,drink.cream?1:.001,factor);
  ice.current.scale.setScalar(MathUtils.lerp(ice.current.scale.x,hot?.001:1,factor));
  handle.current.scale.setScalar(MathUtils.lerp(handle.current.scale.x,hot?1:.001,factor));
  steam.current.scale.setScalar(MathUtils.lerp(steam.current.scale.x,hot?1:.001,factor));
 });
 const glassMaterial=<meshPhysicalMaterial color="#fff8e9" transparent opacity={.23} roughness={.12} metalness={.05} side={DoubleSide} depthWrite={false}/>;
 return <group ref={root} rotation={[.03,-.13,-.11]}>
  <group ref={cup} scale={initial.coconut?.001:1}>
   <mesh position={[0,0,0]}><cylinderGeometry args={[.97,.72,2.42,64,1,true]}/>{glassMaterial}</mesh>
   <mesh position={[0,-.03,0]}><cylinderGeometry args={[.895,.695,2.12,64]}/><meshStandardMaterial ref={liquid} color={initial.color} roughness={.28}/></mesh>
   <mesh ref={milk} position={[0,-.675,0]} scale={[1,initial.milk?1:.001,1]}><cylinderGeometry args={[.764,.699,.77,64]}/><meshStandardMaterial color="#e5cba1" roughness={.45}/></mesh>
   <mesh position={[0,1.21,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.966,.028,12,80]}/><meshStandardMaterial color="#fff5dc" roughness={.18} transparent opacity={.8}/></mesh>
   <mesh position={[0,-1.19,0]}><cylinderGeometry args={[.72,.72,.09,64]}/><meshStandardMaterial color="#e4d4b7" roughness={.2} transparent opacity={.75}/></mesh>
   <mesh ref={cream} position={[0,1.05,0]} scale={[1,initial.cream?1:.001,1]}><cylinderGeometry args={[.9,.88,.16,64]}/><meshStandardMaterial color="#f5dfba" roughness={.8}/></mesh>
   <group ref={ice} scale={initial.hot?.001:1}>{[[0,.96,.3],[.4,.94,-.23],[-.42,1.03,-.1],[.12,.91,-.4],[-.34,.68,.45]].map((p,i)=><RoundedBox args={[.44,.38,.43]} radius={.075} smoothness={3} key={i} position={p as [number,number,number]} rotation={[i*.2,i*.7,.2]}><meshPhysicalMaterial color="#f6e8ce" transparent opacity={.65} roughness={.12} metalness={.1}/></RoundedBox>)}</group>
   <mesh position={[.05,-.17,.85]} rotation={[0,.01,0]}><planeGeometry args={[1.11,.7]}/><meshBasicMaterial map={label} transparent polygonOffset polygonOffsetFactor={-2}/></mesh>
   <mesh ref={handle} position={[1.04,.1,0]} rotation={[0,Math.PI/2,0]} scale={initial.hot?1:.001}><torusGeometry args={[.48,.09,12,40]}/><meshStandardMaterial color="#d7b98c" roughness={.3}/></mesh>
   <group ref={steam} position={[0,1.5,0]} scale={initial.hot?1:.001}>{[-.3,0,.3].map((x,i)=><mesh key={x} position={[x,i*.11,0]} rotation={[0,0,.15+i*.1]}><torusGeometry args={[.18,.014,6,20,Math.PI*1.2]}/><meshBasicMaterial color="#f6f0e5" transparent opacity={.6}/></mesh>)}</group>
  </group>
  <group ref={coconut} scale={initial.coconut?1:.001}>
   <mesh position={[0,-.17,0]} scale={[1,1.08,1]}><sphereGeometry args={[1.12,40,32]}/><meshStandardMaterial color="#95a267" roughness={.95}/></mesh>
   <mesh position={[0,.76,0]} rotation={[-.13,0,0]}><cylinderGeometry args={[.79,.87,.23,48]}/><meshStandardMaterial color="#e8dcc0" roughness={.9}/></mesh>
   <mesh position={[0,.885,0]}><cylinderGeometry args={[.68,.68,.015,48]}/><meshStandardMaterial color="#fff0d0" roughness={.35}/></mesh>
   <mesh position={[.34,1.25,0]} rotation={[0,0,-.2]}><cylinderGeometry args={[.035,.035,1.1,12]}/><meshStandardMaterial color="#c88952"/></mesh>
   <mesh position={[0,-.15,1.09]}><planeGeometry args={[1.02,.64]}/><meshBasicMaterial map={label} transparent/></mesh>
  </group>
 </group>;
}
export default function DrinkScene(props:Props) {
 const [lost,setLost]=useState(false);
 const [loaded,setLoaded]=useState(false);
 useEffect(()=>{let cancelled=false;document.fonts.ready.then(()=>{if(!cancelled)setLoaded(true);});return()=>{cancelled=true;};},[]);
 if(lost)throw new Error('WebGL context unavailable');
 if(!loaded)return null;
 return <Canvas dpr={[1,Math.min(window.devicePixelRatio,window.innerWidth<768?1.4:1.8)]} camera={{position:[3.1,2.25,6.6],fov:35}} frameloop={props.active?(props.reduced?'demand':'always'):'never'} gl={{alpha:true,antialias:true,powerPreference:'low-power'}} onCreated={({gl})=>{gl.domElement.addEventListener('webglcontextlost',()=>setLost(true),{once:true});}} style={{touchAction:'pan-y'}}>
  <ambientLight intensity={1.5}/><hemisphereLight args={['#fff8e6','#83654a',2.5]}/><directionalLight position={[-3,5,4]} intensity={3.8} color="#fff5df"/><directionalLight position={[4,3,-2]} intensity={2} color="#f5dab0"/>
  <Beverage {...props}/><ContactShadows position={[0,-1.48,0]} opacity={.3} scale={7} blur={2.8} far={4} resolution={256} frames={1} color="#72512f"/>
 </Canvas>;
}
