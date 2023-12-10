// three.js r157 依存
import * as THREE from "../libs/three/build/three.module.js";
// カメラ移動関連
import { OrbitControls } from "../libs/three/jsm/controls/OrbitControls.js";
import { FirstPersonControls } from "../libs/three/jsm/controls/FirstPersonControls.js";
//OrbitControls.js内のimport先を'../../build/three.module.js'へ変更

//
import { HDRCubeTextureLoader } from "../libs/three/jsm/loaders/HDRCubeTextureLoader.js";
// import { FlakesTexture } from "../libs/three/jsm/textures/FlakesTexture.js";


// stats.js依存 https://github.com/mrdoob/stats.js
//debug
import Stats from "../libs/three/stats/stats.module.js";
import dat from "../libs/three/dat/dat.gui.module.js";

// 物理エンジンの設定
// Physijs.scripts.worker = "static/js/libs/three/physijs/physijs_worker.js";
// Physijs.scripts.ammo = "ammo.js";

export class WEB3D {
  static list = [];
  static cnt = 0;
  static renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  static active_w3 = null;
  static active_object = null;
  static b_param_gui = false;
  static b_stats = false;
  // static audio_context = new AudioContext();

  //スタティックイニシャライザ
  static {
    this.view = document.getElementById("view"); //$("#view");
    this.view.appendChild(WEB3D.renderer.domElement); //append(WEB3D.renderer.domElement);
    this.w = this.view.clientWidth;
    this.h = this.view.clientHeight;
    this.renderer.setClearColor(new THREE.Color("0xEEEEEE"));
    this.renderer.setSize(this.w, this.h);
    // this.renderer.shadowMapEnabled = true;     //three old
    this.renderer.shadowMap.enabled = true; //three new
    this.gui = new dat.GUI();
    this.stats = new Stats();
    this.view.appendChild(this.stats.domElement); //append(this.stats.domElement);
    //2d text
    this.text_canvas = document.createElement("canvas");
    this.text_canvas.id = "text_canvas";
    this.text_canvas.style.position = "fixed";
    this.text_canvas.style.top = "0";
    this.text_canvas.style.zIndex = "10000";
    this.text_canvas.style.display = "none";
    this.view.appendChild(this.text_canvas);
    this.set_canvas_text("test");
    //menu text
    this.menu_canvas = document.createElement("canvas");
    this.menu_canvas.id = "menu_canvas";
    this.menu_canvas.style.display = "none";
    this.view.appendChild(this.menu_canvas);

    //object mouse select event
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    console.warn("web3d static initializer is called.")
  }

  constructor(name) {
    let self = this;
    this.id = WEB3D.cnt;
    this.active = false;
    if (name === undefined) {
      this.name = name;
    } else {
      this.name = "";
    }
    this.clock = new THREE.Clock();
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, WEB3D.w / WEB3D.h, 0.1, 1000);
    this.camera.lookAt(this.scene.position);
    this.axes = new THREE.AxesHelper(20); //three new
    // this.axes = new THREE.AxisHelper(20); //three old
    this.audio_loaders = [];
    this.audio_listener = new THREE.AudioListener();

    //r157時点で一人称カメラになるとエラーとなってしまうのでAudioListenerをオーバーライドして，エラーを回避
    //Audioクラスも多分エラーになる
    this.camera.add(this.audio_listener);

    this.scene.add(this.axes);

    this.set_stats(WEB3D.b_stats);
    this.set_param_gui(WEB3D.b_param_gui);
    this.set_mouse_collider(function () { console.warn(WEB3D.active_object); });

    WEB3D.list.push(this);
    WEB3D.cnt++;

    console.warn("constructor is called.");

  }

  // TODO: text videoの描写関数

  init() {
    // this.set_camera(-1, 1, 0);
    this.set_camera(-30, 40, 30);
    this.set_plane();
    this.set_cube();
    this.set_sphere();
    this.set_fog();
    this.set_spot_light();
    this.set_mouse_controls();

    this.draw();
    return this;
  }

  draw() {
    let self = this;
    if (this.active === true) {
      if (WEB3D.stats !== null) { WEB3D.stats.update(); }
      requestAnimationFrame(function () { self.draw() });
      // object update
      this.update();
      // mouse collider update
      this.update_mouse_collider();
      // controls update
      if (this.controls.update !== undefined) {
        this.controls.update(this.clock.getDelta());
      }
      // rendering
      WEB3D.renderer.render(this.scene, this.camera);
    }
    return this;
  }

  resize() {
    this.w = WEB3D.view.clientWidth;  //.width();
    this.h = WEB3D.view.clientHeight; //.height();
    this.camera.aspect = this.w / this.h;
    this.camera.updateProjectionMatrix();
    WEB3D.renderer.setSize(this.w, this.h);
    if (this.controls !== undefined && this.controls.handleResize !== undefined) { this.controls.handleResize(); }
    return this;
  }

  set_camera(x, y, z) {
    this.camera.position.x = x;
    this.camera.position.y = y;
    this.camera.position.z = z;

    return this;
  }

  //set_audio_loaderでthree_objを登録し，three_obj.sound()を定義する
  set_audio_loader(three_obj, sound_path) {
    let audio_loader = new THREE.AudioLoader();
    audio_loader.sound_path = sound_path;
    audio_loader.sound_id = this.audio_loaders.length;

    //audio要素を追加
    // const audio_dom_id = "audio" + audio_loader.sound_id;
    // let audio_dom = document.createElement(audio_dom_id);
    // audio_dom.style.display = "none";
    // audio_dom.id = audio_dom_id;
    // let source_dom = document.createElement("source");
    // source_dom.src = audio_loader.sound_path;
    // source_dom.type = "audio/mpeg";
    // //audio要素内にsourceを追加
    // audio_dom.appendChild(source_dom);
    // //audio要素をviewに追加
    // WEB3D.view.appendChild(audio_dom);
    // audio_loader.sound_dom = audio_dom;

    let self = this;
    audio_loader.load(sound_path, function (buffer) {
      const audio = new THREE.PositionalAudio(self.audio_listener);
      // audio.setMediaElementSource(audio_dom);
      // audio.setRefDistance(10);
      audio.setBuffer(buffer);
      audio.setLoop(true);
      three_obj.add(audio);
    });
    this.audio_loaders.push(audio_loader);
    return this;
  }

  //シーンの背景を設定する
  /** 
    HDRファイルを背景に設定します。
    https://anyconv.com/ja/jpeg-to-hdr-konbata/#google_vignette
  */
  set_background(folder_path, hdr_file_name_list) {
    const self = this;
    new HDRCubeTextureLoader()
      .setPath(folder_path)
      .load(
        hdr_file_name_list,
        function (texture) {
          self.scene.background = texture;
          self.scene.environment = texture;
        }
      );
    return this;
  }

  set_menu() {
    let self = this;
    let menuGeometry = new THREE.PlaneGeometry(WEB3D.view.innerWidth, WEB3D.view.innerHeight);
    let menuMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, name: "menu", opacity: 0.5, transparent: true, alphaToCoverage: true })
    let menu = new THREE.Mesh(menuGeometry, menuMaterial);
    WEB3D.set_canvas_menu("canvas menu");
    menuMaterial.map = new THREE.Texture(WEB3D.menu_canvas);
    menu.name = "menu";
    menu.update = function () {
      menu.material.map.needsUpdate = true;
      menu.rotation.x += 1;//Math.PI * 1.5;
      menu.position.x = self.camera.position.x - 1;
      menu.position.y = self.camera.position.y;
      menu.position.z = self.camera.position.z - 1;
    }
    let display = true;
    WEB3D.view.addEventListener("contextmenu", function () {
      if (display === true) {
        display = false;
      } else {
        display = true;
      }
      if (display === true) {

      }
    })

    this.scene.add(menu);
  }

  set_plane(px = 15, py = 0, pz = 0, rx = 0, ry = 0, rz = 0, w = 60, h = 20, color = 0xffffff) {
    let planeGeometry = new THREE.PlaneGeometry(w, h);
    // let planeMaterial = new THREE.MeshBasicMaterial({ color: 0xcccccc });
    // let planeMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc });
    // let planeMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff, opacity: 1.0, transparent: true, alphaToCoverage: true });
    let planeMaterial = new THREE.MeshBasicMaterial({ color: color, opacity: 1.0, transparent: true, alphaToCoverage: true });

    let plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.receiveShadow = true;

    plane.name = "plane";

    // plane.rotation.x = -0.5 * Math.PI;
    plane.rotation.x = rx * Math.PI;
    plane.rotation.y = ry * Math.PI;
    plane.rotation.z = rz * Math.PI;

    plane.position.x = px;
    plane.position.y = py;
    plane.position.z = pz;

    this.scene.add(plane);

    return plane;
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
    cube.position.z = 10;

    cube.update = function () {
      cube.rotation.x += 0.02;
      cube.rotation.y += 0.02;
      cube.rotation.z += 0.02;

      cube.position.z -= 0.1;
      if (cube.position.z < -10) {
        cube.position.z = 10;
      }
    }

    cube.sound_play = false;

    // this.set_audio_loader(cube, "static/sound/sample_bgm.mp3")
    cube.sound = function () {
      if (cube.position.z < 0.1 && cube.position.z >= 0.0) {
        if (cube.sound_play === false) {
          console.warn("cube sound start");
          cube.children[0].play();
        }
        cube.sound_play = true;
      }
    }

    // cube.texts = [
    //   "sample_bgm.mp3を流してます。",
    //   "気に入りましたか？",
    //   "歩き回ってみましょう。",
    // ]

    this.scene.add(cube);

    return cube;
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

  set_mouse_controls() {
    //マウス操作を有効化
    // this.controls = new OrbitControls(this.camera, WEB3D.renderer.domElement);
    this.controls = new FirstPersonControls(this.camera, WEB3D.renderer.domElement);
    this.controls.movementSpeed = 20;
    this.controls.lookSpeed = 0.05;
    this.controls.noFly = true;
    this.controls.lookVertical = true;
    this.controls.constrainVertical = true;
    this.controls.lon = -150;
    this.controls.lat = 120;
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
    if (this.active === true) {
      for (let i = 0; i < obj_list.length; i++) {
        // 各THREEオブジェクトがupdate関数を定義していたら実行
        if (obj_list[i].update !== undefined && obj_list[i] !== null) {
          obj_list[i].update();
        }
        if (obj_list[i].sound !== undefined && obj_list[i] !== null) {
          // WEB3D.audio_context.resume().then(() => {
          //   try {
          //     obj_list[i].sound();
          //   } catch {
          //     console.warn(`${obj_list[i].name} is not ready.`);
          //   }
          // })
          try {
            obj_list[i].sound();
          } catch {
            console.warn(`${obj_list[i].name} is not ready.`);
          }
        }
        if (obj_list[i].load !== undefined && obj_list[i] !== null) {
          obj_list[i].load();
        }
      }

      // 全てのオブジェクトに対して関数を実行するには以下の用にもできる
      // this.scene.traverse(function(obj){
      //   if(obj instanceof THREE.Mesh && obj != plane){
      //     obj.rotation.x += 0.01;
      //   }
      // }) 


    }
  }

  set_load(three_obj, func) {
    three_obj.load = func;
    return three_obj;
  }

  set_update(three_obj, func) {
    three_obj.update = func;
    return three_obj;
  }

  set_mouse_collider(func1, func2) {
    WEB3D.view.addEventListener("pointermove", function (e) {
      WEB3D.pointer.x = e.offsetX / WEB3D.view.clientWidth * 2 - 1;
      WEB3D.pointer.y = -e.offsetY / WEB3D.view.clientHeight * 2 + 1;
      // console.warn(WEB3D.pointer.x, WEB3D.pointer.y);
      //選択解除
      if (window.getSelection) {
        window.getSelection().removeAllRanges();
      }
    });

    WEB3D.view.addEventListener("mouseup", function (e) {
      //e.button 1:左, 2:中央, 3:右
      //e.key
      if (e.button == 0 && func1 !== undefined) {
        func1(e);
      } else if (e.button == 2 && func2 !== undefined) {
        func2(e);
      }
    });

    return this;
  }

  update_mouse_collider() {
    // mouse collider
    WEB3D.raycaster.setFromCamera(WEB3D.pointer, this.camera);
    const intersects = WEB3D.raycaster.intersectObjects(this.scene.children);
    if (intersects.length === 0) {
      WEB3D.active_object = null;
    } else {
      for (let i = 0; i < intersects.length; i++) {
        // マウスカーソルが当たるとマテリアルが赤になる
        // intersects[i].object.material.color.set(0xff0000);
        WEB3D.active_object = intersects[i].object;
        break;
      }
    }
  }

  // set_collider(three_obj) {
  //   three_obj.collider = true;
  //   return three_obj;
  // }

  // set_controller(three_obj) {
  //   return three_obj;
  // }

  reset() {
    //通常のTHREEオブジェクトを全て破棄
    const object_count = this.scene.children.length;
    for (let i = 1; i <= object_count; i++) {
      this.scene.remove(this.scene.children[object_count - i])
    }
    console.warn(this.scene.children);
  }

  async pick_imgs() {
    const img_list = await window.showOpenFilePicker();
    let fd = new FormData();
    for (let i = 0; i < img_list.length; i++) {
      const img = await img_list[i].getFile();
      fd.append("img" + i, img);
      console.log(img_list[i], img);
    }
    // let fd = new FormData();//($("#my_form").get(0));
    //console.log($("#my_form")[0].files[0]);
    //$("#my_form")[0].files[0] = img_file;
    // fd.append("img", img_file);
    // this.xhr.open("POST","imgs/"+this.user_id); //<-【TODO】ここはURLに依存するため動的に変更できるようにしておくべき
    //this.xhr.setRequestHeader("Content-Type","multipart/form-data;image/png");
    //this.xhr.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
    // this.xhr.send(fd);
    //let imgNode = document.createElement("img");
    //	imgNode.setAttribute("src","");
    //range.deleteContents();
    //range.insertNode(imgNode);
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

  static get_w3_by_name(name) {
    let w3_list = WEB3D.list;
    for (let i = 0; i < w3_list.length; i++) {
      if (w3_list[i].name === name) {
        return w3_list[i];
      }
    }
    return null;
  }

  static set_canvas_text(text = "", x = 10, y = 48) {
    let ctx = WEB3D.text_canvas.getContext("2d");
    ctx.font = "48px serif";
    // ctx.fillStyle = "#ffffff";
    ctx.fillText(text, x, y);
  }

  static set_canvas_menu(text = "", x = 10, y = 48) {
    let ctx = WEB3D.menu_canvas.getContext("2d");
    ctx.font = "48px seif";
    ctx.fillStyle = "#ff0000";
    ctx.fillText(text, x, y);
  }

}

// Phyji.js物理エンジン
// class WEB3DPhysijs extends WEB3D {
//   constructor(name) {
//     super(name);
//     this.scene = new Physijs.Scene();
//     this.scene.setGravity(new THREE.Vector3(0, -10, 0));
//     this.set_stone();
//   }

//   set_stone() {
//     let stoneGeom = new THREE.BoxGeometry(0.6, 6, 2);
//     let stone = new Physijs.BoxMesh(stoneGeom, new THREE.MeshPhongMaterial({ color: 0xff0000 }));
//     this.scene.add(stone);
//     return this;
//   }

//   draw() {
//     super.draw();
//     if (this.active === true) {
//       this.scene.simulate();
//     }
//   }
// }

// ■現状メンテされている有効なライブラリ
// Ammo.js物理エンジン
import { ConvexObjectBreaker } from '../libs/three/jsm/misc/ConvexObjectBreaker.js';
import { ConvexGeometry } from '../libs/three/jsm/geometries/ConvexGeometry.js';
// import { Ammo } from '../libs/three/jsm/libs/ammo.wasm.js';

export class WEB3DAmmo extends WEB3D {
  static {
    console.warn("web3d_ammo static initializer is called.");
  }
  constructor(name) {
    super(name)
    this.texture_loader;
    this.mouseCoords = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.ballMaterial = new THREE.MeshPhongMaterial({ color: 0x202020 });
    this.set_physics_variables();
    // this.main();
  }

  set_physics_variables() {
    this.gravity_constant = 7.8;
    this.collision_configuration = null;
    this.dispatcher = null;
    this.broadphase = null;
    this.solver = null;
    this.physics_world = null;
    this.margin = 0.05;
    this.convexBreaker = new ConvexObjectBreaker();
    this.rigid_bodyies = [];
    this.pos = new THREE.Vector3();
    this.quat = new THREE.Quaternion();
    this.transform_aux1 = null;
    this.tempBtVec3_1 = null;
    this.objects_to_remove = [];
    for (let i = 0; i < 500; i++) {
      this.objects_to_remove[i] = null;
    }
    this.num_objects_to_remove = 0;
    this.impact_point = new THREE.Vector3();
    this.impact_normal = new THREE.Vector3();
    this.texture_loader = null;
  }

  update() {
    super.update();
    if (this.active === true) {
      let delta_time = this.clock.getDelta();
      this.update_physics(delta_time);
    }
  }

  reset() {
    super.reset();
    if (typeof (Ammo) !== "function") {
      // const remove_object_count = this.objects_to_remove.length;
      // for (let i = 1; i < remove_object_count; i++) {
      //   this.remove_debris(this.objects_to_remove[remove_object_count - i]);
      // }
      Ammo.destroy(this.physics_world);
      console.warn("destroy physic_world");
      Ammo.destroy(this.solver);
      console.warn("destroy solver");
      Ammo.destroy(this.collision_configuration);
      console.warn("destroy collision_configuration");
      Ammo.destroy(this.dispatcher);
      console.warn("destroy dispatcher");
      Ammo.destroy(this.broadphase);
      console.warn("destroy");
    }
  }

  init() {
    let self = this;
    if (typeof (Ammo) === "function") {
      Ammo().then(function (AmmoLib) {
        Ammo = AmmoLib;
        console.warn("Ammo jx is loaded : ", Ammo);
        // self.init_graphics();
        // self.init_physics();
        // self.create_objects();
        // self.init_input();
        // self.draw();
        self.init_objects();
      });
    } else {
      this.init_objects();
    }
  }

  init_objects() {
    this.init_graphics();
    this.init_physics();
    this.create_objects();
    this.init_input();
    this.set_menu();
    this.draw();
  }

  set_mouse_controls() {
    //マウス操作を有効化
    this.controls = new OrbitControls(this.camera, WEB3D.renderer.domElement);
    return this;
  }

  init_graphics() {
    //scene
    this.scene.background = new THREE.Color(0xbfd1e5);
    //camera
    this.set_camera(-14, 8, 16);
    //renderer
    WEB3DAmmo.renderer.setPixelRatio(window.devicePixelRatio);
    WEB3DAmmo.renderer.useLegacyLights = false;
    WEB3DAmmo.renderer.shadowMap.enabled = true;
    //controls
    this.set_mouse_controls();
    if (this.controls.target !== undefined) {
      this.controls.target.set(0, 2, 0);
    }
    this.controls.update(this.clock.getDelta());
    //texture
    this.texture_loader = new THREE.TextureLoader();

    //ambient light
    this.ambient_light = new THREE.AmbientLight(0xbbbbbb);
    this.scene.add(this.ambient_light);

    // light
    this.light = new THREE.DirectionalLight(0xffffff, 3);
    this.light.position.set(-10, 18, 5);
    this.light.castShadow = true;
    const d = 14;
    this.light.shadow.camera.left = -d;
    this.light.shadow.camera.right = d;
    this.light.shadow.camera.top = d;
    this.light.shadow.camera.bottom = -d;
    this.light.shadow.camera.near = 2;
    this.light.shadow.camera.far = 50;
    this.light.shadow.mapSize.x = 1024;
    this.light.shadow.mapSize.y = 1024;
    this.scene.add(this.light);

    return this;
  }

  init_physics() {
    this.collision_configuration = new Ammo.btDefaultCollisionConfiguration();
    this.dispatcher = new Ammo.btCollisionDispatcher(this.collision_configuration);
    this.broadphase = new Ammo.btDbvtBroadphase();
    this.solver = new Ammo.btSequentialImpulseConstraintSolver();
    this.physics_world = new Ammo.btDiscreteDynamicsWorld(this.dispatcher, this.broadphase, this.solver, this.collision_configuration);
    this.physics_world.setGravity(new Ammo.btVector3(0, - this.gravity_constant, 0));
    this.transform_aux1 = new Ammo.btTransform();
    this.tempBtVec3_1 = new Ammo.btVector3(0, 0, 0);
    return this;
  }

  create_object(mass, halfExtents, pos, quat, material) {
    // let cubeGeometry = new THREE.BoxGeometry(4, 4, 4);
    // let cubeMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
    // let cubeMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000, wireframe: true });
    // let cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    const object = new THREE.Mesh(new THREE.BoxGeometry(halfExtents.x * 2, halfExtents.y * 2, halfExtents.z * 2), material);
    object.position.copy(pos);
    object.quaternion.copy(quat);
    this.convexBreaker.prepareBreakableObject(object, mass, new THREE.Vector3(), new THREE.Vector3(), true);
    this.create_debris_from_breakable_object(object);
    return object;
  }

  create_objects() {
    this.pos.set(0, -0.5, 0);
    this.quat.set(0, 0, 0, 1);
    const ground = this.create_paralellepipe_with_physics(40, 5, 40, 0, this.pos, this.quat, new THREE.MeshPhongMaterial({ color: 0xFFFFFF }));
    ground.receiveShadow = true;
    this.texture_loader.load(
      'static/img/textures/grid.png',
      function (texture) {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(40, 40);
        ground.material.map = texture;
        ground.material.needsUpdate = true;
      });
    ground.name = "ground";

    // Tower 1
    const towerMass = 1000;
    const towerHalfExtents = new THREE.Vector3(2, 5, 2);
    this.pos.set(-8, 5, 0);
    this.quat.set(0, 0, 0, 1);
    const tower_1 = this.create_object(towerMass, towerHalfExtents, this.pos, this.quat, this.create_material(0xB03014));
    tower_1.name = "tower_1";
    tower_1.texts = [
      "タワー１です。",
      "ボールの衝突で壊れます。",
    ]
    console.warn("tower 1", tower_1);

    // Tower 2
    this.pos.set(8, 5, 0);
    this.quat.set(0, 0, 0, 1);
    const tower_2 = this.create_object(towerMass, towerHalfExtents, this.pos, this.quat, this.create_material(0xB03014));
    tower_2.name = "tower_2";
    console.warn("tower 2");

    // Bridge
    const bridgeMass = 100;
    const bridgeHalfExtents = new THREE.Vector3(7, 0.2, 1.5);
    this.pos.set(0, 10.2, 0);
    this.quat.set(0, 0, 0, 1);
    this.create_object(bridgeMass, bridgeHalfExtents, this.pos, this.quat, this.create_material(0xB3B865));
    console.warn("bridge");

    // Stones
    const stoneMass = 120;
    const stoneHalfExtents = new THREE.Vector3(1, 2, 0.15);
    const numStones = 8;
    this.quat.set(0, 0, 0, 1);
    for (let i = 0; i < numStones; i++) {
      this.pos.set(0, 2, 15 * (0.5 - i / (numStones + 1)));
      this.create_object(stoneMass, stoneHalfExtents, this.pos, this.quat, this.create_material(0xB0B0B0));
    }
    console.warn("stones");

    // Mountain
    const mountainMass = 860;
    const mountainHalfExtents = new THREE.Vector3(4, 5, 4);
    this.pos.set(5, mountainHalfExtents.y * 0.5, -7);
    this.quat.set(0, 0, 0, 1);
    const mountainPoints = [];
    mountainPoints.push(new THREE.Vector3(mountainHalfExtents.x, - mountainHalfExtents.y, mountainHalfExtents.z));
    mountainPoints.push(new THREE.Vector3(- mountainHalfExtents.x, - mountainHalfExtents.y, mountainHalfExtents.z));
    mountainPoints.push(new THREE.Vector3(mountainHalfExtents.x, - mountainHalfExtents.y, - mountainHalfExtents.z));
    mountainPoints.push(new THREE.Vector3(- mountainHalfExtents.x, - mountainHalfExtents.y, - mountainHalfExtents.z));
    mountainPoints.push(new THREE.Vector3(0, mountainHalfExtents.y, 0));

    const mountain = new THREE.Mesh(new ConvexGeometry(mountainPoints), this.create_material(0xB03814));
    mountain.position.copy(this.pos);
    mountain.position.copy(this.quat);
    this.convexBreaker.prepareBreakableObject(mountain, mountainMass, new THREE.Vector3(), new THREE.Vector3(), true);
    this.create_debris_from_breakable_object(mountain);
    console.warn("mountain");
  }

  create_paralellepipe_with_physics(sx, sy, sz, mass, pos, quat, material) {
    const object = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz, 1, 1, 1), material);
    const shape = new Ammo.btBoxShape(new Ammo.btVector3(sx * 0.5, sy * 0.5, sz * 0.5));
    shape.setMargin(this.margin);

    this.create_rigid_body(object, shape, mass, pos, quat);

    return object;
  }

  create_sphere_object(r, w, h, mass, pos, quat, material) {
    const sp_obj = new THREE.Mesh(new THREE.SphereGeometry(r, w, h), material)
    const sp_shp = new Ammo.btSphereShape(r);
    sp_shp.setMargin(this.margin);
    const sp_body = this.create_rigid_body(sp_obj, sp_shp, mass, pos, quat);

    // pos.multiplyScalar(24);
    // sp_body.setLinearVelocity(new Ammo.btVector3(pos.x, pos.y, pos.z));
    return sp_obj;
  }

  create_debris_from_breakable_object(object) {
    object.castShadow = true;
    object.receiveShadow = true;

    const shape = this.create_convex_hull_physics_shape(object.geometry.attributes.position.array);
    shape.setMargin(this.margin);

    const body = this.create_rigid_body(object, shape, object.userData.mass, null, null, object.userData.velocity, object.userData.angularVelocity);

    const btVecUserData = new Ammo.btVector3(0, 0, 0);
    btVecUserData.threeObject = object;
    body.setUserPointer(btVecUserData);

  }

  remove_debris(object) {
    this.scene.remove(object);
    this.physics_world.removeRigidBody(object.userData.physicsBody);
  }

  create_convex_hull_physics_shape(coords) {
    const shape = new Ammo.btConvexHullShape();
    for (let i = 0, il = coords.length; i < il; i += 3) {
      this.tempBtVec3_1.setValue(coords[i], coords[i + 1], coords[i + 2]);
      const lastOne = (i >= (il - 3));
      shape.addPoint(this.tempBtVec3_1, lastOne);

    }
    return shape;
  }

  create_rigid_body(object, physicsShape, mass, pos, quat, vel, angVel) {
    if (pos) {
      object.position.copy(pos);
    } else {
      pos = object.position;
    }

    if (quat) {
      object.quaternion.copy(quat);
    } else {
      quat = object.quaternion;
    }

    const transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
    const motionState = new Ammo.btDefaultMotionState(transform);

    const localInertia = new Ammo.btVector3(0, 0, 0);
    physicsShape.calculateLocalInertia(mass, localInertia);

    const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, physicsShape, localInertia);
    const body = new Ammo.btRigidBody(rbInfo);

    body.setFriction(0.5);

    if (vel) {
      body.setLinearVelocity(new Ammo.btVector3(vel.x, vel.y, vel.z));
    }

    if (angVel) {
      body.setAngularVelocity(new Ammo.btVector3(angVel.x, angVel.y, angVel.z));
    }

    object.userData.physicsBody = body;
    object.userData.collided = false;
    this.scene.add(object);

    if (mass > 0) {
      this.rigid_bodyies.push(object);
      // Disable deactivation
      body.setActivationState(4);
    }

    this.physics_world.addRigidBody(body);
    return body;
  }

  create_random_color() {
    return Math.floor(Math.random() * (1 << 24));
  }

  create_material(color) {
    color = color || this.create_random_color();
    return new THREE.MeshPhongMaterial({ color: color, opacity: 0.5 });
    // return new THREE.MeshLambertMaterial({ color: color, wireframe: true });
  }

  init_input() {
    let self = this;
    window.addEventListener("pointerdown", function (event) {
      self.mouseCoords.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
      );
      self.raycaster.setFromCamera(self.mouseCoords, self.camera);

      const ballMass = 35;
      const ballRadius = 0.4;
      const ball = new THREE.Mesh(new THREE.SphereGeometry(ballRadius, 14, 10), self.ballMaterial);
      ball.castShadow = true;
      ball.receiveShadow = true;
      const ballShape = new Ammo.btSphereShape(ballRadius);
      ballShape.setMargin(self.margin);
      self.pos.copy(self.raycaster.ray.direction);
      self.pos.add(self.raycaster.ray.origin);
      self.quat.set(0, 0, 0, 1);
      const ballBody = self.create_rigid_body(ball, ballShape, ballMass, self.pos, self.quat);

      self.pos.copy(self.raycaster.ray.direction);
      self.pos.multiplyScalar(24);
      ballBody.setLinearVelocity(new Ammo.btVector3(self.pos.x, self.pos.y, self.pos.z));
    });
  }

  update_physics(delta_time) {
    this.physics_world.stepSimulation(delta_time, 10);
    for (let i = 0, il = this.rigid_bodyies.length; i < il; i++) {
      const objThree = this.rigid_bodyies[i];
      const objPhys = objThree.userData.physicsBody;
      const ms = objPhys.getMotionState();

      if (ms) {
        ms.getWorldTransform(this.transform_aux1);
        const p = this.transform_aux1.getOrigin();
        const q = this.transform_aux1.getRotation();
        objThree.position.set(p.x(), p.y(), p.z());
        objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
        objThree.userData.collided = false;
      }
    }

    for (let i = 0, il = this.dispatcher.getNumManifolds(); i < il; i++) {
      const contactManifold = this.dispatcher.getManifoldByIndexInternal(i);
      const rb0 = Ammo.castObject(contactManifold.getBody0(), Ammo.btRigidBody);
      const rb1 = Ammo.castObject(contactManifold.getBody1(), Ammo.btRigidBody);

      const threeObject0 = Ammo.castObject(rb0.getUserPointer(), Ammo.btVector3).threeObject;
      const threeObject1 = Ammo.castObject(rb1.getUserPointer(), Ammo.btVector3).threeObject;

      if (!threeObject0 && !threeObject1) {
        continue;
      }

      const userData0 = threeObject0 ? threeObject0.userData : null;
      const userData1 = threeObject1 ? threeObject1.userData : null;

      const breakable0 = userData0 ? userData0.breakable : false;
      const breakable1 = userData1 ? userData1.breakable : false;

      const collided0 = userData0 ? userData0.collided : false;
      const collided1 = userData1 ? userData1.collided : false;

      if ((!breakable0 && !breakable1) || (collided0 && collided1)) {
        continue;
      }

      let contact = false;
      let maxImpulse = 0;
      for (let j = 0, jl = contactManifold.getNumContacts(); j < jl; j++) {

        const contactPoint = contactManifold.getContactPoint(j);
        if (contactPoint.getDistance() < 0) {

          contact = true;
          const impulse = contactPoint.getAppliedImpulse();

          if (impulse > maxImpulse) {

            maxImpulse = impulse;
            const pos = contactPoint.get_m_positionWorldOnB();
            const normal = contactPoint.get_m_normalWorldOnB();
            this.impact_point.set(pos.x(), pos.y(), pos.z());
            this.impact_normal.set(normal.x(), normal.y(), normal.z());

          }
          break;
        }
      }

      if (!contact) continue;

      const fractureImpulse = 250;
      if (breakable0 && !collided0 && maxImpulse > fractureImpulse) {

        const debris = this.convexBreaker.subdivideByImpact(threeObject0, this.impact_point, this.impact_normal, 1, 2, 1.5);
        const numObjects = debris.length;
        for (let j = 0; j < numObjects; j++) {

          const vel = rb0.getLinearVelocity();
          const angVel = rb0.getAngularVelocity();
          const fragment = debris[j];
          fragment.userData.velocity.set(vel.x(), vel.y(), vel.z());
          fragment.userData.angularVelocity.set(angVel.x(), angVel.y(), angVel.z());

          this.create_debris_from_breakable_object(fragment);
        }

        this.objects_to_remove[this.num_objects_to_remove++] = threeObject0;
        userData0.collided = true;
      }

      if (breakable1 && !collided1 && maxImpulse > fractureImpulse) {

        const debris = this.convexBreaker.subdivideByImpact(threeObject1, this.impact_point, this.impact_normal, 1, 2, 1.5);

        const numObjects = debris.length;
        for (let j = 0; j < numObjects; j++) {

          const vel = rb1.getLinearVelocity();
          const angVel = rb1.getAngularVelocity();
          const fragment = debris[j];
          fragment.userData.velocity.set(vel.x(), vel.y(), vel.z());
          fragment.userData.angularVelocity.set(angVel.x(), angVel.y(), angVel.z());

          this.create_debris_from_breakable_object(fragment);
        }

        this.objects_to_remove[this.num_objects_to_remove++] = threeObject1;
        userData1.collided = true;
      }
    }
    for (let i = 0; i < this.num_objects_to_remove; i++) {
      this.remove_debris(this.objects_to_remove[i]);
    }
    this.num_objects_to_remove = 0;
  }

  //TODO:Ammoシーンの取り消し（リセット方法）

}

// let w3_1 = new WEB3D("scene1");
// let w3_2 = new WEB3DAmmo("scene2");

// window.onload = function () {
//   let start = false;
//   document.getElementById("view").addEventListener("click", function () {
//     if (start === false) {
//       WEB3D.activate(w3_1);
//       WEB3D.active_w3.resize();
//       start = true;
//     }
//   });
// }

// window.addEventListener("resize", function () {
//   if (WEB3D.active_w3 !== null) {
//     WEB3D.active_w3.resize();
//   }
// })

// window.addEventListener("keypress", function (e) {
//   if (e.key === "1") {
//     WEB3D.activate(w3_1);
//     // w3_2.scene.fog = new THREE.FogExp2(0xff1234, 0.015);
//   } else if (e.key === "2") {
//     WEB3D.activate(w3_2);
//   } else if (e.key === "d") {
//     console.warn(WEB3D.active_object);
//     // console.warn(w3_1.scene.children);
//     // console.warn(w3_2.objects_to_remove);
//     // console.warn(w3_2.scene.children[15].position.set(0, 0, 0));
//   } else if (e.key === "r") {
//     w3_2.reset();
//   }
// })