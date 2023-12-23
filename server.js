const express = require("express");
const bodyParser = require("body-parser");
const http = require("http");
const { Server } = require("socket.io");
const app = express();
const port = 3000;

const server = http.createServer(app);
const io = new Server(server);

app.use(bodyParser.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

const blockData = [];
const players = {};

io.on("connection", (socket) => {
  console.log("A user connected");

  // Load block data for the connected client
  socket.emit("initialBlockData", blockData);

  socket.on("destroyBlock", (destroyData) => {
    // Handle block destruction on the server side
    handleBlockDestruction(destroyData);
  });

  // Handle block placement and update the in-memory list
  socket.on("placeBlock", (newBlockData) => {
    // Add the new block data to the in-memory list
    blockData.push(newBlockData);

    // Broadcast the updated data to all clients
    io.emit("updateBlockData", blockData);
  });

  // Handle new player joining
  socket.on("newPlayer", (playerData) => {
    players[socket.id] = playerData;
    io.emit("updatePlayers", players);
  });

  // Handle player movement
  socket.on("playerMove", (playerData) => {
    players[socket.id] = playerData;
    io.emit("updatePlayers", players);
  });

  // Handle player disconnect
  socket.on("disconnect", () => {
    delete players[socket.id];
    io.emit("updatePlayers", players);
    io.emit("playerDisconnect", socket.id);
  });
});

const handleBlockDestruction = (destroyData) => {
  // Find and remove the destroyed block from the blockData array
  const index = blockData.findIndex(
    (block) =>
      block.position.x === destroyData.position.x &&
      block.position.y === destroyData.position.y &&
      block.position.z === destroyData.position.z
  );

  if (index !== -1) {
    blockData.splice(index, 1);

    // Emit the updated block data to all clients
    io.emit("updateBlockData", blockData);
  }
};

module.exports = { app, server, io };

const cloudData = [];

const generateClouds = () => {
  const clouds = [];
  const gridSize = 1000;
  const gridSizeFactor = Math.ceil(gridSize / 100);
  const cloudCount = 20 * gridSizeFactor;

  for (let i = 0; i < cloudCount; i++) {
    const cloudSize = {
      x: Math.random() * 10 + 5,
      y: Math.random() * 10 + 5,
    };
    let cloudPosition;
    do {
      cloudPosition = {
        x: (Math.random() - 0.5) * gridSize,
        y: 60 + Math.random() * 20,
        z: (Math.random() - 0.5) * gridSize,
      };
    } while (checkOverlap(cloudPosition, cloudSize));

    clouds.push({ position: cloudPosition, size: cloudSize });
  }
  return clouds;
};

const checkOverlap = (newPosition, newSize) => {
  for (const data of cloudData) {
    const distance = getDistance(data.position, newPosition);
    const minDistance = Math.max(
      data.size.x,
      data.size.y,
      newSize.x,
      newSize.y
    );
    if (distance < minDistance) {
      return true; // Overlapping
    }
  }
  return false; // Not overlapping
};

const getDistance = (a, b) =>
  Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
const clouds = generateClouds();

app.get("/initialCloudData", (req, res) => {
  cloudData.push(...clouds);
  res.json(clouds);
});

//trees

const generateTreeData = () => {
  const trees = [];
  for (let i = 0; i < 75; i++) {
    const randomX = getRandomCoordinates(-500, 500);
    const randomZ = getRandomCoordinates(-500, 500);
    trees.push({ x: randomX, y: 0, z: randomZ });
  }
  return trees;
};

// Function to generate random coordinates within a given range
const getRandomCoordinates = (min, max) => {
  return Math.random() * (max - min) + min;
};

const treeData = generateTreeData();

app.get("/tree-data", (req, res) => {
  res.json(treeData);
});

//sand
const generateSandData = () => {
  const sand = [];
  for (let i = 0; i < 20; i++) {
    const randomX = getRandomCoordinates(-450, 450);
    const randomZ = getRandomCoordinates(-450, 450);
    const size = {
      width: Math.random() * (75 - 20) + 20,
      height: Math.random() * (75 - 20) + 20,
    };
    sand.push({ position: { x: randomX, y: 0.1, z: randomZ }, size });
  }
  return sand;
};

const sandData = generateSandData();

app.get("/sand-data", (req, res) => {
  res.json(sandData);
});

//rocks
const generateCubeClusterData = () => {
  const cubeClusters = [];
  for (let i = 0; i < 100; i++) {
    const randomX = getRandomCoordinates(-500, 500);
    const randomZ = getRandomCoordinates(-500, 500);
    cubeClusters.push({ position: { x: randomX, y: 1, z: randomZ } });
  }
  return cubeClusters;
};

const cubeClusterData = generateCubeClusterData();

app.get("/cube-cluster-data", (req, res) => {
  res.json(cubeClusterData);
});

server.listen(port, () => {
  console.log("Server listening on port " + port);
});
