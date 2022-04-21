const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const jwt = require("express-jwt");
const jwksRsa = require("jwks-rsa");
const authConfig = require("./utils/auth_config.json");

const app = express();

const port = process.env.PORT || 3001;
const appPort = process.env.SERVER_PORT || 3000;
const appOrigin = authConfig.appOrigin || `http://localhost:${appPort}`;
const serviceAccount = require("./utils/antrianonline-5bd8a-firebase-adminsdk-lwvey-2d22dbceb9.json");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}))

const {
  initializeApp,
  cert,
} = require("firebase-admin/app");
const {
  getFirestore,
} = require("firebase-admin/firestore");

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

if (
  !authConfig.domain ||
  !authConfig.audience ||
  authConfig.audience === "YOUR_API_IDENTIFIER"
) {
  console.log(
    "Exiting: Please make sure that auth_config.json is in place and populated with valid domain and audience values"
  );

  process.exit();
}

//app.use(routes)
app.use(morgan("dev"));
app.use(helmet());
app.use(cors({ origin: appOrigin }));

const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${authConfig.domain}/.well-known/jwks.json`,
  }),

  audience: authConfig.audience,
  issuer: `https://${authConfig.domain}/`,
  algorithms: ["RS256"],
});

app.get("/api/external", checkJwt, (req, res) => {
  res.send({
    msg: "Your access token was successfully validated!",
  });
});

app.get("/", (req, res) => res.send("API is Running"));

// get all tenant

app.get("/api/tenant", async (req, res) => {
  const snapshot = await db.collection("tenant").get();
  let data = [];
  snapshot.forEach((doc) => {
    data.push({ tenantId: doc.id, data: doc.data() });
  });
  res.send(data);
});

// get tenant by id

app.get("/api/tenant/:id", async (req, res) => {
  const snapshot = await db.collection("tenant").doc(req.params.id).get();
  let data;
  data = snapshot.data();
  res.send(data);
});

// get queue by id tenant and date (active) (the last queue)

app.get("/api/antrian/lastactive", async (req, res) => {
  const from = req.query.date;
  const besok = new Date(req.query.date);
  besok.setDate(besok.getDate() + 1);
  const to = besok.toString();
  const snapshot = await db
    .collection("antrian")
    .where("tenant_id", "==", req.query.id)
    .where("tanggal", ">=", from)
    .where("tanggal", "<", to)
    .where("status", "==", req.query.status)
    .orderBy("tanggal", "desc")
    .limit(1)
    .get();
  let data = [];
  snapshot.forEach((doc) => {
    data.push(doc.data());
  });
  res.send(data);
});

// get queue by id tenant and date (active) ( antrian yang lagi ditangani )

app.get("/api/antrian/activenow", async (req, res) => {
  const from = req.query.date;
  const besok = new Date(req.query.date);
  besok.setDate(besok.getDate() + 1);
  const to = besok.toString();
  const snapshot = await db
    .collection("antrian")
    .where("tenant_id", "==", req.query.id)
    .where("tanggal", ">=", from)
    .where("tanggal", "<", to)
    .where("status", "==", req.query.status)
    .limit(1)
    .get();
  let data = [];
  snapshot.forEach((doc) => {
    data.push(doc.data());
  });
  res.send(data);
});

// get all total queue by day by tenant id (semua antrian dalam sehari)

app.get("/api/antrian/all", async (req, res) => {
  const from = req.query.date;
  const besok = new Date(req.query.date);
  besok.setDate(besok.getDate() + 1);
  const to = besok.toString();
  const snapshot = await db
    .collection("antrian")
    .where("tenant_id", "==", req.query.id)
    .where("tanggal", ">=", from)
    .where("tanggal", "<", to)
    .get();
  let data = [];
  snapshot.forEach((doc) => {
    data.push(doc.data());
  });
  res.send(data);
});

// get all active queue by day by tenant id (ambil data terakhir berdasarkan status)

app.get("/api/antrian/last", async (req, res) => {
  const from = req.query.date;
  const besok = new Date(req.query.date);
  besok.setDate(besok.getDate() + 1);
  const to = besok.toString();
  const snapshot = await db
    .collection("antrian")
    .where("tenant_id", "==", req.query.id)
    .where("tanggal", ">=", from)
    .where("tanggal", "<", to)
    .where("status", "==", req.query.status)
    .limit(1)
    .get();
  let data = [];
  snapshot.forEach((doc) => {
    data.push(doc.data());
  });
  res.send(data);
});

app.get("/api/antrian/selesai", async (req, res) => {
  const from = req.query.date;
  const besok = new Date(req.query.date);
  besok.setDate(besok.getDate() + 1);
  const to = besok.toString();
  const snapshot = await db
    .collection("antrian")
    .where("tenant_id", "==", req.query.id)
    .where("tanggal", ">=", from)
    .where("tanggal", "<", to)
    .where("status", "==", req.query.status)
    .get();
  let data = [];
  snapshot.forEach((doc) => {
    data.push(doc.data());
  });
  res.send(data);
});

// get antrian exist waktu dan tenant yang sama

app.get("/api/antrian/exist", async (req, res) => {
  const from = req.query.date;
  const besok = new Date(req.query.date);
  besok.setDate(besok.getDate() + 1);
  const to = besok.toString();
  const snapshot = await db
    .collection("antrian")
    .where("tenant_id", "==", req.query.id)
    .where("user_id", "==", req.query.user_id)
    .where("tanggal", ">=", from)
    .where("tanggal", "<", to)
    .where("status", "==", req.query.status)
    .get();
  let data = [];
  snapshot.forEach((doc) => {
    data.push(doc.data());
  });
  res.send(data);
});

// get all queue by user id (active, innactive, all)

app.get("/api/antrian/:userId", async (req, res) => {
  const snapshot = await db
    .collection("antrian")
    .where("user_id", "==", req.params.userId)
    .where("status", "==", req.query.status)
    .get();
  let data = [];
  snapshot.forEach((doc) => {
    data.push(doc.data());
  });
  res.send(data);
});

// get queue by id

app.get("/api/antrian/:userId/", async (req, res) => {
  const snapshot = await db
    .collection("antrian")
    .doc()
    .where("user_id", "==", req.params.userId)
    .get();
  let data = [];
  snapshot.forEach((doc) => {
    data.push(doc.data());
  });
  res.send(data);
});

app.post("/api/antrian/:tenantId", async (req, res) => {
  const data = req.body;
  const result = await db.collection("antrian").add(data);
  res.send(result);
});

app.get("/api/cek", async (req, res) => {
  const snapshot = await db
    .collection("antrian")
    .doc("KzLfrb7BBTCDdsmzRYc2")
    .get();
  const data = snapshot.data();
  //const waktu_antri = firestore.Timestamp.fromDate(data.waktu_antri).toDate()
  res.send(data);
});

app.listen(port, () => console.log(`API Server listening on port ${port}`));

//app.listen(process.env.PORT || 3000)
