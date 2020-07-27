const vertexShader = `
  uniform float time;
  uniform float progress;
  uniform float direction;
  varying vec2 vUv;
  void main() {
    vec3 pos = position;
    //pos.z = 0.1 * sin(pos.x);
    float dist = length(uv - vec2(0.5));
    float maxdist = length(vec2(0.5));
    float normalizedDist = dist / maxdist;

    float stickTo = normalizedDist;
    float stickOut = -normalizedDist;

    float stickEffect = mix(stickTo, stickOut, direction);

   

    float superProgress =  min(2.0 * progress, 2.0*(1.0 - progress));

    float zProgress = mix(clamp(2.0 * progress, 0.0, 1.0), clamp(1.0 - 2.0 * (1.0-progress), 0.0, 1.0), direction);

    float offsetZ = 10.0; 

    pos.z += offsetZ * (stickEffect * superProgress - zProgress);
    pos.z += progress * sin(dist * 10.0 - time);

    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const fragmentShader = `
  uniform float time;
  uniform float progress;
  uniform sampler2D texture1;
  varying vec2 vUv;
  void main() {
    vec4 color = texture2D(texture1, vUv);
    gl_FragColor = vec4(vUv, vec2(0.0, 1.0));
    gl_FragColor = color;
    //gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
  }
`

const touch = !!('ontouchstart' in window)
const touchBegan = touch ? 'touchstart' : 'mousedown'
const touchMoved = touch ? 'touchmove' : 'mousemove'
const touchEnded = touch ? 'touchend' : 'mouseup'

const imgW = 1350
const imgH = 900
const imgRatio = imgW / imgH

class App {

  constructor() {
    this._init()
  }

  _init() {
    this._initScene()
    this._createPlane()
    this._bindEvent()
    this._setSize()
    this._render()
  }

  _initScene() {
    this.w = window.innerWidth
    this.h = window.innerHeight
    this.scene = new THREE.Scene()
    this.renderer = new THREE.WebGLRenderer({
      antialias: true
    })
    this.renderer.setSize(this.w, this.h)
    this.camera = new THREE.PerspectiveCamera(70, this.w/this.h, 0.01, 1000)
    this.camera.position.set(0, 0, 10)
    document.body.append(this.renderer.domElement)

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement)
    this.clock = new THREE.Clock()
    this.clock.start()
  }

  _createPlane() {
    this.planeW = window.innerWidth
    this.planeH = this.planeW / imgRatio
    const geo = new THREE.PlaneBufferGeometry(this.planeW, this.planeH, 50, 50)
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        time: {
          value: 0.0
        },
        direction: {
          value: 0.0
        },
        progress: {
          value: 0.0
        },
        texture1: {
          value: new THREE.TextureLoader().load('img/02.jpg')
        }
      },
      fragmentShader,
      vertexShader,
      wireframe: false
    })
    const plane = new THREE.Mesh(geo, this.material)
    this.scene.add(plane)
  }

  _setSize() {
    this.w = window.innerWidth
    this.h = window.innerHeight

    const dist = this.camera.position.z 
    this.camera.fov = 2 * (180 / Math.PI) * Math.atan(this.h / (2 * dist))

    this.renderer.setSize(this.w, this.h)
    this.camera.aspect = this.w / this.h
    this.camera.updateProjectionMatrix()
  }

  _bindEvent() {
    window.addEventListener('resize', this._setSize.bind(this), false)
    document.addEventListener(touchBegan, this._onTouchBegan.bind(this), false)
    document.addEventListener(touchEnded, this._onTouchEnded.bind(this), false)
  }

  _onTouchBegan(e) {
    this.material.uniforms.direction.value = 0.0
    gsap.to(this.material.uniforms.progress, {
      value: 1,
      duration: 0.6,
      ease: 'expo.easeOut'
    })
  }

  _onTouchEnded(e) {
    this.material.uniforms.direction.value = 1.0
    gsap.to(this.material.uniforms.progress, {
      value: 0,
      duration: 0.6,
      ease: 'expo.easeIn'
    })
  }

  _render() {
    const time = this.clock.getElapsedTime()
    this.material.uniforms.time.value = time
    this.renderer.render(this.scene, this.camera)
    requestAnimationFrame(this._render.bind(this))
  }

}

const app = new App()
