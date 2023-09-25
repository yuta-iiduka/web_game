// three.js依存
import * as THREE from "../libs/three/build/three.module.js";
import { OrbitControls } from "../libs/three/jsm/controls/OrbitControls.js";
//OrbitControls.js内のimport先を'../../build/three.module.js'へ変更

// stats.js依存 https://github.com/mrdoob/stats.js
//debug
import Stats from "../libs/three/stats/stats.module.js";
import dat from "../libs/three/dat/dat.gui.module.js";

class WEB3D {
  static list = [];
  static cnt = 0;
  static renderer = new THREE.WebGLRenderer();
  static active_w3 = null;
  static b_param_gui = false;
  static b_stats = false;

  //スタティックイニシャライザ
  static {
    this.$view = $("#view");
    this.$view.append(WEB3D.renderer.domElement);
    this.w = this.$view.width();
    this.h = this.$view.height();
    this.renderer.setClearColor(new THREE.Color("0xEEEEEE"));
    this.renderer.setSize(this.w, this.h);
    this.renderer.shadowMap.enabled = true;
    this.gui = new dat.GUI();
    this.stats = new Stats();
    this.$view.append(this.stats.domElement);
    console.warn("static initializer is called.")
  }

  constructor(name) {
    this.id = WEB3D.cnt;
    this.active = false;
    if (name === undefined) {
      this.name = name;
    } else {
      this.name = "";
    }

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, WEB3D.w / WEB3D.h, 0.1, 1000);
    this.axes = new THREE.AxesHelper(20);
    this.scene.add(this.axes);

    this.set_stats(WEB3D.b_stats);
    this.set_param_gui(WEB3D.b_param_gui);

    WEB3D.list.push(this);
    WEB3D.cnt++;

    console.warn("constructor is called.")

  }

  init() {
    this.set_camera(-30, 40, 30);
    this.set_plane();
    this.set_cube();
    this.set_sphere();
    this.set_fog();
    this.set_spot_light();
    this.set_mouse_controller();

    this.draw();
    return this;
  }

  draw() {
    let self = this;
    if (this.active === true) {
      if (WEB3D.stats !== null) { WEB3D.stats.update(); }
      this.update();
      requestAnimationFrame(function () { self.draw() });
      WEB3D.renderer.render(this.scene, this.camera);
    }
    return this;
  }

  resize() {
    this.w = WEB3D.$view.width();
    this.h = WEB3D.$view.height();
    this.camera.aspect = this.w / this.h;
    this.camera.updateProjectionMatrix();
    WEB3D.renderer.setSize(this.w, this.h);
    // this.draw();
    return this;
  }

  set_camera(x, y, z) {
    this.camera.position.x = x;
    this.camera.position.y = y;
    this.camera.position.z = z;
    this.camera.lookAt(this.scene.position);

    return this;
  }

  set_plane() {
    let planeGeometry = new THREE.PlaneGeometry(60, 20);
    // let planeMaterial = new THREE.MeshBasicMaterial({ color: 0xcccccc });
    let planeMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc });
    let plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.receiveShadow = true;

    plane.name = "plane";

    plane.rotation.x = -0.5 * Math.PI;
    plane.position.x = 15;
    plane.position.y = 0;
    plane.position.z = 0;

    this.scene.add(plane);

    return this;
  }

  set_cube() {
    let cubeGeometry = new THREE.BoxGeometry(4, 4, 4);
    // let cubeMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
    let cubeMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000, wireframe: true });
    let cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.castShadow = true;

    cube.name = "cube";

    cube.position.x = -4;
    cube.position.y = 3;
    cube.position.z = 0;

    cube.update = function () {
      cube.rotation.x += 0.02;
      cube.rotation.y += 0.02;
      cube.rotation.z += 0.02;
    }

    this.scene.add(cube);

    return this;
  }

  set_sphere() {
    let sphereGeometry = new THREE.SphereGeometry(4, 20, 20);
    // let sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x7777ff, wireframe: true });
    let sphereMaterial = new THREE.MeshLambertMaterial({ color: 0x7777ff, wireframe: true });
    let sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.castShadow = true;

    sphere.name = "sphere";

    sphere.position.x = 20;
    sphere.position.y = 4;
    sphere.position.z = 2;

    this.scene.add(sphere);

    return this;
  }

  set_spot_light() {
    let spotLight = new THREE.SpotLight(0xffffff);
    spotLight.position.set(-20, 30, -5);
    spotLight.castShadow = true;
    this.scene.add(spotLight);

    return this;
  }

  set_mouse_controller() {
    //マウス操作を有効化
    let controls = new OrbitControls(this.camera, WEB3D.renderer.domElement);

    return this;
  }

  //debug
  set_stats(b_stats) {
    if (b_stats === true) {
      WEB3D.stats.setMode(0);
      WEB3D.stats.domElement.style.position = "absolute";
      WEB3D.stats.domElement.style.left = "0px";
      WEB3D.stats.domElement.style.top = "0px";
    } else {
      WEB3D.stats.domElement.style.display = "none";
    }
    return this;
  }

  //debug
  set_param_gui(b_param_gui) {
    // Hキーでコントローラを隠す
    if (b_param_gui === true) {
      WEB3D.gui.add(this, "id", 0, 100);
    } else {
      WEB3D.gui.domElement.style.display = "none";
    }
    return this;
  }

  set_fog() {
    this.scene.fog = new THREE.FogExp2(0xffffff, 0.015);
    return this;
  }

  update() {
    let obj_list = this.scene.children;
    for (let i = 0; i < obj_list.length; i++) {
      if (obj_list[i].update !== undefined && obj_list[i] !== null) {
        obj_list[i].update();
      }
    }

    // 全てのオブジェクトに対して関数を実行するには以下の用にもできる
    // this.scene.traverse(function(obj){
    //   if(obj instanceof THREE.Mesh && obj != plane){
    //     obj.rotation.x += 0.01;
    //   }
    // }) 
  }

  static activate(w3) {
    w3.active = true;
    w3.init();
    let w3_list = WEB3D.list;
    for (let i = 0; i < w3_list.length; i++) {
      if (w3_list[i].id !== w3.id) {
        w3_list[i].active = false;
      }
    }
    WEB3D.active_w3 = WEB3D.get_active_w3();
  }

  static get_active_w3() {
    let w3_list = WEB3D.list;
    for (let i = 0; i < w3_list.length; i++) {
      if (w3_list[i].active === true) {
        return w3_list[i];
      }
    }
    return null;
  }

  static get_active_w3_by_id(id) {
    let w3_list = WEB3D.list;
    for (let i = 0; i < w3_list.length; i++) {
      if (w3_list[i].id === id) {
        return w3_list[i];
      }
    }
    return null;
  }

}


let w3_1 = new WEB3D("scene1");
let w3_2 = new WEB3D("scene2");

window.onload = function () {
  WEB3D.activate(w3_1);
}

window.addEventListener("resize", function () {
  WEB3D.active_w3.resize();
})

window.addEventListener("keypress", function (e) {
  WEB3D.activate(w3_2);
  w3_2.scene.fog = new THREE.FogExp2(0xff1234, 0.015);
})