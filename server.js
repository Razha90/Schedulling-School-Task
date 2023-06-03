const express = require("express");
const session = require("express-session");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const fs = require("fs");
const setInterval = require("timers").setInterval;
const emailModule = require('./sendemail');

const publicPath = path.join(__dirname, "src");
app.use(express.static(publicPath));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  session({
    secret: "dkpdscopdcewopj3emdfdlmljn",
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "ejs"));

// Read Database
const readData = () => {
  data = JSON.parse(fs.readFileSync("database.json", "utf-8"));
};
readData();

// Hapus DataScheduler
function checkAndRemoveSchedule() {
  const currentTime = new Date();

  const updatedSchedule = data.schedule.filter((entry) => {
    const lastTime = new Date(entry.last);
    return currentTime <= lastTime; // Biarkan entri yang waktu "last"-nya belum terlampui
  });
  if (updatedSchedule.length !== data.schedule.length) {
    // Ada entri yang dihapus, update data JSON
    const removedSchedule = data.schedule.filter(
      (entry) => !updatedSchedule.includes(entry)
    );
    data.schedule = updatedSchedule;

    // Tulis kembali data JSON ke file
    fs.writeFileSync("database.json", JSON.stringify(data, null, 2));

    fs.writeFileSync(
      "scheduleremove.json",
      JSON.stringify(removedSchedule, null, 2)
    );

    console.log("Data Dihapus Silakan Chechk");
  }
}

function sendMail() {
  readData();
  const currentTime = new Date();
  const oneHourAgo = currentTime.setHours(currentTime.getHours() - 1);
  const sixHoursAgo = currentTime.setHours(currentTime.getHours() - 6);
  const oneDayAgo = currentTime.setDate(currentTime.getDate() - 1);

  data.schedule.forEach((event) => {
    const eventTime = new Date(event.last);

    if (!event.emailDay && oneDayAgo <= currentTime) {
      emailModule.sendEmail('razhajamsiksyah@gmail.com', `No-Reply ${event.name}`, `Kelas Akan dimulai Pada ${event.last} ${event.content}`);
      event.emailDay = true;
    }

    if (!event.emailDay && sixHoursAgo <= eventTime) {
      emailModule.sendEmail('razhajamsiksyah@gmail.com', `No-Reply ${event.name}`, `Kelas Akan dimulai Pada ${event.last} ${event.content}`);
      event.emailSix = true;
    }

    if (!event.emailOne && oneHourAgo <= eventTime) {
      emailModule.sendEmail('razhajamsiksyah@gmail.com', `No-Reply ${event.name}`, `Kelas Akan dimulai Pada ${event.last} ${event.content}`);
      event.emailOne = true;
    }
  });

  fs.writeFileSync("database.json", JSON.stringify(data, null, 2));

  checkAndRemoveSchedule();
}

const sendMailInterval = setInterval(sendMail, 6000);


// Home
app.get("/", (req, res) => {
  const user = req.session.user;
  if (user) {
    const userData = {
      nim: user.nim,
      nama: user.nama,
      peringkat: user.peringkat,
      email: user.email,
      kelas: user.kelas,
    };
    res.render("home.ejs", { user: userData });
  } else {
    res.sendFile(__dirname + "/html/home.html");
  }
});

app.get("/login", (req, res) => {
  const user = req.session.user;
  if (user) {
  } else {
    res.render("login.ejs");
  }
});

// API
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = data.users.find(
    (u) => u.email === email && u.password === password
  );
  if (user) {
    req.session.user = user;
    res.redirect("/kelas");
  } else {
    res.send("Login failed");
  }
});

// Bagian Daftar Acount
app.post("/daftar", (req, res) => {
  const email = req.body.email;
  const name = req.body.name;
  const nim = req.body.nim;
  const namaKelas = req.body.nama_kelas;
  const password = req.body.password;

  data.users.push({
    nim: nim,
    nama: name,
    peringkat: "anggota",
    email: email,
    password: password,
    kelas: namaKelas,
  });

  fs.writeFileSync("database.json", JSON.stringify(data, null, 2));
  readData();
  const user = data.users.find(
    (u) => u.email === email && u.password === password
  );
  req.session.user = user;
  res.redirect("/");
});

app.get("/schedule/all", (req, res) => {
  readData();
  const filteredSchedule = data.schedule.filter(
    (entry) => entry.prioritas === "all"
  );
  res.json(filteredSchedule);
});

// Menangani Setia Kelas
app.get("/kelas", (req, res) => {
  const user = req.session.user;
  const message =
    "Maaf Akses Masuk Kelas Di Kunci,Kami Tidak dapat membutikkan kamu berasal dari kelas ini!";
  if (user) {
    res.redirect(`/kelas/${user.kelas}`);
  } else {
    res.render("response.ejs", { message: message });
  }
});

data.kelas.forEach((e) => {
  app.get(`/kelas/${e}`, (req, res) => {
    const user = req.session.user;
    const message =
      "Maaf Akses Masuk Kelas Di Kunci,Kami Tidak dapat membutikkan kamu berasal dari kelas ini!";
    if (user) {
      readData();
      const ptikCSchedule = data.schedule.filter(
        (entry) => entry.prioritas === "ptik-c"
      );
      const userData = {
        nama: user.nama,
        email: user.email,
        kelas: user.kelas,
      };
      res.render(`${e}.ejs`, { user: userData, schedule: ptikCSchedule });
    } else {
      res.render("response.ejs", { message: message });
    }
  });
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
    } else {
      res.redirect('/');
    }
  });
})

// Request Make Schedule
app.post("/create", (req, res) => {
  var today = new Date();
  var day = today.getDate();
  var month = today.getMonth() + 1;
  var year = today.getFullYear();
  var formattedDate = day + "-" + month + "-" + year;
  const user = req.session.user;
  const kelas = user.kelas;
  let { prioritas, last, tema, content } = req.body;
  last += ":00";
readData();
  data.schedule.push({
    "prioritas": prioritas,
    "create": formattedDate,
    "last": last,
    "tema": tema,
    "content": content,
    "kelas": kelas,
    "emailOne" :false,
    "emailSix" :false,
    "emailDay" :false
  });

  fs.writeFileSync("database.json", JSON.stringify(data, null, 2));
  res.redirect(`kelas/${kelas}`);
});
const port = 3000;
app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
