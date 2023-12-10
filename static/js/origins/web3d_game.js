import { WEB3D, WEB3DAmmo } from "./web3d.js";

import * as THREE from "../libs/three/build/three.module.js";
import { FirstPersonControls } from "../libs/three/jsm/controls/FirstPersonControls.js";


// TODO 別プレイヤーの表示

// 2D:canvasを使ったテキストの表示方法

// Meshのルール
// .name = オブジェクトの名前
// .group = オブジェクトのグループ
// .texts = []; //説明のテキスト配列
// .update = function(); //更新関数
// .collide = function(obj) //衝突関数
// .sound = function(){children[0].play()} // サウンド起動関数

// .userData.physicsBody = Ammo Object //物理演算が適用されたAmmoオブジェクト

class WEB3DGame extends WEB3DAmmo {
  static {
    this.start = false;
    this.end = false;
  }

  constructor(name) {
    super(name);
    let self = this;

    //コントロールユーザ
    this.username = username;
    this.user_id = user_id;

    //準備完了
    this.ready = false;

    //fps
    this.fps = 24;

    //アクティブなトーク
    this.active_talk = null;
    this.active_talk_id = 0;

    //プレイヤーオブジェクト
    this.player = null;
    this.players = [];

    //処理演算用の変数
    this.ammoTmpVel = null; // ammo.js内のベクトル保持用
    this.ammoTmpRot = null; // ammo.js内の角度保持用
    this.tmpVel = new THREE.Vector3();
    this.tmpQuat = new THREE.Quaternion();

    this.reset_time = 0;

    //imgs
    this.imgs = [];
    this.img_id = 1;

    //JSON
    this.load_json = new LoadJSON("/json/object_info");
    this.load_json.get();

    //マウスカーソル接触イベント(クリック時)
    this.set_mouse_collider(
      //左クリック
      function (e) {
        // if (WEB3D.active_object !== null && WEB3D.active_object.name !== undefined) {
        //   // console.warn(WEB3D.active_object.name,e.button);
        //   // self.set_text(WEB3D.active_object.name);
        // } else {
        //   self.set_text("");
        // }
        self.talk();
      },
      //右クリック
      function (e) {
        try {
          //debug
          if (mode === "debug" && WEB3D.active_object !== null && WEB3D.active_object.name !== undefined) {
            console.warn(self.get_properties(WEB3D.active_object.name));
          }
        } catch (e) {
          console.error(e);
        }
      }
    );

    //キー入力イベント
    window.addEventListener("keydown", function (e) {
      if (e.key === " " || e.key === "Space") {
        self.talk();
      }
      //debug
      if (mode === "debug") {
        if (e.key === "x") {
          self.check_collide();
        } else if (e.key === "z") {
          console.warn(self.scene.children);
        }
      }

    });
  }

  init() {
    super.init();
    this.send_player_info();
    this.ready = true;
  }

  init_objects() {
    // super.init_objects();
    this.init_graphics();
    this.init_physics();
    this.create_objects();
    this.init_input();
    this.set_background("static/img/textures/pisaHDR/", ['px.hdr', 'nx.hdr', 'py.hdr', 'ny.hdr', 'pz.hdr', 'nz.hdr']);
    // this.set_background("static/img/textures/pisaHDR/", ['okinawa1.hdr', 'okinawa1.hdr', 'okinawa1.hdr', 'okinawa2.hdr', 'okinawa3.hdr', 'okinawa4.hdr']);
    this.set_player();
    // this.set_cube();
    // this.set_imgs();
    // this.set_properties();
    this.set_objects();
    this.set_menu();
    this.draw();
  }

  set_mouse_controls() {
    //マウス操作を有効化
    this.controls = new FirstPersonControls(this.camera, WEB3D.renderer.domElement);
    this.controls.movementSpeed = 50;
    this.controls.lookSpeed = 2.0;
    this.controls.noFly = true;
    this.controls.lookVertical = true;//false;
    this.controls.constrainVertical = true;
    this.controls.lon = -150;
    this.controls.lat = 120;

    //一人称視点にするとエラーになる
    // Uncaught TypeError: Failed to execute 'linearRampToValueAtTime' on 'AudioParam': The provided float value is non-finite.
    // at AudioListener.updateMatrixWorld (three.module.js:45509:23)
    // at PerspectiveCamera.updateMatrixWorld (three.module.js:7699:11)
    // at PerspectiveCamera.updateMatrixWorld (three.module.js:12329:9)
    // at WebGLRenderer.render (three.module.js:28928:80)
    // at WEB3DGame.draw (scene_load.js:108:22)
    // at WEB3DGame.draw (common.js:301:11)
    // at scene_load.js:98:48

    // this.controls = new OrbitControls(this.camera, WEB3D.renderer.domElement);
    // this.controls = new FlyControls(this.camera, WEB3D.renderer.domElement);
    return this;
  }

  set_imgs() {
    const img01 = this.set_img_plane("static/img/textures/album/okinawa01.JPG", 12, 8, 10, 0, 1.5, 0, 9, 4);

    // img01.update = function () {
    //   if (WEB3D.active_object !== null && WEB3D.active_object.name !== undefined && WEB3D.active_object.name === img01.name) {
    //     img01_frame.material.color.set(0xff0000);
    //   } else {

    //   }
    // }
    const img02 = this.set_img_plane("static/img/textures/album/okinawa02.JPG", 12, 8, 20, 0, 1.5, 0, 9, 4);

    // this.set_img_plane("", 0, 0, 0, 0, 0.5, 0, 6, 6);
    // this.set_img_plane(),

  }

  set_point_light(obj) {
    const p_light = new THREE.PointLight(0xff0000);
    p_light.position.set(obj.position.x - 2, obj.position.y + 1, obj.position.z);
    p_light.castShadow = true;
    this.scene.add(p_light);
    return p_light;
  }



  set_player() {
    // player
    const playerMass = 100;
    const playerHalfExtents = new THREE.Vector3(2, 3, 2);
    this.pos.set(10, 10, 10);
    this.quat.set(0, 0, 0, 1);
    //  (優先的に表示) depthTest: false,(背景も含め透明にする) alphaToCoverage: true
    // const player_mat = new THREE.MeshBasicMaterial({ color: 0xff0000, name: "player", opacity: 0.5, transparent: true, alphaToCoverage: true });
    let player_mat = new THREE.MeshPhongMaterial({ color: 0xff0000, name: "player", opacity: 0.5, transparent: true, alphaToCoverage: true });
    player_mat.map = new THREE.Texture(WEB3D.text_canvas);
    // const player = this.create_paralellepipe_with_physics(2, 2, 2, playerMass, this.pos, this.quat, player_mat);
    // const player = this.create_object(playerMass, playerHalfExtents, this.pos, this.quat, new THREE.MeshBasicMaterial({ color: 0xff0000, name: "player", opacity: 0.5, transparent: true, alphaToCoverage: true }))
    const player = this.create_sphere_object(1, 32, 16, playerMass, this.pos, this.quat, player_mat);
    player.userData.physicsBody.setFriction(0.1);
    player.name = "player";
    player.username = this.username;
    player.texts = [
      "プレイヤーです",
    ];
    player.hp = 100;
    this.set_camera(player.position.x, player.position.y, player.position.z);

    let self = this;
    this.ammoTmpVel = new Ammo.btVector3();
    this.ammoTmpRot = new Ammo.btVector3();

    player.update = function () {
      // self.camera.position.x = player.position.x + 5;
      self.camera.position.y = player.position.y + 5;
      // self.camera.position.z = player.position.z + 5;
      player.material.map.needsUpdate = true;
      //終了判定


    }

    player.collide = function (mesh) {
      console.warn(player.name + "が" + mesh.name + "と衝突しました");

    }

    player.move_direction = { left: 0, right: 0, forward: 0, back: 0, jump: 0, moveX: 0, moveY: 0, moveZ: 0 };

    window.addEventListener("keydown", function (e) {

      // if (e.key === "a") {
      //   // self.player.position.z += 4;
      //   // console.warn(self.player.position);
      //   self.player.move_direction.left = 0.2;

      // } else if (e.key === "d") {
      //   self.player.move_direction.right = 0.2;
      // }

      // if (e.key === "w") {
      //   self.player.move_direction.forward = 0.2;
      // } else if (e.key === "s") {
      //   self.player.move_direction.back = 0.2;
      // }

      if (e.key === "f") {
        self.player.move_direction.jump = 5;
      }

      // const scalingFactor = 10;
      // let moveX = self.player.move_direction.right - self.player.move_direction.left;
      // // let moveX = self.camera.position.x - self.camera_position.x;
      // let moveZ = self.player.move_direction.back - self.player.move_direction.forward;
      // // let moveZ = self.camera.position.z - self.camera_position.z;

      // let moveY = self.player.move_direction.jump;

      // let objPhys = self.player.userData.physicsBody;
      // objPhys.setAngularVelocity(self.ammoTmpRot);
      // // objPhys.getWorldQuaternion(self.tmpQuat);
      // self.tmpVel.set(moveX, moveY, moveZ);
      // self.tmpVel.applyQuaternion(self.tmpQuat);
      // self.ammoTmpVel.setValue(self.tmpVel.x, self.tmpVel.y, self.tmpVel.z);
      // self.ammoTmpVel.op_mul(scalingFactor);
      // objPhys.setLinearVelocity(self.ammoTmpVel);

      // const ms = objPhys.getMotionState();
      // if (ms) {
      //   ms.getWorldTransform(self.transform_aux1);
      //   const p = self.transform_aux1.getOrigin();
      //   const q = self.transform_aux1.getRotation();
      //   if (e.key === "a") {
      //     self.player.position.set(p.x() - 1, p.y(), p.z());
      //     self.player.quaternion.set(q.x(), q.y(), q.z(), q.w());
      //   } else if (e.key === "d") {
      //     self.player.position.set(p.x() + 1, p.y(), p.z())
      //     self.player.quaternion.set(q.x(), q.y(), q.z(), q.w());
      //   }
      // }

      //https://codepen.io/siouxcitizen/pen/XWmBGEO


    });

    window.addEventListener("keyup", function (e) {
      self.player.move_direction.left = 0;
      self.player.move_direction.right = 0;
      self.player.move_direction.forward = 0;
      self.player.move_direction.back = 0;
      self.player.move_direction.jump = 0;
    });

    console.warn("player", player);
    this.player = player;
    this.scene.add(this.player);
    return this.player;
  }

  set_other_player(username, px, py, pz) {
    // player
    const playerMass = 100;
    const playerHalfExtents = new THREE.Vector3(2, 3, 2);
    this.pos.set(px, py, pz);
    this.quat.set(0, 0, 0, 1);
    //  (優先的に表示) depthTest: false,(背景も含め透明にする) alphaToCoverage: true
    // const player_mat = new THREE.MeshBasicMaterial({ color: 0xff0000, name: "player", opacity: 0.5, transparent: true, alphaToCoverage: true });
    let player_mat = new THREE.MeshPhongMaterial({ color: 0xff0000, name: "player", opacity: 0.5, transparent: true, alphaToCoverage: true });
    // player_mat.map = new THREE.Texture(WEB3D.text_canvas);
    // const player = this.create_paralellepipe_with_physics(2, 2, 2, playerMass, this.pos, this.quat, player_mat);
    // const player = this.create_object(playerMass, playerHalfExtents, this.pos, this.quat, new THREE.MeshBasicMaterial({ color: 0xff0000, name: "player", opacity: 0.5, transparent: true, alphaToCoverage: true }))
    const player = this.create_sphere_object(1, 32, 16, playerMass, this.pos, this.quat, player_mat);
    player.userData.physicsBody.setFriction(0.1);
    player.name = "other_player";
    player.username = username;
    player.texts = [
      "プレイヤー(" + username + ")です",
    ];
    player.hp = 100;
    // this.set_camera(player.position.x, player.position.y, player.position.z);

    let self = this;
    this.ammoTmpVel = new Ammo.btVector3();
    this.ammoTmpRot = new Ammo.btVector3();

    // player.remote_update = function (x = 100, y = 100, z = 100, moveX, moveY, moveZ) {
    //   // self.camera.position.x = player.position.x + 5;
    //   // self.camera.position.y = player.position.y + 5;
    //   // self.camera.position.z = player.position.z + 5;
    //   // player.material.map.needsUpdate = true;
    //   //終了判定
    //   if (moveX !== undefined && moveY !== undefined && moveZ !== undefined) {
    //     // const delta_time = self.clock.getDelta();
    //     // ■phiscs
    //     // self.physics_world.stepSimulation(delta_time, 10);
    //     // for (let i = 0, il = self.rigid_bodyies.length; i < il; i++) {
    //     //   const objThree = player;
    //     //   const objPhys = objThree.userData.physicsBody;
    //     //   const ms = objPhys.getMotionState();

    //     //   if (ms) {
    //     //     ms.getWorldTransform(self.transform_aux1);
    //     //     const p = self.transform_aux1.getOrigin();
    //     //     const q = self.transform_aux1.getRotation();
    //     //     // objThree.position.set(p.x(), p.y(), p.z());
    //     //     objThree.position.set(x, y, z);
    //     //     objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
    //     //     objThree.userData.collided = false;
    //     //   }
    //     // }

    //     // ■point 
    //     // player.position.x = x;
    //     // player.position.y = y;
    //     // player.position.z = z;

    //     player.position.set(x, y, z);

    //     // ■force
    //     const scalingFactor = 10;
    //     // let moveX = x - player.position.x;
    //     // let moveZ = z - player.position.z;
    //     // let moveY = y - player.position.y - (self.gravity_constant / 10);
    //     // if (moveY < 0) { moveY = 0; }

    //     let objPhys = player.userData.physicsBody;
    //     objPhys.setAngularVelocity(self.ammoTmpRot);
    //     // objPhys.getWorldQuaternion(self.tmpQuat);
    //     self.tmpVel.set(moveX, moveY, moveZ);
    //     self.tmpVel.applyQuaternion(self.tmpQuat);
    //     self.ammoTmpVel.setValue(self.tmpVel.x, self.tmpVel.y, self.tmpVel.z);
    //     self.ammoTmpVel.op_mul(scalingFactor);
    //     objPhys.setLinearVelocity(self.ammoTmpVel);

    //     // self.physics_world.stepSimulation(delta_time, this.fps);
    //   }
    // }

    player.collide = function (mesh) {
      console.warn(player.name + "が" + mesh.name + "と衝突しました");

    }

    player.move_direction = { left: 0, right: 0, forward: 0, back: 0, jump: 0 };


    console.warn("other player", player);
    this.scene.add(player);
    this.players.push(player);
    return player;
  }


  update_physics(delta_time) {
    // super.update_physics(delta_time);
    // update
    this.physics_world.stepSimulation(delta_time, 10);
    // 衝突判定
    this.check_collide();

    if (!this.transform_aux1 || !this.player || !this.player.userData) { return; }

    this.reset_time++;
    this.reset_time = this.reset_time % this.fps;

    for (let i = 0, il = this.rigid_bodyies.length; i < il; i++) {
      const objThree = this.rigid_bodyies[i];
      const objPhys = objThree.userData.physicsBody;
      const ms = objPhys.getMotionState();

      if (ms) {
        ms.getWorldTransform(this.transform_aux1);
        const p = this.transform_aux1.getOrigin();
        const q = this.transform_aux1.getRotation();

        if (objThree.name === "player") {
          // player
          objThree.position.set(p.x(), p.y(), p.z());
          objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
          objThree.userData.collided = false;

          const scalingFactor = 10;
          let moveX = this.camera.position.x - this.player.position.x;
          let moveZ = this.camera.position.z - this.player.position.z;
          let moveY = this.player.move_direction.jump - (this.gravity_constant / 10);

          this.player.move_direction.moveX = moveX;
          this.player.move_direction.moveY = moveY;
          this.player.move_direction.moveZ = moveZ;

          let objPhys = this.player.userData.physicsBody;
          objPhys.setAngularVelocity(this.ammoTmpRot);
          // objPhys.getWorldQuaternion(self.tmpQuat);
          this.tmpVel.set(moveX, moveY, moveZ);
          this.tmpVel.applyQuaternion(this.tmpQuat);
          this.ammoTmpVel.setValue(this.tmpVel.x, this.tmpVel.y, this.tmpVel.z);
          this.ammoTmpVel.op_mul(scalingFactor);
          objPhys.setLinearVelocity(this.ammoTmpVel);

        } else if (objThree.name === "other_player") {
          if (objThree.remote_data !== undefined) {
            // other_player

            // objThree.position.set(objThree.remote_data.x, objThree.remote_data.y, objThree.remote_data.z);


            // if (this.reset_time !== 0) {
            //   objThree.position.set(p.x(), p.y(), p.z());
            // } else {
            //   objThree.position.set(objThree.remote_data.x, objThree.remote_data.y, objThree.remote_data.z);
            // }
            // this.reset_time++;
            // this.reset_time = this.reset_time % this.fps;
            // objThree.position.set(p.x(), p.y(), p.z());
            objThree.position.set(objThree.remote_data.x, objThree.remote_data.y, objThree.remote_data.z);
            // if (this.reset_time === 0) { objThree.position.set(objThree.remote_data.x, objThree.remote_data.y, objThree.remote_data.z); }
            objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
            objThree.userData.collided = false;

            // console.warn(objThree.remote_data);

            // const scalingFactor = 10;
            // let moveX = objThree.remote_data.moveX;
            // let moveZ = objThree.remote_data.moveZ;
            // let moveY = objThree.remote_data.moveY;

            // let objPhys = objThree.userData.physicsBody;
            // objPhys.setAngularVelocity(this.ammoTmpRot);
            // this.tmpVel.set(moveX, moveY, moveZ);
            // this.tmpVel.applyQuaternion(this.tmpQuat);
            // this.ammoTmpVel.setValue(this.tmpVel.x, this.tmpVel.y, this.tmpVel.z);
            // this.ammoTmpVel.op_mul(scalingFactor);
            // objPhys.setLinearVelocity(this.ammoTmpVel);
          }
        } else {
          // object
          objThree.position.set(p.x(), p.y(), p.z());
          objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
          objThree.userData.collided = false;
        }
      }
    }
  }


  //three object の textsプロパティを参照する
  talk() {
    if (WEB3D.active_object !== null && WEB3D.active_object.texts !== undefined) {
      if (this.active_talk === null) {
        //会話開始時
        this.active_talk = WEB3D.active_object.texts
        //カメラ移動を停止
        this.stop_camera();
        //会話対象を注視
        this.camera.lookAt(WEB3D.active_object.position);
      }
    }
    if (this.active_talk !== null) {
      const t_length = this.active_talk.length;
      if (this.active_talk_id === t_length) {
        //会話終了時
        this.active_talk = null;
        this.active_talk_id = 0;
        this.set_text("");
        //全てのテキストがなくなった場合はカメラ移動を再開
        this.move_camera();
      } else {
        //会話中：テキストを表示
        this.set_text(this.active_talk[this.active_talk_id]);
        this.active_talk_id++;
      }
    }
  }

  stop_camera() {
    this.controls.movementSpeed = 0;
    this.controls.lookSpeed = 0.0;
  }

  move_camera() {
    this.controls.movementSpeed = 50;
    this.controls.lookSpeed = 2.0;
  }

  static init_window() {
    let start_web3d = WEB3D.list[0];
    WEB3D.view.addEventListener("click", function () {
      if (WEB3DGame.start === false && WEB3D.list.length > 0) {
        WEB3D.activate(start_web3d);
        WEB3D.active_w3.resize();
        WEB3DGame.get_infomation_dom().textContent = "";
        WEB3DGame.start = true;
      }
    });

    window.addEventListener("resize", function () {
      if (WEB3D.active_w3 !== null) {
        WEB3D.active_w3.resize();
      }
    })

    let info = document.createElement("pre");
    info.setAttribute("id", "info");
    info.textContent = "Click on the screen to get started.";
    WEB3D.view.appendChild(info);
    this.info = info;
    // WEB3DGame.get_infomation_dom().textContent = this.txt;

    let explanation = document.createElement("pre");
    explanation.setAttribute("id", "explanation");
    explanation.textContent = " move key \n W：↑ A：← S：↓ D：→ \n left click：↑ right click：↓";
    explanation.addEventListener("click", function (e) {
      explanation.style.display = "none";
      console.warn("mouse down");
    });
    WEB3D.view.appendChild(explanation);
    this.explanation = explanation;

    join(room_name);
  }

  static get_infomation_dom() {
    return WEB3D.view.querySelector("#info");
  }

  static get_explanation_dom() {
    return WEB3D.view.querySelector("#explanation");
  }

  set_text(txt) {
    let t = txt;
    if (t === undefined) {
      t = this.txt;
    }
    WEB3DGame.get_infomation_dom().textContent = t;
  }

  set_explanation(txt) {
    let t = txt;
    if (t === undefined) {
      WEB3DGame.get_explanation_dom().textContent = t;
    }
  }

  draw() {
    try {
      super.draw();
    } catch (e) {
      console.error(e);
    }
  }

  update() {
    super.update();
  }

  resize() {
    super.resize();
  }

  init_input() {
    let self = this;
    // window.addEventListener("pointerdown", function (event) {
    //   //クリックイベントを登録
    // });
  }

  create_objects() {
    //オブジェクトを生成する
    super.create_objects();
  }

  //衝突判定を確認する処理(衝突したら，そのオブジェクトのcollide関数を呼び出すようにしている)
  check_collide() {
    const numManifolds = this.dispatcher.getNumManifolds();
    // console.warn(this.scene.children);
    for (let i = 0; i < numManifolds; i++) {
      const contactManifold = this.dispatcher.getManifoldByIndexInternal(i);
      const numContacts = contactManifold.getNumContacts();
      for (let j = 0; j < numContacts; j++) {
        const contactPoint = contactManifold.getContactPoint(j);
        //衝突判定の距離
        if (contactPoint.getDistance() <= 0.2) {
          const body0 = contactManifold.getBody0();
          const body1 = contactManifold.getBody1();
          if (this.player.userData.physicsBody.hy === body0.hy || this.player.userData.physicsBody.hy === body1.hy) {
            let m0 = this.get_mesh_by_hy(body0.hy);
            let m1 = this.get_mesh_by_hy(body1.hy);
            if (m0 !== null && m1 !== null && m0.name !== "ground" && m1.name !== "ground") {
              // debug
              // console.warn(
              //   m0.name, body0.hy,
              //   m1.name, body1.hy
              // );
              if (m0.collide !== undefined) {
                m0.collide(m1);
              }
              if (m1.collide !== undefined) {
                m1.collide(m0);
              }
            }
          }
        }
        // if (contactPoint.getDistance() <= 0) {
        //   const bodyA = Ammo.castObject(contactManifold.getBody0(), Ammo.btRigidBody);
        //   const bodyB = Ammo.castObject(contactManifold.getBody1(), Ammo.btRigidBody);
        //   console.warn("collision has occurred!", bodyA, bodyB);
        // }
      }
    }
  }

  get_mesh_by_hy(hy) {
    for (let i = 0; i < this.scene.children.length; i++) {
      //console.warn(this.scene.children[i].userData.physicsBody.hy, hy);
      if (this.scene.children[i].userData.physicsBody !== undefined && this.scene.children[i].userData.physicsBody.hy === hy) {
        return this.scene.children[i];
      }
    }
    return null;
  }

  //画像はできるだけ圧縮しておく
  //https://imguma.com/
  set_img_plane(img_path, px = 2, py = 2, pz = 2, rx = 0, ry = 0, rz = 0, w = 1, h = 1, frame = true) {
    let plane_frame = null;
    let plane = null;
    if (frame === true) {
      plane_frame = this.set_plane(px, py * 1.25, pz, rx, ry, rz, w, h / 10, 0xff0000);
      plane_frame.name = "img_frame" + this.img_id;
      plane_frame.material.opacity = 0.5;
      plane = this.set_plane(px, py, pz, rx, ry, rz, w, h);
      plane.name = "img" + this.img_id;
      plane.update = function () {
        if (WEB3D.active_object !== null && WEB3D.active_object.name !== undefined && (WEB3D.active_object.name === plane.name || WEB3D.active_object.name === plane_frame.name)) {
          plane_frame.material.visible = true;
        } else {
          plane_frame.material.visible = false;
        }
      }

    } else {
      plane = this.set_plane(px, py, pz, rx, ry, rz, w, h);
      plane.name = "img" + this.img_id;
    }

    this.texture_loader.load(
      img_path,
      function (texture) {
        plane.material.map = texture;
        plane.material.needsUpdate = true;
      }
    );
    this.img_id++;
    return plane;
  }


  //JSONデータからオブジェクトのプロパティを設定する関数
  set_properties() {
    let obj_info_list = this.load_json.res_data;
    for (let i = 0; i < this.scene.children.length; i++) {
      for (let j = 0; j < obj_info_list.length; j++) {
        let obj = this.scene.children[i];
        let property = obj_info_list[j];
        if (obj.name === property.name) {
          let keys = Object.keys(property);
          console.warn("keys", keys);
          for (let k = 0; k < keys.length; k++) {
            // console.warn(property)
            // console.warn(keys[k], property[keys[k]]);
            if (keys[k] === "sound") {
              this.set_audio_loader(obj, property[keys[k]]);
            } else {
              obj[keys[k]] = property[keys[k]];
            }
          }
        }
      }
    }
  }

  get_properties(name) {
    let obj_info_list = this.load_json.res_data;
    let target_obj = null;
    let target_property = null;
    for (let i = 0; i < this.scene.children.length; i++) {
      let obj = this.scene.children[i];
      if (name === obj.name) {
        target_obj = obj;
        break;
      }
    }
    for (let j = 0; j < obj_info_list.length; j++) {
      let property = obj_info_list[j];
      if (name === property.name) {
        target_property = property;
        break;
      }
    }
    return { "obj": target_obj, "property": target_property };
  }

  //JSONデータからオブジェクト生成する関数
  set_objects() {
    let obj_info_list = this.load_json.res_data;
    for (let i = 0; i < obj_info_list.length; i++) {
      let property = obj_info_list[i];
      let keys = Object.keys(property);
      let obj = null;
      const obj_type = property["obj"];
      // type によってオブジェクトを生成
      // 座標(x,y,z),回転(x,y,z),大きさ(height,width,depth),色(0xffffff),ソースファイルパス(static/??/??),質量（Ammoオブジェクトの場合）
      switch (obj_type) {
        case "cube":
          obj = this.set_cube();
          break;
        case "img":
          obj = this.set_img_plane(property["image"], property["position"]["x"], property["position"]["y"], property["position"]["z"], property["rotation"]["x"], property["rotation"]["y"], property["rotation"]["z"], property["size"]["w"], property["size"]["h"]);
          break;
        default:
          console.warn("set_object :", obj);
      }

      // 生成したオブジェクトのプロパティを設定
      // 後付け可能プロパティ（texts,sound）
      for (let j = 0; j < keys.length; j++) {
        // console.warn(property)
        // console.warn(keys[k], property[keys[k]]);
        if (obj !== null) {
          const key = keys[j];
          const val = property[key];
          switch (key) {
            case "sound":
              this.set_audio_loader(obj, val);
              break;
            case "position":
              // x,y,z
              obj.position.set(val.x, val.y, val.z);
              break;
            case "rotation":
              // x,y,z
              obj.rotation.x = val.x * Math.PI;
              obj.rotation.y = val.y * Math.PI;
              obj.rotation.z = val.z * Math.PI;
              break;
            case "size":
              // w,h,d
              obj.size = val;
              break;
            default:
              console.warn("property :", key, property[key]);
              obj[key] = property[key];
          }
        }
      }
    }
  }

  send_player_info() {
    let self = this;
    setTimeout(function () {
      if (self.player !== null) {
        let data = { username: self.username, x: self.player.position.x, y: self.player.position.y, z: self.player.position.z, moveX: self.player.move_direction.moveX, moveY: self.player.move_direction.moveY, moveZ: self.player.move_direction.moveZ };
        player_info(room_name, data);
      }
      self.send_player_info();
    }, 1000 / this.fps);
  }

  receive_player_info() {
    return this;
  }

}

const room_name = "game_room";
let w3_1 = new WEB3DGame("scene1");
// let w3_2 = new WEB3DAmmo("scene2");
WEB3DGame.init_window();


const player_info = function (room, data) {
  //自プレイヤーの位置情報を送る
  socket.emit("player_info", { room: room, data: data });
}

socket.on("player_update", function (data) {
  //受け取った全プレイヤーの情報を繁栄
  // console.warn("receive data : ", data.data);
  let players_info = data.data;
  if (w3_1.ready === true && w3_1.player !== null && players_info !== undefined) {
    for (let i = 0; i < players_info.length; i++) {
      let player_info = players_info[i];
      // if (player_info.username !== w3_1.username) {
      let is_new_player = true;
      for (let j = 0; j < w3_1.players.length; j++) {
        let player = w3_1.players[j];
        //登録済みの場合
        if (player_info.username === player.username) {
          // player.remote_update(player_info.x, player_info.y, player_info.z, player_info.moveX, player_info.moveY, player_info.moveZ);
          player.remote_data = player_info;
          is_new_player = false;
          break;
        }
      }
      //未登録の場合
      if (player_info.username !== w3_1.username && is_new_player === true) {
        let new_player = w3_1.set_other_player(player_info.username, 10, 10, 10);
        // new_player.remote_update(player_info.x, player_info.y, player_info.z);
      }
      // }
    }
  }
});

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