//make block break register to everyone
//remove unessecary comments

import * as THREE from "./modules/three.module.js";
import { PointerLockControls } from "./modules/PointerLookControls.js";
import { TextGeometry } from "./modules/TextGemometry.js";
import { FontLoader } from "./modules/Fontoader.js";
const scene = new THREE.Scene();
const socket = io();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
let flightMode = false;
let muted = false;

const backgroundSound = new Audio("./textures/soundTrack.mp3");

function pageClickHandler() {
  backgroundSound.play();
}

document.addEventListener("click", pageClickHandler);

var name;
function askForName() {
  name = prompt("Please enter your name:");
  if (name !== null) {
    socket.emit("getName", name);
  } else {
    askForName();
  }
}
askForName();

function send() {
  const messagePart1 = document.getElementById("input").value;
  document.getElementById("input").value = "";
  const message = name + ": " + messagePart1;
  socket.emit("chat message", message);
}

socket.on("chatmessage", (msg) => {
  const messageNode = document.createElement("p");
  messageNode.textContent = msg;
  messageNode.style.color = "white";
  messageNode.style.margin = "0px";
  messageNode.style.padding = "5px";
  document.getElementById("chats").appendChild(messageNode);
});

document.addEventListener("keydown", function (event) {
  if (
    event.key === "Enter" &&
    document.getElementById("chat").style.visibility == "visible"
  ) {
    send();
  }
});

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const groundSize = 1000;
const gridSize = 100;
const tileWidth = 2.5;
const tileHeight = 2.5;
const groundGeometry = new THREE.PlaneGeometry(
  groundSize,
  groundSize,
  gridSize,
  gridSize
);

const textureLoader = new THREE.TextureLoader();
const groundTexture = textureLoader.load("./textures/grass.png");
groundTexture.wrapS = THREE.RepeatWrapping;
groundTexture.wrapT = THREE.RepeatWrapping;
groundTexture.repeat.set(groundSize / tileWidth, groundSize / tileHeight);

const groundMaterial = new THREE.MeshBasicMaterial({
  map: groundTexture,
  side: THREE.DoubleSide,
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

fetch("/sand-data")
  .then((response) => response.json())
  .then((sandData) => {
    sandData.forEach((data) => {
      createSandTile(data.position, data.size);
    });
  })
  .catch((error) => console.error("Error fetching initial sand data:", error));

document.addEventListener("keydown", (event) => {
  if (
    event.key === "t" &&
    document.getElementById("chat").style.visibility == ""
  ) {
    document.getElementById("chat").style.visibility = "visible";
  } else if (
    event.key === "Escape" &&
    document.getElementById("chat").style.visibility == "visible"
  ) {
    event.preventDefault();
    document.getElementById("chat").style.visibility = "";
  }
});

socket.on("disconnectMessage", (disconnectedPlayerName) => {
  document.getElementById(
    "message"
  ).innerText = `${disconnectedPlayerName} has disconnected!`;

  setTimeout(() => {
    document.getElementById("message").innerText = "";
  }, 2000);
});

socket.on("connectMessage", (playerName) => {
  document.getElementById("message").innerText = `${playerName} has connected!`;

  setTimeout(() => {
    document.getElementById("message").innerText = "";
  }, 2000);
});

const createSandTile = (position, size) => {
  const groundGeometry = new THREE.PlaneGeometry(
    size.width,
    size.height,
    size.width / 2,
    size.height / 2
  );

  const textureLoader = new THREE.TextureLoader();
  const groundTexture = textureLoader.load("./textures/sand.png");
  groundTexture.wrapS = THREE.RepeatWrapping;
  groundTexture.wrapT = THREE.RepeatWrapping;
  groundTexture.repeat.set(size.width / 2.5, size.height / 2.5);

  const groundMaterial = new THREE.MeshBasicMaterial({
    map: groundTexture,
    side: THREE.DoubleSide,
  });

  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(position.x, position.y, position.z);

  scene.add(ground);
};

scene.background = new THREE.Color("skyblue");

const cloudMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.8,
});

const createCloud = (cloudPosition, cloudSize) => {
  const cloudGeometry = new THREE.PlaneGeometry(cloudSize.x, cloudSize.y);
  const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
  cloud.position.copy(cloudPosition);
  cloud.rotation.x = Math.PI / 2;
  scene.add(cloud);
};

fetch("/initialCloudData")
  .then((response) => response.json())
  .then((clouds) => {
    clouds.forEach(({ position, size }) => {
      createCloud(position, size);
    });
  })
  .catch((error) => console.error("Error fetching initial cloud data:", error));

camera.position.y = 5;
camera.position.z = 0;

const sunTexture = new THREE.TextureLoader().load("./textures/sun.png");
const sunSize = 200;
const sunGeometry = new THREE.PlaneGeometry(sunSize, sunSize);
const sunMaterial = new THREE.MeshBasicMaterial({
  map: sunTexture,
  side: THREE.DoubleSide,
  transparent: true,
  emissive: 0xffffff,
  emissiveIntensity: 1,
});
const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
sunMesh.position.set(0, 200, 0);
sunMesh.rotation.x = Math.PI / 2;
scene.add(sunMesh);

fetch("/cube-cluster-data")
  .then((response) => response.json())
  .then((cubeClusterData) => {
    cubeClusterData.forEach((data) => {
      createCubeCluster(data.position);
    });
  })
  .catch((error) => console.error("Error fetching cube cluster data:", error));

const createCubeCluster = (position) => {
  const clusterSize = 3;
  const cubeDistance = 0.75;

  // Bottom layer (3x3 with one missing corner)
  for (let i = 0; i < clusterSize; i++) {
    for (let j = 0; j < clusterSize; j++) {
      if (!(i === 0 && j === 0)) {
        // Skip one corner
        const cubeTexture1 = new THREE.TextureLoader().load(
          "./textures/cobble.png"
        );
        const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
        const cubeMaterial = new THREE.MeshBasicMaterial({
          map: cubeTexture1,
        });
        const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);

        const offsetX = i * cubeDistance;
        const offsetY = cubeDistance - 1;
        const offsetZ = j * cubeDistance;

        cube.position.set(
          position.x + offsetX,
          position.y + offsetY,
          position.z + offsetZ
        );

        scene.add(cube);
      }
    }
  }

  // Second layer (5 random blocks on top)
  for (let i = 0; i < 5; i++) {
    const cubeTexture2 = new THREE.TextureLoader().load(
      "./textures/cobble.png"
    );
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    const cubeMaterial = new THREE.MeshBasicMaterial({
      map: cubeTexture2,
    });
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);

    const offsetX = (Math.random() - 0.5) * clusterSize * cubeDistance;
    const offsetY = 2 * cubeDistance - 1; // Height of the second layer
    const offsetZ = (Math.random() - 0.5) * clusterSize * cubeDistance;

    cube.position.set(
      position.x + offsetX,
      position.y + offsetY,
      position.z + offsetZ
    );

    scene.add(cube);
  }

  // Third layer (3 random blocks on top)
  for (let i = 0; i < 3; i++) {
    const cubeTexture3 = new THREE.TextureLoader().load(
      "./textures/cobble.png"
    );
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    const cubeMaterial = new THREE.MeshBasicMaterial({
      map: cubeTexture3,
    });
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);

    const offsetX = (Math.random() - 0.5) * clusterSize * cubeDistance;
    const offsetY = 3 * cubeDistance - 1; // Height of the third layer
    const offsetZ = (Math.random() - 0.5) * clusterSize * cubeDistance;

    cube.position.set(
      position.x + offsetX,
      position.y + offsetY,
      position.z + offsetZ
    );

    scene.add(cube);
  }
};

const armGeometry = new THREE.BoxGeometry(0.5, 0.5, -3.5);
const armMaterial = new THREE.MeshBasicMaterial({ color: 0xa97d64 });
const armMesh = new THREE.Mesh(armGeometry, armMaterial);
armMesh.position.set(2, -2, -5);
camera.add(armMesh);

let isHitting = false;

const startHitAnimation = () => {
  isHitting = true;
  setTimeout(() => {
    isHitting = false;
  }, 100);
};

document.addEventListener("mousedown", (event) => {
  if (event.button === 0) {
    if (activeSlot === 0) {
      moveSword();
    } else {
      startHitAnimation();
    }
  }
});

const moveSword = () => {
  sword.position.set(3.5, -1.3, -5);
  sword.rotation.set(0.3, 0, 1.2);
  setTimeout(() => {
    resetSwordPosition();
  }, 100);
};

const resetSwordPosition = () => {
  sword.position.set(3.5, -1.3, -5);
  sword.rotation.set(0.5, 0, 1);
};

const updateArmPosition = () => {
  if (isHitting) {
    armMesh.rotation.set(0, 0, 0);
    armMesh.position.set(2, -1, -1.15);
  } else {
    armMesh.rotation.set(0.5, 3, 0);
    armMesh.position.set(2, -2, -1);
  }
};

const createLargerMinecraftTree = (position) => {
  const leavesGeometry = new THREE.BoxGeometry(5, 5, 5);
  const leavesTexture = new THREE.TextureLoader().load("./textures/leafs.png");
  const leavesMaterial = new THREE.MeshBasicMaterial({
    map: leavesTexture,
    color: 0x00ff00,
  });
  const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
  leaves.position.set(0, 7.5, -10);

  scene.add(leaves);

  const trunkGeometry = new THREE.BoxGeometry(1, 10, 1);

  const trunkTexture = new THREE.TextureLoader().load("./textures/oak.png");
  const trunkMaterial = new THREE.MeshBasicMaterial({
    map: trunkTexture,
    color: 0x8b4513,
  });
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);

  trunk.position.set(0, -3, 0);
  leaves.add(trunk);

  leaves.position.copy(position).add(new THREE.Vector3(0, 5, 0));
};

fetch("/tree-data")
  .then((response) => response.json())
  .then((treeData) => {
    treeData.forEach((position) => {
      createLargerMinecraftTree(position);
    });
  })
  .catch((error) => console.error("Error fetching initial tree data:", error));

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const controls = new PointerLockControls(camera, renderer.domElement);
document.addEventListener("click", () => {
  controls.lock();
});
scene.add(controls.getObject());

const keys = {};
let canJump = true;
let isCrouching = false;

function tabMenu() {
  document.getElementById("online").textContent = "";
  if (document.getElementById("online").style.visibility == "") {
    socket.emit("sendNames");
    document.getElementById("online").style.visibility = "visible";
  } else if (document.getElementById("online").style.visibility == "visible") {
    document.getElementById("online").style.visibility = "";
  }
}

socket.on("namesList2", (namesList) => {
  const online = document.createElement("p");
  online.textContent = "Online Players:";
  online.style.textAlign = "center";
  online.style.color = "white";
  online.style.fontSize = "30px";
  online.style.margin = "5px";
  online.style.padding = "0px";
  document.getElementById("online").appendChild(online);
  namesList.forEach((name) => {
    const onlineName = document.createElement("p");
    onlineName.textContent = name;
    onlineName.style.textAlign = "center";
    onlineName.style.color = "white";
    onlineName.style.fontSize = "20px";
    onlineName.style.margin = "5px";
    onlineName.style.padding = "0px";
    document.getElementById("online").appendChild(onlineName);
  });
});

const onKeyDown = (event) => {
  keys[event.code] = true;

  if (event.key === "m") {
    if (muted == false) {
      muted = true;
      backgroundSound.muted = true;
      backgroundSound.pause();
      document.getElementById("mute").src = "./textures/mute.png";
    } else if (muted == true) {
      muted = false;
      backgroundSound.muted = false;
      backgroundSound.play();
      document.getElementById("mute").src = "./textures/unmute.png";
    }
  }

  if (event.key === "Tab") {
    event.preventDefault();
    tabMenu();
  }

  if (event.code === "KeyF" && flightMode) {
    flightMode = false;
  } else if (event.code === "KeyF" && !flightMode) {
    flightMode = true;
  }

  if (
    event.code === "Space" &&
    canJump &&
    controls.getObject().position.y < 4 &&
    document.getElementById("chat").style.visibility == ""
  ) {
    controls.getObject().position.y += 0.5;
    verticalVelocity = jumpSpeed;
    canJump = false;
  }

  if (event.code === "ControlLeft") {
    if (!flightMode) {
      isCrouching = true;
    }
  }

  if (event.code === "KeyA" || event.code === "KeyD") {
    lateralMovementEnabled = true;
    lateralMovementDirection = event.code === "KeyA" ? -1 : 1;
  }
  if (event.code === "KeyR") {
    controls.getObject().position.set(0, 0, 0);
  }
};

const onKeyUp = (event) => {
  keys[event.code] = false;

  if (event.code === "Space") {
    canJump = true;
  }

  if (event.code === "ControlLeft") {
    isCrouching = false;
  }

  if (event.code === "KeyA" || event.code === "KeyD") {
    lateralMovementEnabled = false;
  }
};

document.addEventListener("keydown", onKeyDown);
document.addEventListener("keyup", onKeyUp);

let verticalVelocity = 0;
const jumpSpeed = 0.3;

let lateralMovementEnabled = false;
let lateralMovementDirection = 0;

const fpsElement = document.getElementById("fps");
let frameCount = 0;
let lastTime = performance.now();

const player = controls.getObject();
const xCoordElement = document.getElementById("x");
const yCoordElement = document.getElementById("y");
const zCoordElement = document.getElementById("z");

const updateCoordinates = () => {
  const currentPosition = player.position;

  xCoordElement.textContent = `X: ${currentPosition.x.toFixed(2)}`;
  yCoordElement.textContent = `Y: ${currentPosition.y.toFixed(2)}`;
  zCoordElement.textContent = `Z: ${currentPosition.z.toFixed(2)}`;
};

const animate = function () {
  requestAnimationFrame(animate);
  updateCoordinates();

  const playerPosition = controls.getObject().position;
  const newPosition = new THREE.Vector3();

  newPosition.copy(playerPosition);

  const playerRotation = controls.getObject().rotation;
  const newRotation = new THREE.Euler();
  newRotation.copy(playerRotation);

  onPlayerMove(newPosition, newRotation);

  const halfGroundSize = groundSize / 2;

  if (playerPosition.x < -halfGroundSize) playerPosition.x = -halfGroundSize;
  if (playerPosition.x > halfGroundSize) playerPosition.x = halfGroundSize;
  if (playerPosition.z < -halfGroundSize) playerPosition.z = -halfGroundSize;
  if (playerPosition.z > halfGroundSize) playerPosition.z = halfGroundSize;

  frameCount++;
  const currentTime = performance.now();
  const elapsedTime = currentTime - (lastTime || currentTime);
  if (elapsedTime >= 1000) {
    const fps = Math.round(frameCount / (elapsedTime / 1000));
    fpsElement.textContent = `FPS: ${fps}`;
    frameCount = 0;
    lastTime = currentTime;
  }

  updateArmPosition();

  renderer.render(scene, camera);

  const baseSpeed = isCrouching ? 0.1 : 0.2;
  const sprintSpeed = 0.35;
  const rotateSpeed = 0.002;
  const squatSpeed = 0.05;
  const moveDirection = new THREE.Vector3();
  const flightSpeed = 1;

  if (controls.isLocked) {
    if (flightMode) {
      const verticalMovement = keys["Space"] ? 1 : keys["ControlLeft"] ? -1 : 0;

      verticalVelocity =
        keys["Space"] || keys["ControlLeft"] ? verticalMovement * 0.3 : 0;

      controls.getObject().position.y += verticalVelocity;

      if (keys["Space"] && !canJump) {
        canJump = true;
      }

      if (keys["ControlLeft"]) {
        const groundLevel = 0;
        const descentSpeed = 0.0125;

        if (controls.getObject().position.y > groundLevel) {
          controls.getObject().position.y -= descentSpeed;
        }
      }
    }

    controls.direction = controls.direction || new THREE.Vector3();

    const movementX = lateralMovementEnabled ? lateralMovementDirection : 0;
    const movementY = keys["KeyW"] ? 1 : keys["KeyS"] ? -1 : 0;

    const cameraDirection = new THREE.Vector3();
    controls.getObject().getWorldDirection(cameraDirection);
    cameraDirection.y = 0;

    const cameraRight = new THREE.Vector3();
    cameraRight.crossVectors(cameraDirection, new THREE.Vector3(0, 1, 0));
    cameraRight.y = 0;
    cameraRight.normalize();

    moveDirection
      .set(cameraRight.x, 0, cameraRight.z)
      .multiplyScalar(movementX);
    moveDirection.add(cameraDirection.multiplyScalar(movementY));

    if (isCrouching) {
      controls.getObject().position.y = 2;
      controls
        .getObject()
        .position.add(moveDirection.normalize().multiplyScalar(squatSpeed));
    } else {
      if (controls.getObject().position.y > 3) {
        verticalVelocity -= 0.0025;
        controls.getObject().position.y += verticalVelocity;
      }

      if (controls.getObject().position.y < 3) {
        controls.getObject().position.y = 3;
        verticalVelocity = 0;
        canJump = true;
      }
    }

    if (keys["ShiftLeft"] && !isCrouching) {
      controls
        .getObject()
        .position.add(moveDirection.normalize().multiplyScalar(sprintSpeed));
    } else {
      controls
        .getObject()
        .position.add(
          moveDirection
            .normalize()
            .multiplyScalar(flightMode ? flightSpeed : baseSpeed)
        );
    }
  }

  controls.direction = controls.direction || new THREE.Vector3();

  const cameraDirection = new THREE.Vector3();
  controls.getObject().getWorldDirection(cameraDirection);
  cameraDirection.y = 0;

  const cameraRight = new THREE.Vector3();
  cameraRight.crossVectors(cameraDirection, new THREE.Vector3(0, 1, 0));
  cameraRight.y = 0;
  cameraRight.normalize();

  if (isCrouching) {
    controls.getObject().position.y = 2;
    controls
      .getObject()
      .position.add(moveDirection.normalize().multiplyScalar(squatSpeed));
  } else {
    if (controls.getObject().position.y > 3) {
      verticalVelocity -= 0.015;
      controls.getObject().position.y += verticalVelocity;
    }

    if (controls.getObject().position.y < 3) {
      controls.getObject().position.y = 3;
      verticalVelocity = 0;
      canJump = true;
    }
  }

  if (keys["ShiftLeft"] && !isCrouching) {
    controls
      .getObject()
      .position.add(moveDirection.normalize().multiplyScalar(sprintSpeed));
  } else {
    controls
      .getObject()
      .position.add(moveDirection.normalize().multiplyScalar(baseSpeed));
  }
};

renderer.render(scene, camera);

animate();

const hotbarSize = 9;
let activeSlot = 0;

const hotbarItems = [
  "./textures/sword.png",
  "./textures/grass.png",
  "./textures/dirt.png",
  "./textures/cobble.png",
  "./textures/oak.png",
  "./textures/oak_plank.png",
  "./textures/leafs.png",
  "./textures/sand.png",
  "./textures/glass.png",
];

const hotbar = document.getElementById("hotbar");
for (let i = 0; i < hotbarSize; i++) {
  const slot = document.createElement("div");
  slot.className = "hotbar-slot";
  slot.addEventListener("click", () => setActiveSlot(i));

  const image = document.createElement("img");
  image.src = hotbarItems[i];
  image.alt = `Item ${i + 1}`;
  image.width = 50;
  image.height = 50;
  slot.appendChild(image);

  hotbar.appendChild(slot);
}

const setActiveSlot = (slotIndex) => {
  if (activeSlot !== slotIndex) {
    if (activeSlot === 0) {
      if (sword) {
        camera.remove(sword);
      }
    }

    activeSlot = slotIndex;
    updateActiveSlotHighlight();

    if (activeSlot > 0) {
      if (sword) {
        camera.remove(sword);
      }
    } else {
      sword.position.set(3.5, -1.3, -5);
      sword.rotation.set(0.5, 0, 1);

      camera.add(sword);
    }
  }
};

const updateActiveSlotHighlight = () => {
  const slots = hotbar.getElementsByClassName("hotbar-slot");
  for (let i = 0; i < hotbarSize; i++) {
    slots[i].classList.toggle("active-slot", i === activeSlot);
  }
};

document.addEventListener("wheel", (event) => {
  if (event.deltaY > 0) {
    setActiveSlot((activeSlot + 1) % hotbarSize);
  } else if (event.deltaY < 0) {
    setActiveSlot((activeSlot - 1 + hotbarSize) % hotbarSize);
  }
});

const setActiveSlot1 = (slotIndex) => {
  activeSlot = slotIndex;
  updateActiveSlotHighlight();
};

setActiveSlot1(0);

document.addEventListener("keydown", (event) => {
  const keyNumber = parseInt(event.key);
  if (!isNaN(keyNumber) && keyNumber >= 1 && keyNumber <= hotbarSize) {
    setActiveSlot(keyNumber - 1);
  }
});

const swordGeometry = new THREE.BoxGeometry(1, 4, 0);
const swordTexture = new THREE.TextureLoader().load("./textures/sword.png");
const swordMaterial = new THREE.MeshBasicMaterial({
  map: swordTexture,
  transparent: true,
  color: 0x73c2fb,
});
const sword = new THREE.Mesh(swordGeometry, swordMaterial);
sword.position.set(3.5, -1.3, -5);
sword.rotation.set(0.5, 0, 1);

camera.add(sword);

document.addEventListener("keydown", (event) => {
  const keyNumber = parseInt(event.key);
  if (!isNaN(keyNumber) && keyNumber >= 1 && keyNumber <= hotbarSize) {
    setActiveSlot(keyNumber - 1);

    if (activeSlot === 0) {
      sword.position.set(3.5, -1.3, -5);
      sword.rotation.set(0.5, 0, 1);

      camera.add(sword);
    } else {
      if (sword) {
        camera.remove(sword);
      }
    }
  }
});

socket.on("initialBlockData", (initialData) => {
  renderBlocks(initialData);
});

socket.on("updateBlockData", (updatedData) => {
  renderBlocks(updatedData);
});

const cubeGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
const color = new THREE.Color();

const renderBlocks = (blockData) => {
  const brightness = 0.4;
  const saturation = 1;
  color.setRGB(brightness, brightness, brightness);
  color.multiplyScalar(saturation);

  for (const data of blockData) {
    const cubeMaterial = new THREE.MeshBasicMaterial({
      map: new THREE.TextureLoader().load(data.texturePath),
      color: color,
      transparent: true,
    });
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.position.copy(data.position);
    scene.add(cube);
  }
};

const placeCubeOnRightClick = (event) => {
  if (event.button === 2) {
    const brightness = 0.4;
    const saturation = 1;

    color.setRGB(brightness, brightness, brightness);
    color.multiplyScalar(saturation);
    const cubePosition = calculateCubePosition();
    const cubeTexturePath = hotbarItems[activeSlot];
    var cubeMaterial;
    if (activeSlot != 0) {
      const audio = new Audio("./textures/place.mp3");
      if (muted == false) {
        audio.play();
      }
      if (activeSlot == 8) {
        cubeMaterial = new THREE.MeshBasicMaterial({
          map: new THREE.TextureLoader().load(cubeTexturePath),
          color: color,
          transparent: true,
        });
      } else {
        cubeMaterial = new THREE.MeshBasicMaterial({
          map: new THREE.TextureLoader().load(cubeTexturePath),
          color: color,
        });
      }

      const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
      cube.position.copy(cubePosition);
      // scene.add(cube);
      socket.emit("placeBlock", {
        position: cubePosition,
        texturePath: cubeTexturePath,
        activeSlot: activeSlot,
      });
    }
  }
};

document.addEventListener("mousedown", placeCubeOnRightClick);

const calculateCubePosition = () => {
  const cameraDirection = new THREE.Vector3();
  controls.getObject().getWorldDirection(cameraDirection);
  const distance = 5;
  const cubePosition = new THREE.Vector3();
  cubePosition
    .copy(controls.getObject().position)
    .add(cameraDirection.multiplyScalar(distance));
  return cubePosition;
};

socket.on("updateCubes", (cubeData) => {
  const cubeMaterial = new THREE.MeshBasicMaterial({
    map: new THREE.TextureLoader().load(cubeData.texturePath),
    color: color,
    transparent: true,
  });
  const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
  cube.position.copy(cubeData.position);
  scene.add(cube);
});

const getIntersects = (clientX, clientY) => {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  mouse.x = (clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  raycaster.far = 1;

  const intersects = raycaster.intersectObjects(scene.children, true);

  return intersects;
};

const destroyCubeOnLeftClick = (event) => {
  if (event.button === 0) {
    // Left-click
    const intersects = getIntersects(event.clientX, event.clientY);

    if (intersects.length > 0) {
      const selectedObject = intersects.find(
        (intersection) => intersection.object !== ground
      );
      if (
        intersects.length > 0 &&
        intersects[0].object instanceof THREE.Mesh &&
        intersects[0].object.geometry.parameters.width === 1.5 &&
        intersects[0].object.geometry.parameters.height === 1.5 &&
        intersects[0].object.geometry.parameters.depth === 1.5
      ) {
        scene.remove(selectedObject.object);

        const cubePosition = selectedObject.object.position;
        if (cubePosition) {
          const audio = new Audio("./textures/place.mp3");
          audio.play();
        }
        socket.emit("destroyBlock", { position: cubePosition });
      }
      // if (
      //   //for hitting another players
      //   intersects.length > 0 &&
      //   intersects[0].object instanceof THREE.Mesh
      // ) {
      //   console.log(selectedObject);
      // }
    }
  }
};

socket.on("destroyedBlock", (destroyedBlockData) => {
  // Find and remove the corresponding block from the client-side scene
  const destroyedBlock = scene.getObjectByProperty(
    "position",
    destroyedBlockData.position
  );
  if (destroyedBlock) {
    scene.remove(destroyedBlock);
  }
});

document.addEventListener("mousedown", destroyCubeOnLeftClick);

const hotbar1 = document.getElementById("hotbar");

const heartTexturePath = "./textures/heart.png";

const heartsContainer = document.createElement("div");
heartsContainer.classList.add("hearts-container");
heartsContainer.style.display = "flex";
heartsContainer.style.position = "absolute";
heartsContainer.style.bottom = "75px";
heartsContainer.style.right = "335px";

const hearts = [];

for (let i = 0; i < 10; i++) {
  const heart = document.createElement("div");
  heart.classList.add("heart");

  const heartImage = document.createElement("img");
  heartImage.src = heartTexturePath;
  heartImage.alt = `Heart ${i + 1}`;
  heartImage.width = 25;
  heartImage.height = 25;

  heart.appendChild(heartImage);
  hearts.push(heart);
  heartsContainer.appendChild(heart);
}

hotbar1.appendChild(heartsContainer);

const updateHearts = (health) => {
  for (let i = 0; i < 10; i++) {
    hearts[i].classList.toggle("heart-filled", i < health);
  }
};

const playerModels = {};

function createPlayerModel(playerId, playerName) {
  const geometry = new THREE.BoxGeometry(2, 4, 1);

  const textureLoader = new THREE.TextureLoader();
  const textureFront = textureLoader.load("./textures/steev-front.png");
  const textureBack = textureLoader.load("./textures/steev-back.png");
  const textureLeft = textureLoader.load("./textures/steev-right.png");
  const textureRight = textureLoader.load("./textures/steev-left.png");
  const textureTop = textureLoader.load("./textures/steev-top.png");
  const textureBottom = textureLoader.load("./textures/nothing.png");

  const materials = [
    new THREE.MeshBasicMaterial({
      map: textureLeft,
      side: THREE.DoubleSide,
      transparent: true,
    }),
    new THREE.MeshBasicMaterial({
      map: textureRight,
      side: THREE.DoubleSide,
      transparent: true,
    }),
    new THREE.MeshBasicMaterial({
      map: textureTop,
      side: THREE.DoubleSide,
      transparent: true,
    }),
    new THREE.MeshBasicMaterial({
      map: textureBottom,
      side: THREE.DoubleSide,
      transparent: true,
    }),
    new THREE.MeshBasicMaterial({
      map: textureBack,
      side: THREE.DoubleSide,
      transparent: true,
    }),
    new THREE.MeshBasicMaterial({
      map: textureFront,
      side: THREE.DoubleSide,
      transparent: true,
    }),
  ];

  const playerModel = new THREE.Mesh(geometry, materials);

  const fontLoader = new FontLoader();
  fontLoader.load("./modules/font.json", function (font) {
    const textGeometry = new TextGeometry(playerName, {
      font: font,
      size: 0.5,
      height: 0.1,
    });

    const textMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });

    textGeometry.computeBoundingBox();
    const textWidth =
      textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
    textGeometry.translate(-textWidth / 2, 0, 0);

    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.position.set(0, 3, 0);
    textMesh.rotation.y = THREE.MathUtils.degToRad(900);
    playerModel.add(textMesh);
  });

  scene.add(playerModel);

  playerModels[playerId] = playerModel;
}

function updatePlayerModelPosition(playerId, position) {
  const playerModel = playerModels[playerId];
  if (playerModel) {
    playerModel.position.set(position.x, position.y, position.z);
  }
}

function updatePlayerModelRotation(playerId, rotation) {
  const playerModel = playerModels[playerId];
  if (playerModel) {
    playerModel.rotation.set(rotation._x, rotation._y, rotation._z);
  }
}

function setPlayerModelVisibility(playerId, isVisible) {
  const playerModel = playerModels[playerId];
  if (playerModel) {
    playerModel.material.forEach((material, index) => {
      material.alphaTest = 0.5;
      if (index < 6) {
        material.opacity = isVisible ? 1 : 0;
        material.transparent = true;
      }
    });
  }
}

socket.on("playerDisconnect", (disconnectedPlayerId) => {
  const disconnectedPlayerModel = playerModels[disconnectedPlayerId];
  if (disconnectedPlayerModel) {
    scene.remove(disconnectedPlayerModel);
    delete playerModels[disconnectedPlayerId];
  }
});

socket.on("updatePlayers", (players) => {
  for (const playerId in players) {
    const playerName = players[playerId].name;
    if (!playerModels[playerId]) {
      createPlayerModel(playerId, playerName);
    }
    updatePlayerModelPosition(playerId, players[playerId].position);
    updatePlayerModelRotation(playerId, players[playerId].rotation);
    const isCurrentPlayer = playerId === socket.id;
    setPlayerModelVisibility(playerId, !isCurrentPlayer);
  }
});
function onPlayerMove(position, rotation) {
  socket.emit("playerMove", { id: socket.id, position, rotation });
}
