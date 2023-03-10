import './style.css'
import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'
import vertexShader from './shaders/vertex.glsl'
import shadowFragment from './shaders/shadowFragment.glsl' 
import fragmentShader from './shaders/fragment.glsl'
import { ShadowMapViewer} from 'three/examples/jsm/utils/ShadowMapViewer.js'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';

let intensity_0 = new THREE.Vector4(1, 0, 0, 0);
let group = new THREE.Group();
let meshProps = [];
let helpers = [];
let uniforms;
let octa, sphere, dode, donut;


let isMobile = false;
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

scene.background = new THREE.Color(0xE1E5EA)

let texture1 = new THREE.TextureLoader().load('textures/girl_basic.jpg');
//let texture1 = new THREE.TextureLoader().load('door.jpg');
texture1.wrapS = THREE.RepeatWrapping;
texture1.wrapT = THREE.RepeatWrapping;
texture1.repeat.set( 1, 1 );
texture1.flipY = false;
texture1.needsUpdate = true;

//console.log(texture1)


    
/**
 * 라이트를 먼저 만든다.
 */

const light = new THREE.DirectionalLight(0xffffff, 1.0);
light.position.set(-60, 50, 40);
scene.add(light)

const girlMaterial = new THREE.MeshStandardMaterial({map:texture1});


/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}
/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 1, 10000)
camera.position.set(-10,0,70).multiplyScalar(2);
scene.add(camera)


const frustumSize = 200;


light.shadow.camera = new THREE.OrthographicCamera(

    -frustumSize / 2,
    frustumSize / 2,
    frustumSize / 2,
    -frustumSize / 2,
    1,
   200
)

light.shadow.camera.position.copy(light.position)
light.shadow.camera.lookAt(scene.position)

scene.add(light.shadow.camera);

light.shadow.mapSize.x = 4096;
light.shadow.mapSize.y = 4096;

const pars = {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter, 
    format: THREE.RGBAFormat
}

light.shadow.map = new THREE.WebGLRenderTarget(light.shadow.mapSize.x, light.shadow.mapSize.y, pars)
const shadowCameraHelper = new THREE.CameraHelper( light.shadow.camera );
//scene.add( shadowCameraHelper );
/**
 * Object
 */


/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.render(scene, camera)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    isMobile = sizes.width <= 768
})

const controls = new OrbitControls(camera, canvas);






const depthViewer = new ShadowMapViewer(light);
depthViewer.size.set( 300, 300 );


renderer.setRenderTarget(null);




const clock = new THREE.Clock();


const tick = () =>
{
    const elapsedTime = clock.getElapsedTime();
    
    controls.update();

    for(let i = 0; i < meshProps.length; i++){
        const allMeshProps = meshProps[i];
        allMeshProps.mesh.material = allMeshProps.shadowMaterial;
    }


    for(let i = 0; i < helpers.length; i++){
        this.helpers[i].visible = false;
    }
   
    renderer.setRenderTarget(light.shadow.map)
    renderer.render(scene, light.shadow.camera)

    
    for(let i = 0; i < meshProps.length; i++){
        const allMeshProps = meshProps[i];
        allMeshProps.mesh.material = allMeshProps.material;
    }
    

    renderer.setRenderTarget(null);
    renderer.render(scene, camera);

    depthViewer.render( renderer );

    octa.rotation.x += 0.02;
    donut.rotation.z += 0.01;

    //renderer.render(scene, camera);

    window.requestAnimationFrame(tick);

}



scene.add(group);
createMesh();
//createControls();
tick();



function createControls(){
    let params = {
        depthmapViewer: isMobile ? false : true,
        visibleShadowCamera: true,
        output: "color shading",
        color: 0xE1E5EA,
        shadowColor: 0x333333

    }

    let gui = new GUI();
    gui.add(params, "depthmapViewer").onChange((value) => {
        depthViewer.enabled = value;
    });
    gui.add(params, "visibleShadowCamera");
    gui.add(params, "output", [
        "color shading",
        "shadow * lighting",
        "shadow",
        "lighting",
    ]).onChange((value) => {
       intensity_0.set(0, 0, 0, 0);

        switch(value){
            case "color shading": 
               intensity_0.x = 1;
                break;
            case "shadow * lighting":
                intensity_0.y = 1;
                break;
            case "shadow":
                intensity_0.z = 1;
                break;
            case "lighting":
                intensity_0.w = 1;
                break;
        }
    });

    gui.addColor(params, "color").onChange(() =>{
        uniforms.uColor.value.set(params.color)
    });

    gui.addColor(params, "shadowColor").onChange(() =>{
        uniforms.shadowColor.value.set(params.shadowColor)
    })

    gui.add(light.rotation,'y',0,360,0.001)

}

function modelLoad(name)
    {
        var parent = new THREE.Object3D();
        parent.name = name;
        scene.add(parent);

        const loader = new GLTFLoader();
        loader.load(
            './mamondegirl_1.glb',(gltf)=>{
             const model = gltf.scene;
             var parent = scene.getObjectByName(name);
             
             if(parent)
             {
                parent.add(model);
             }
            
            }
        )
    }


function createMesh()
{
    octa = createObj(new THREE.OctahedronGeometry(30), 0xff70fd, 0x1c05fe);
    octa.position.set(0,0,0);

    sphere = createObj(new THREE.SphereGeometry(20), 0xeffe05, 0x1c05fe);
    sphere.position.set(-50,-10,-0);

    dode = createObj(new THREE.DodecahedronGeometry(55),0x05effe, 0x1c05fe);
    dode.position.set(0,-80,0);

    donut = createObj(new THREE.TorusKnotGeometry( 9, 6, 300, 100 ), 0xff70fd, 0x1c05fe);
    donut.position.set(50,-60,0)

}



function createMaterial(color, shadowColor, vertexShader, fragmentShader)
{
    uniforms = {
        
        shadowColor:{
            value: new THREE.Color(shadowColor)
        },
        uTime: {
            value: 0
        },
        uColor: {
            value: new THREE.Color(color)
        },
        uLightPos: {
            value: light.position
        },
        uDepthMap: {
            value: light.shadow.map.texture
        },
        uShadowCameraP: {
            value: light.shadow.camera.projectionMatrix
        },
        uShadowCameraV: {
            value: light.shadow.camera.matrixWorldInverse
        },
        uIntensity_0: {
            value: intensity_0
        },
    
        u_texture : {
            value: texture1
        }
    }

    const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms,
    });

    const shadowMaterial = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader: shadowFragment,
        uniforms,
        // side: THREE.BackSide
    });

    return {material, shadowMaterial}
}

function createObj(geometry, color, shadowColor)
    {
        const {material, shadowMaterial} = createMaterial(color, shadowColor, vertexShader, fragmentShader);

        const mesh = new THREE.Mesh(geometry, material);

        group.add(mesh);

        meshProps.push({
            mesh, material, shadowMaterial
        })

        return mesh;

    }
    

  