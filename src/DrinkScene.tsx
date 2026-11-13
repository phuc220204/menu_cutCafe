import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, RoundedBox } from '@react-three/drei';
import gsap from 'gsap';
import { CanvasTexture, CatmullRomCurve3, Color, CylinderGeometry, DoubleSide, Group, MathUtils, Mesh, MeshStandardMaterial, SRGBColorSpace, Vector3 } from 'three';
import type { DirectionalLight } from 'three';
import type { Category, Drink, Variant } from './menu';

type Props = { drink: Drink; variant: Variant; category: Category; reduced: boolean; active: boolean; intro: boolean };
type StageProps = Props & { mobile: boolean };

function drawLabel(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d')!;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#f3ead9';
  context.beginPath();
  context.roundRect(6, 6, 1012, 500, 38);
  context.fill();
  context.fillStyle = '#23170f';
  context.textAlign = 'center';
  context.font = '800 138px "Bricolage Grotesque Variable", sans-serif';
  context.fillText('Cụt Cafe', 512, 270);
  context.font = '500 27px "Be Vietnam Pro", sans-serif';
  context.letterSpacing = '9px';
  context.fillText('MỘT NGỤM VUI', 512, 358);
  context.letterSpacing = '0px';
  context.strokeStyle = '#b99a71';
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(437, 124);
  context.lineTo(587, 124);
  context.stroke();
}

function useProductTextures() {
  const invalidate = useThree(state => state.invalidate);
  const textures = useMemo(() => {
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 1024;
    labelCanvas.height = 512;
    drawLabel(labelCanvas);
    const label = new CanvasTexture(labelCanvas);
    label.colorSpace = SRGBColorSpace;

    const skinCanvas = document.createElement('canvas');
    skinCanvas.width = 256;
    skinCanvas.height = 512;
    const skinContext = skinCanvas.getContext('2d')!;
    skinContext.fillStyle = '#89945b';
    skinContext.fillRect(0, 0, 256, 512);
    let seed = 29;
    const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let index = 0; index < 450; index++) {
      const x = random() * 256;
      const y = random() * 512;
      skinContext.strokeStyle = index % 3 === 0 ? '#b4b77c' : '#63734b';
      skinContext.globalAlpha = .08 + random() * .18;
      skinContext.lineWidth = .5 + random() * 1.5;
      skinContext.beginPath();
      skinContext.moveTo(x, y);
      skinContext.lineTo(x + random() * 8, y + 20 + random() * 70);
      skinContext.stroke();
    }
    const skin = new CanvasTexture(skinCanvas);
    skin.colorSpace = SRGBColorSpace;

    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = shadowCanvas.height = 128;
    const shadowContext = shadowCanvas.getContext('2d')!;
    const gradient = shadowContext.createRadialGradient(64, 64, 4, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(0,0,0,.7)');
    gradient.addColorStop(.45, 'rgba(0,0,0,.3)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    shadowContext.fillStyle = gradient;
    shadowContext.fillRect(0, 0, 128, 128);
    const shadow = new CanvasTexture(shadowCanvas);
    return { labelCanvas, label, skin, shadow };
  }, []);

  useEffect(() => {
    let mounted = true;
    // StrictMode replays effects; revive each retained texture after its trial cleanup.
    textures.label.needsUpdate = true;
    textures.skin.needsUpdate = true;
    textures.shadow.needsUpdate = true;
    invalidate();
    document.fonts.ready.then(() => {
      if (!mounted) return;
      drawLabel(textures.labelCanvas);
      textures.label.needsUpdate = true;
      invalidate();
    });
    return () => {
      mounted = false;
      textures.label.dispose();
      textures.skin.dispose();
      textures.shadow.dispose();
    };
  }, [textures, invalidate]);
  return textures;
}

/** Fit each layer inside the glass without opaque overlapping liquid volumes. */
function shapeLayer(mesh: Mesh, bottom: number, top: number) {
  const geometry = mesh.geometry as CylinderGeometry;
  const positions = geometry.attributes.position;
  const normals = geometry.attributes.normal;
  const lastRange = geometry.userData.range as [number, number] | undefined;
  if (lastRange && Math.abs(lastRange[0] - bottom) < .00001 && Math.abs(lastRange[1] - top) < .00001) return;
  if (!geometry.userData.original) geometry.userData.original = new Float32Array(positions.array);
  if (!geometry.userData.originalNormals) geometry.userData.originalNormals = new Float32Array(normals.array);
  const base = geometry.userData.original as Float32Array;
  const baseNormals = geometry.userData.originalNormals as Float32Array;
  const height = Math.max(.001, top - bottom);
  const slope = -.197 / 2.18 * height;
  const normalLength = Math.sqrt(1 + slope * slope);
  for (let index = 0; index < positions.count; index++) {
    const y = bottom + (base[index * 3 + 1] + .5) * height;
    const radius = .708 + .197 * MathUtils.clamp((y + 1.1) / 2.18, 0, 1);
    positions.setX(index, base[index * 3] * radius);
    positions.setZ(index, base[index * 3 + 2] * radius);
    if (Math.abs(baseNormals[index * 3 + 1]) < .5) {
      normals.setXYZ(index, baseNormals[index * 3] / normalLength, slope / normalLength, baseNormals[index * 3 + 2] / normalLength);
    }
  }
  positions.needsUpdate = true;
  normals.needsUpdate = true;
  geometry.userData.range = [bottom, top];
  mesh.position.y = (bottom + top) / 2;
  mesh.scale.y = height;
}

function CameraRig({ category, drink, variant, intro, active, reduced, mobile }: StageProps) {
  const { camera, invalidate } = useThree();
  const previous = useRef('');
  const target = useMemo(() => new Vector3(0, .17, 0), []);
  useFrame(() => camera.lookAt(target));

  useEffect(() => {
    const key = `${category.id}/${drink.id}/${variant.temperature}/${variant.milk}`;
    const first = previous.current === '';
    const categoryChanged = previous.current.split('/')[0] !== category.id;
    const [x, y, z] = category.scene.camera;
    const final = { x: mobile ? x * .55 : x, y: mobile ? y * .88 : y, z: mobile ? z + .25 : z };
    const update = () => { camera.lookAt(target); invalidate(); };
    gsap.killTweensOf(camera.position);
    previous.current = key;
    if (reduced || !active) {
      camera.position.set(final.x, final.y, final.z);
      update();
      return;
    }
    const timeline = gsap.timeline({ onUpdate: update });
    if (first) {
      camera.position.set(final.x * (intro ? .72 : 1), final.y, final.z * (intro ? .79 : 1));
      timeline.to(camera.position, { ...final, duration: intro ? 1.3 : 0, ease: 'power3.out' });
    } else if (categoryChanged || intro) {
      timeline.to(camera.position, { ...final, duration: .8, ease: 'power2.inOut' });
    } else {
      timeline
        .to(camera.position, { x: final.x * .97, y: final.y, z: final.z * .965, duration: .22, ease: 'power2.out' })
        .to(camera.position, { ...final, duration: .43, ease: 'power2.inOut' });
    }
    update();
    return () => { timeline.kill(); };
  }, [category.id, category.scene, drink.id, variant.temperature, variant.milk, intro, active, reduced, mobile, camera, invalidate, target]);
  return null;
}

function Beverage({ drink, variant, reduced, mobile }: StageProps) {
  const { invalidate, camera } = useThree();
  const heading = useRef<Group>(null!);
  const floating = useRef<Group>(null!);
  const cup = useRef<Group>(null!);
  const coconut = useRef<Group>(null!);
  const liquid = useRef<Mesh>(null!);
  const milk = useRef<Mesh>(null!);
  const cream = useRef<Mesh>(null!);
  const ice = useRef<Group>(null!);
  const handle = useRef<Mesh>(null!);
  const steam = useRef<Group>(null!);
  const phase = useRef(0);
  const { label, skin, shadow } = useProductTextures();
  const coffeeColor = useMemo(() => new Color(drink.color), [drink.color]);
  const milkColor = useMemo(() => new Color(variant.milk === 'oat' ? '#dac08e' : '#ead9b9'), [variant.milk]);
  const hot = !!drink.variants && variant.temperature === 'hot';
  const [initial] = useState(() => ({ coconut: !!drink.coconut, color: drink.color, hot }));
  const blend = useRef({ milk: drink.milk ? .78 : .001, cream: drink.cream ? .16 : .001 });
  const steamCurves = useMemo(() => [-.25, .04, .3].map((x, index) => new CatmullRomCurve3(
    Array.from({ length: 9 }, (_, point) => new Vector3(x + Math.sin(point * .75 + index) * .07, point * .12, Math.cos(point * .8 + index) * .04)),
  )), []);

  useEffect(() => { invalidate(); }, [drink, variant, reduced, invalidate]);
  useFrame((state, delta) => {
    const factor = reduced ? 1 : 1 - Math.exp(-Math.min(delta, .05) * 7);
    if (!reduced) phase.current += Math.min(delta, .05);
    const time = phase.current;
    heading.current.rotation.y = Math.atan2(camera.position.x, camera.position.z);
    floating.current.position.y = MathUtils.lerp(floating.current.position.y, reduced ? 0 : Math.sin(time * .8) * .045, factor);
    floating.current.rotation.z = MathUtils.lerp(floating.current.rotation.z, reduced ? -.045 : -.045 + Math.sin(time * .45) * .018, factor);
    floating.current.rotation.x = MathUtils.lerp(floating.current.rotation.x, !reduced && !mobile ? state.pointer.y * .035 : 0, factor);
    floating.current.rotation.y = MathUtils.lerp(floating.current.rotation.y, !reduced && !mobile ? state.pointer.x * .06 : 0, factor);
    cup.current.scale.setScalar(MathUtils.lerp(cup.current.scale.x, drink.coconut ? .001 : 1, factor));
    coconut.current.scale.setScalar(MathUtils.lerp(coconut.current.scale.x, drink.coconut ? 1 : .001, factor));
    const targetMilk = drink.milk ? (drink.id === 'bac-xiu' ? 1.35 : drink.id === 'coco-matcha' ? 1.05 : .78) : .001;
    blend.current.milk = MathUtils.lerp(blend.current.milk, targetMilk, factor);
    blend.current.cream = MathUtils.lerp(blend.current.cream, drink.cream ? .16 : .001, factor);
    milk.current.visible = blend.current.milk > .004;
    cream.current.visible = blend.current.cream > .004;
    const milkTop = -1.1 + blend.current.milk;
    const coffeeTop = 1.08 - blend.current.cream;
    shapeLayer(milk.current, -1.1, milkTop);
    shapeLayer(liquid.current, milkTop, coffeeTop);
    shapeLayer(cream.current, coffeeTop, 1.08);
    (liquid.current.material as MeshStandardMaterial).color.lerp(coffeeColor, factor);
    (milk.current.material as MeshStandardMaterial).color.lerp(milkColor, factor);
    ice.current.scale.setScalar(MathUtils.lerp(ice.current.scale.x, hot ? .001 : 1, factor));
    handle.current.scale.setScalar(MathUtils.lerp(handle.current.scale.x, hot ? 1 : .001, factor));
    steam.current.scale.setScalar(MathUtils.lerp(steam.current.scale.x, hot ? 1 : .001, factor));
    steam.current.position.y = 1.43 + (!reduced ? Math.sin(time * .65) * .035 : 0);
  });

  return <>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.35, 0]} scale={drink.coconut ? [4.6, 3.5, 1] : [3.6, 2.6, 1]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={shadow} transparent depthWrite={false} opacity={.75} />
    </mesh>
    <group ref={heading}><group ref={floating} rotation={[0, 0, -.045]}>
      <group ref={cup} scale={initial.coconut ? .001 : 1}>
        <mesh>
          <cylinderGeometry args={[.97, .735, 2.5, 64, 1, true]} />
          <meshPhysicalMaterial color="#fff0d0" transparent opacity={.17} metalness={.03} roughness={.095} envMapIntensity={1.3} clearcoat={1} side={DoubleSide} depthWrite={false} />
        </mesh>
        <mesh ref={liquid} frustumCulled={false}>
          <cylinderGeometry args={[1, 1, 1, 64]} />
          <meshStandardMaterial color={initial.color} roughness={.28} envMapIntensity={.6} />
        </mesh>
        <mesh ref={milk} frustumCulled={false}>
          <cylinderGeometry args={[1, 1, 1, 64]} />
          <meshStandardMaterial color="#ead9b9" roughness={.48} />
        </mesh>
        <mesh ref={cream} frustumCulled={false}>
          <cylinderGeometry args={[1, 1, 1, 64]} />
          <meshStandardMaterial color="#f4e3c4" roughness={.82} />
        </mesh>
        <mesh position={[0, 1.25, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[.966, .023, 10, 80]} />
          <meshPhysicalMaterial color="#fff0d7" transparent opacity={.72} roughness={.12} metalness={.18} envMapIntensity={1.5} />
        </mesh>
        <mesh position={[0, -1.23, 0]}>
          <cylinderGeometry args={[.737, .737, .085, 64]} />
          <meshPhysicalMaterial color="#c6ad83" transparent opacity={.5} roughness={.12} metalness={.1} />
        </mesh>
        <group ref={ice} scale={initial.hot ? .001 : 1}>
          {[[.03, 1.03, .35], [.4, .99, -.2], [-.39, 1.02, -.14], [.1, .82, -.43], [-.35, .7, .36]].map((position, index) =>
            <RoundedBox key={index} args={[.43, .37, .42]} radius={.075} smoothness={3} position={position as [number, number, number]} rotation={[index * .27, index * .63, .16]}>
              <meshPhysicalMaterial color="#fff3d6" transparent opacity={.64} transmission={.13} thickness={.25} ior={1.31} roughness={.1} envMapIntensity={1.5} />
            </RoundedBox>)}
        </group>
        <mesh position={[0, -.15, 0]} renderOrder={3}>
          <cylinderGeometry args={[.874, .814, .64, 48, 1, true, -.66, 1.32]} />
          <meshBasicMaterial map={label} transparent depthWrite={false} polygonOffset polygonOffsetFactor={-2} />
        </mesh>
        <mesh ref={handle} position={[1.045, .05, 0]} rotation={[0, Math.PI / 2, 0]} scale={initial.hot ? 1 : .001}>
          <torusGeometry args={[.45, .075, 12, 48]} />
          <meshPhysicalMaterial color="#e9d2a7" transparent opacity={.75} roughness={.14} envMapIntensity={1.4} />
        </mesh>
        <group ref={steam} position={[0, 1.43, 0]} scale={initial.hot ? 1 : .001}>
          {steamCurves.map((curve, index) => <mesh key={index}>
            <tubeGeometry args={[curve, 24, .012 - index * .0015, 4, false]} />
            <meshBasicMaterial color="#f3e4c8" transparent opacity={.14 - index * .025} depthWrite={false} />
          </mesh>)}
        </group>
      </group>
      <group ref={coconut} scale={initial.coconut ? 1 : .001} position={[0, -.1, 0]}>
        <mesh>
          <sphereGeometry args={[1.13, 48, 32, 0, Math.PI * 2, .63, Math.PI - .63]} />
          <meshStandardMaterial map={skin} bumpMap={skin} bumpScale={.055} roughness={.94} />
        </mesh>
        <mesh position={[0, .915, 0]}>
          <cylinderGeometry args={[.665, .665, .04, 48]} />
          <meshStandardMaterial color="#e8ddbd" roughness={.84} />
        </mesh>
        <mesh position={[0, .939, 0]}>
          <cylinderGeometry args={[.53, .53, .009, 48]} />
          <meshStandardMaterial color="#c5c49a" roughness={.25} envMapIntensity={.8} />
        </mesh>
        <mesh position={[.27, 1.35, -.02]} rotation={[0, 0, -.2]}>
          <cylinderGeometry args={[.032, .032, 1.15, 12]} />
          <meshStandardMaterial color="#d8b982" roughness={.7} />
        </mesh>
        <mesh position={[0, -.1, 1.125]} renderOrder={3}>
          <planeGeometry args={[1.05, .52]} />
          <meshBasicMaterial map={label} transparent depthWrite={false} />
        </mesh>
      </group>
    </group></group>
  </>;
}

function Studio(props: StageProps) {
  const { invalidate } = useThree();
  const [initialLighting] = useState(() => ({ key: props.category.scene.light, rim: props.category.scene.rim }));
  const key = useRef<DirectionalLight>(null!);
  const rim = useRef<DirectionalLight>(null!);
  useEffect(() => {
    const keyColor = new Color(props.category.scene.light);
    const rimColor = new Color(props.category.scene.rim);
    const duration = props.reduced || !props.active ? 0 : .8;
    const first = gsap.to(key.current.color, { r: keyColor.r, g: keyColor.g, b: keyColor.b, duration, onUpdate: invalidate });
    const second = gsap.to(rim.current.color, { r: rimColor.r, g: rimColor.g, b: rimColor.b, duration, onUpdate: invalidate });
    invalidate();
    return () => { first.kill(); second.kill(); };
  }, [props.category.scene, props.reduced, props.active, invalidate]);
  return <>
    <CameraRig {...props} />
    <ambientLight intensity={.55} />
    <hemisphereLight args={['#fff1d5', '#20150e', .8]} />
    <directionalLight ref={key} position={[-3.5, 5, 4]} intensity={3.2} color={initialLighting.key} />
    <directionalLight ref={rim} position={[3, 2, -4]} intensity={4} color={initialLighting.rim} />
    <directionalLight position={[3, 1, 4]} intensity={.7} color="#fff7e2" />
    <Environment resolution={128} frames={1} environmentIntensity={.65}>
      <Lightformer form="rect" intensity={3} color="#fff1da" position={[-3, 2, 3]} scale={[2, 5, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={1.8} color="#e7cfa8" position={[3, 1, -2]} scale={[1.3, 4, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={1.3} color="#fff9e9" position={[0, 5, 0]} scale={[3, 3, 1]} target={[0, 0, 0]} />
    </Environment>
    <Beverage {...props} />
  </>;
}

export default function DrinkScene(props: Props) {
  const [lost, setLost] = useState(false);
  const [initialCamera] = useState(() => ({ position: [...props.category.scene.camera] as [number, number, number], fov: 34, near: .1, far: 40 }));
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 900px)').matches);
  const [pixelRatio, setPixelRatio] = useState(() => Math.min(window.devicePixelRatio || 1, mobile ? 1.4 : 1.8));
  useEffect(() => {
    const media = window.matchMedia('(max-width: 900px)');
    const update = () => {
      setMobile(media.matches);
      setPixelRatio(Math.min(window.devicePixelRatio || 1, media.matches ? 1.4 : 1.8));
    };
    media.addEventListener('change', update);
    window.addEventListener('resize', update);
    return () => { media.removeEventListener('change', update); window.removeEventListener('resize', update); };
  }, []);
  if (lost) throw new Error('WebGL context unavailable');
  return <Canvas
    dpr={pixelRatio}
    camera={initialCamera}
    frameloop={props.active ? props.reduced ? 'demand' : 'always' : 'never'}
    gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
    onCreated={({ gl }) => {
      gl.setClearColor('#000000', 0);
      gl.domElement.addEventListener('webglcontextlost', (event) => { event.preventDefault(); setLost(true); }, { once: true });
    }}
    style={{ touchAction: 'pan-y' }}
    aria-label={`Đồ uống 3D: ${props.drink.name}`}
  >
    <Studio {...props} mobile={mobile} />
  </Canvas>;
}
