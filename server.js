const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const jwt = require("express-jwt");
const jwksRsa = require("jwks-rsa");
const authConfig = require("./utils/auth_config.json");

const app = express();

const port = process.env.PORT || 4000;
const appPort = process.env.SERVER_PORT || 3001;
const appOrigin = authConfig.appOrigin || `http://localhost:${appPort}`;
const serviceAccount = require("./utils/antrianonline-5bd8a-firebase-adminsdk-lwvey-2d22dbceb9.json");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

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
app.use(cors());

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

// get antrian yang status lagi antri
app.get("/api/antrian/allantri", async (req, res) => {
  const from = req.query.date;
  const besok = new Date(req.query.date);
  besok.setDate(besok.getDate() + 1);
  const to = besok.toISOString().slice(0, 10);
  const snapshot = await db
    .collection("antrian")
    .where("tenant_id", "==", req.query.id)
    .where("tanggal", ">=", from)
    .where("tanggal", "<", to)
    .where("status", "==", req.query.status)
    .orderBy("tanggal", "desc")
    .get();
  let data = [];
  snapshot.forEach((doc) => {
    data.push(doc.data());
  });
  res.send(data);
});

// get id antrian pertama

app.get("/api/antrian/first", async (req, res) => {
  const from = req.query.date;
  const besok = new Date(req.query.date);
  besok.setDate(besok.getDate() + 1);
  const to = besok.toISOString().slice(0, 10);
  const snapshot = await db
    .collection("antrian")
    .where("tenant_id", "==", req.query.id)
    .where("tanggal", ">=", from)
    .where("tanggal", "<", to)
    .where("status", "==", req.query.status)
    .orderBy("tanggal", "desc")
    .limit(1)
    .get();
  let data;
  snapshot.forEach((doc) => {
    data = doc.id;
  });
  res.send(data);
});

// set edit next antrian

app.put("/api/antrian/firstedit/:idAntrian", async (req, res) => {
  const id = req.params.idAntrian;
  try {
    const snapshot = await db
      .collection("antrian")
      .doc(id)
      .update({ status: "Aktif" });
    res.send("success");
  } catch (error) {
    res.send(error);
  }
});

// set antrian ditangani
app.put("/api/antrian/ditangani/:idAntrian", async (req, res) => {
  const id = req.params.idAntrian;
  try {
    const snapshot = await db
      .collection("antrian")
      .doc(id)
      .update({ status: "Selesai" });
    res.send("success");
  } catch (error) {
    res.send(error);
  }
});

// get queue by id tenant and date (active) (the last queue)

app.get("/api/antrian/lastactive", async (req, res) => {
  const from = req.query.date;
  const besok = new Date(req.query.date);
  besok.setDate(besok.getDate() + 1);
  const to = besok.toISOString().slice(0, 10);
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
  const to = besok.toISOString().slice(0, 10);
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
    data.push({ id: doc.id, data: doc.data() });
  });
  res.send(data);
});

// get all total queue by day by tenant id (semua antrian dalam sehari)

app.get("/api/antrian/all", async (req, res) => {
  const from = req.query.date;
  const besok = new Date(req.query.date);
  besok.setDate(besok.getDate() + 1);
  const to = besok.toISOString().slice(0, 10);
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
  const to = besok.toISOString().slice(0, 10);
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
  const to = besok.toISOString().slice(0, 10);
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
  const to = besok.toISOString().slice(0, 10);
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
    data.push({ antrianId: doc.id, data: doc.data() });
  });
  res.send(data);
});

// get queue by id

app.get("/api/antrian/:userId/", async (req, res) => {
  const snapshot = await db
    .collection("antrian")
    .where("user_id", "==", req.params.userId)
    .get();
  let data = [];
  snapshot.forEach((doc) => {
    data.push(doc.data());
  });
  res.send(data);
});

// tambah antrian baru
app.post("/api/antrian/:tenantId", async (req, res) => {
  const data = req.body;
  try {
    const result = await db.collection("antrian").add(data);
    return res.send("success");
  } catch (error) {
    return res.send(error)
  }
});

// cancel antrian
app.put("/api/antrian/cancel", async (req, res) => {
  const id = req.query.antrianId;
  const result = await db
    .collection("antrian")
    .doc(id)
    .update({ status: "Dibatalkan" });
  res.send("success");
});

// REKAM MEDIS
// cek nomor rekam medis dengan email / user_id

app.get("/api/rekam/:userId", async (req, res) => {
  const snapshot = await db
    .collection("rekam_medis")
    .where("user_id", "==", req.params.userId)
    .get();
  let data;
  snapshot.forEach((doc) => {
    data = doc.data();
  });
  res.send(data);
});

// tambah data rekam medis baru

app.post("/api/rekam/:userId", async (req, res) => {
  const data = req.body;
  const snapshot = await db.collection("rekam_medis").add(data);
  res.send(snapshot.id);
});

// edit data rekam medis

app.put("/api/rekam/:userId", async (req, res) => {
  const data = req.body;
  let id;
  const getId = await db
    .collection("rekam_medis")
    .where("user_id", "==", req.params.userId)
    .get();
  getId.forEach((res) => (id = res.id));
  const snapshot = await db.collection("rekam_medis").doc(id).update(data);
  res.send(snapshot.id);
});

//get nomor rekam medis terakhir

app.get("/api/rekamlast", async (req, res) => {
  const snapshot = await db
    .collection("rekam_medis")
    .orderBy("nomor_rekam", "desc")
    .limit(1)
    .get();
  let data;
  snapshot.forEach((doc) => {
    data = doc.data();
  });
  res.send(data);
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
