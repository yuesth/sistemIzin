var path = require("path");
var cheerio = require("cheerio");
var app = require("express")();
var express = require("express");
var bodyParser = require("body-parser");
var session = require("express-session");
var mongo = require("./mongo.js");
var client = mongo.mongoClient;
var uri = mongo.uri;
var fire = require("./fire.js");
var fire2 = fire.configFb;
var auth = fire2.auth();
var nm = require('nodemailer');


app.use(
    session({
        secret: "yuestadrikh",
    })
);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static("public"));
app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "hbs");

// ----------------------------------------------------------MIDDLEWARE

app.get("/login", (req, res) => {
    if (req.session.home || req.session.homeadmin) {
        res.redirect("/home");
    } else {
        res.render("login");
    }
});

app.post("/login", (req, res) => {
    if (req.session.home || req.session.homeadmin) {
        res.redirect("/home");
    }
    auth
        .signInWithEmailAndPassword(req.body.email, req.body.passwd)
        .then((pengguna) => {
            client.connect(uri, { useUnifiedTopology: true }, (err, client) => {
                var username = "", role = "";
                const cursor = client.db('sistemizin').collection('users').find({
                    userAuth: pengguna.user.uid
                }).project({ role: 1, username: 1, _id: 0 });
                cursor.forEach(obj => {
                    username = obj.username;
                    role = obj.role;
                    if (role == "admin") {
                        req.session.homeadmin = "wzady2221";
                        req.session.Unamehomeadmin = username;
                        res.redirect("/homeadmin");
                    } else {
                        req.session.Unamehome = username;
                        req.session.home = "wzady3576";
                        res.redirect("/home");
                    }
                });
            });
        })
        .catch(function (err) {
            res.render("login", {
                errMessageLogin: err,
            });
        });
});

// -------------------------------------------------------LOGIN/REGISTER

app.get("/register", (req, res) => {
    if (req.session.home || req.session.homeadmin) {
        res.redirect("/home");
    } else {
        res.render("register");
    }
});

function scrapData(reqq) {
    var kodemat = [], namamat = [], sksmat = [], dosenmat = [], jadwalmat = [], kelasmat = [], temp, matkul = [];
    var re = /ILKOM-A|ILKOM-B|ILKOM-IUP-A|ILKOM-IUP-B|ILKOM-IUP|ELIN-A|ELINS-B/i;
    var rep = /ILKOM-A1|ILKOM-A2|ILKOM-A3|ILKOM-A4/i;
    var rem = /ILKOM-IUP|ILKOM|ELINS|ILKOM-A|ILKOM-B|ILKOM-REG-IUP/i;
    var reu = /MIPA|ILKOM|ILKOM-IUP|ILKOM-REG-IUP/i;
    var remat = /Kal 10|Kal 2|Kal 3|Kal 4|Kal 5|Kal 6|Kal 7|Kal 8|Kal 9|Kal 1|Kal IUP A|Kal IUP B/i;
    var refis = /1|2|3|4|5|6|7|8|IUP-1|IUP-2/i
    var vps = reqq;
    var $ = cheerio.load(vps);
    $('div.row:nth-of-type(2) div.panel-body div.table-light table.table tbody tr').each((i, value) => {
        kodemat[i] = $(value).find('td:nth-of-type(2)').text().trim();
        namamat[i] = $(value).find('td:nth-of-type(3)').text().trim();
        sksmat[i] = $(value).find('td:nth-of-type(4)').text().trim();
        dosenmat[i] = $(value).find('td:nth-of-type(6)').text().trim();
        jadwalmat[i] = $(value).find('td:nth-of-type(7)').text().trim();
        temp = $(value).find('td:nth-of-type(3)').text().trim();
        if (temp.includes('PRAKT') == true) {
            kelasmat[i] = temp.match(rep);
        }
        else if (kodemat[i].charAt(3) == 4) {
            kelasmat[i] = temp.match(rem);
        }
        else if (kodemat[i].charAt(0) == "U") {
            kelasmat[i] = temp.match(reu);
        }
        else if (kodemat[i].charAt(1) == "M") {
            kelasmat[i] = temp.match(remat);
        }
        else if (kodemat[i].charAt(1) == "F") {
            kelasmat[i] = temp.match(refis);
        }
        else {
            kelasmat[i] = temp.match(re);
        }
        matkul[i] = {
            kodematkul: kodemat[i],
            namamatkul: namamat[i],
            kelasmatkul: kelasmat[i],
            sksmatkul: sksmat[i],
            dosenmatkul: dosenmat[i],
            jadwalmatkul: jadwalmat[i]
        };
    });
    return matkul;
}

app.post("/register", (req, res) => {
    if (req.session.home || req.session.homeadmin) {
        res.redirect("/home");
    } else {
        auth
            .createUserWithEmailAndPassword(
                req.body.emailSignup,
                req.body.passwdSignup
            ).then((user) => {
                var getScrapData = scrapData(req.body.vpsSignup);
                client.connect(uri, { useUnifiedTopology: true }, (err, client) => {
                    client.db('sistemizin').collection('users').insertOne({
                        userAuth: user.user.uid,
                        fullname: req.body.fullnameSignup,
                        username: req.body.usernameSignup,
                        email: req.body.emailSignup,
                        passwd: req.body.passwdSignup,
                        nim: req.body.nimSignup,
                        prodi: req.body.prodiSignup,
                        smt: req.body.smtSignup,
                        role: 'user',
                        matkul: getScrapData
                    }).then(() => {
                        client.db('sistemizin').collection('izin').insertOne({
                            userAuth: user.user.uid,
                            aktifIzin: false,
                            dataIzin: []
                        });
                        req.session.Unamehome = req.body.usernameSignup;
                        req.session.home = "wzady3576";
                        res.redirect("/home");
                    })
                });
            })
            .catch(function (err) {
                res.render("register", {
                    errMessageSignup: err,
                });
            });
    }
});

// --------------------------------------------------------------REGISTER/HOME

app.get("/home", (req, res) => {
    if (!req.session.home) {
        res.redirect("/login");
    } else {
        var user = auth.currentUser;
        const dataHome = async (user) => {
            await client.connect(uri, { useUnifiedTopology: true }, (err, client) => {
                const getUser = client.db('sistemizin').collection('users').find({ userAuth: user.uid });
                getUser.forEach(obj => {
                    res.render('home', {
                        username: obj.username,
                        fullname: obj.fullname,
                        email: obj.email,
                        prodi: obj.prodi,
                        nim: obj.nim,
                        smt: obj.smt,
                        matkul: obj.matkul
                    })
                })
            })
        };
        dataHome(user);
    }
});

app.get('/home/:namamatkul/:kodematkul/:kelasmatkul/:dosenmatkul', (req, res) => {
    if (!req.session.home) {
        res.redirect('/login');
    }
    else {
        var user = auth.currentUser;
        const dataTimeline = async (user) => {
            await client.connect(uri, { useUnifiedTopology: true }, (err, client) => {
                // const getUser = client.db('sistemizin').collection('users').find({ userAuth: user.uid });
                const getIzin = client.db('sistemizin').collection('izin').find({ userAuth: user.uid });
                getIzin.forEach(obj1 => {
                    var idx;
                    if (obj1.aktifIzin == true) {
                        for (var j = 0; j < obj1.dataIzin.length; j++) {
                            if (obj1.dataIzin[j].kodematkulIzin == req.params.kodematkul) {
                                idx = j;
                                break;
                            }
                        }
                        if (idx == null) {
                            const getUser = client.db('sistemizin').collection('users').find({ userAuth: user.uid });
                            getUser.forEach(obj2 => {
                                res.render('timeline', {
                                    username: req.session.Unamehome,
                                    fullname: obj2.fullname,
                                    nim: obj2.nim,
                                    namamatkul: req.params.namamatkul,
                                    kodematkul: req.params.kodematkul,
                                    kelasmatkul: req.params.kelasmatkul,
                                    dosenmatkul: req.params.dosenmatkul,
                                });
                            })
                        }
                        else {
                            if (obj1.dataIzin[idx].statusDosenform) {
                                res.render('timeline', {
                                    username: req.session.Unamehome,
                                    fullname: obj1.dataIzin[idx].namaIzin,
                                    nim: obj1.dataIzin[idx].nimIzin,
                                    namamatkul: req.params.namamatkul,
                                    kodematkul: req.params.kodematkul,
                                    kelasmatkul: req.params.kelasmatkul,
                                    dosenmatkul: req.params.dosenmatkul,
                                    warna_isiform: 'rgb(92,184,92)',
                                    belum_isiform: 'none',
                                    sudah_isiform: 'block',
                                    warna_uploadform: 'rgb(92,184,92)',
                                    belum_uploadform: 'none',
                                    sudah_uploadform: 'block',
                                    warna_dosenform: 'rgb(92,184,92)',
                                    belum_dosenform: 'none',
                                    sudah_dosenform: 'block',
                                    time_isiform: obj1.dataIzin[idx].timeIsiform,
                                    time_uploadform: obj1.dataIzin[idx].timeUploadform,
                                    time_dosenform: obj1.dataIzin[idx].timeDosenform,
                                });
                            }
                            else if (obj1.dataIzin[idx].statusUploadform) {
                                res.render('timeline', {
                                    username: req.session.Unamehome,
                                    fullname: obj1.dataIzin[idx].namaIzin,
                                    nim: obj1.dataIzin[idx].nimIzin,
                                    namamatkul: req.params.namamatkul,
                                    kodematkul: req.params.kodematkul,
                                    kelasmatkul: req.params.kelasmatkul,
                                    dosenmatkul: req.params.dosenmatkul,
                                    warna_isiform: 'rgb(92,184,92)',
                                    belum_isiform: 'none',
                                    sudah_isiform: 'block',
                                    warna_uploadform: 'rgb(92,184,92)',
                                    belum_uploadform: 'none',
                                    sudah_uploadform: 'block',
                                    belum_dosenform: 'block',
                                    sudah_dosenform: 'none',
                                    time_isiform: obj1.dataIzin[idx].timeIsiform,
                                    time_uploadform: obj1.dataIzin[idx].timeUploadform,
                                });
                            }
                            else if (obj1.dataIzin[idx].statusIsiform) {
                                res.render('timeline', {
                                    username: req.session.Unamehome,
                                    fullname: obj1.dataIzin[idx].namaIzin,
                                    nim: obj1.dataIzin[idx].nimIzin,
                                    namamatkul: req.params.namamatkul,
                                    kodematkul: req.params.kodematkul,
                                    kelasmatkul: req.params.kelasmatkul,
                                    dosenmatkul: req.params.dosenmatkul,
                                    warna_isiform: 'rgb(92,184,92)',
                                    belum_isiform: 'none',
                                    sudah_isiform: 'block',
                                    belum_uploadform: 'block',
                                    sudah_uploadform: 'none',
                                    belum_dosenform: 'block',
                                    sudah_dosenform: 'none',
                                    time_isiform: obj1.dataIzin[idx].timeIsiform,
                                });
                            }
                        }
                    }
                    else {
                        const getUser = client.db('sistemizin').collection('users').find({ userAuth: user.uid });
                        getUser.forEach(obj3 => {
                            res.render('timeline', {
                                username: req.session.Unamehome,
                                fullname: obj3.fullname,
                                nim: obj3.nim,
                                namamatkul: req.params.namamatkul,
                                kodematkul: req.params.kodematkul,
                                kelasmatkul: req.params.kelasmatkul,
                                dosenmatkul: req.params.dosenmatkul,
                            });
                        })
                    }
                });
            });
        }
        dataTimeline(user);
    }
});

app.post('/home/isiform/:namamatkul/:kodematkul/:kelasmatkul/:dosenmatkul', (req, res) => {
    if (!req.session.home) {
        res.redirect('login')
    }
    else {
        var user = auth.currentUser;
        const mulaiIzin = async (user) => {
            var tanggal = new Date().getDate() + "-" + new Date().getMonth() + "-" + new Date().getFullYear();
            var waktu = new Date().getHours() + "." + new Date().getMinutes();
            var data = {
                namamatkulIzin: req.params.namamatkul,
                kelasmatkulIzin: req.params.kelasmatkul,
                kodematkulIzin: req.params.kodematkul,
                dosenmatkulIzin: req.params.dosenmatkul,
                namaIzin: req.body.namaa,
                nimIzin: req.body.nimm,
                inputperluIzin: req.body.inputperlu,
                tanggalIzin: new Date(req.body.inputdate),
                durasiIzin: req.body.inputdurasi,
                timeIsiform: tanggal + "," + waktu,
                statusIsiform: "active"
            };
            await client.connect(uri, { useUnifiedTopology: true }, (err, client) => {
                client.db('sistemizin').collection('izin').updateOne({ userAuth: user.uid }, {
                    $set: { aktifIzin: true }, $addToSet: { dataIzin: data }
                });
            });
            res.redirect('/home/' + req.params.namamatkul + '/' + req.params.kodematkul + '/' + req.params.kelasmatkul + '/' + req.params.dosenmatkul);
        };
        mulaiIzin(user);
    };
});

app.post('/home/uploadform/:namamatkul/:kodematkul/:kelasmatkul/:dosenmatkul', (req, res) => {
    if (!req.session.home) {
        res.redirect('login')
    }
    else {
        var user = auth.currentUser;
        const mulaiIzin = async (user) => {
            var tanggal2 = new Date().getDate() + "-" + new Date().getMonth() + "-" + new Date().getFullYear();
            var waktu2 = new Date().getHours() + "." + new Date().getMinutes();
            waktu = tanggal2 + "," + waktu2;
            await client.connect(uri, { useUnifiedTopology: true }, (err, client) => {
                const getIzin = client.db('sistemizin').collection('izin').find({ userAuth: user.uid });
                getIzin.forEach(obj => {
                    var idx;
                    for (var j = 0; j < obj.dataIzin.length; j++) {
                        if (obj.dataIzin[j].kodematkulIzin == req.params.kodematkul) {
                            idx = j;
                            break;
                        }
                    }
                    client.db('sistemizin').collection('izin').updateOne({ userAuth: user.uid }, {
                        $set: { [`dataIzin.${idx}.timeUploadform`]: waktu, [`dataIzin.${idx}.statusUploadform`]: "active" }
                    });
                });
            })
            res.redirect('/home/' + req.params.namamatkul + '/' + req.params.kodematkul + '/' + req.params.kelasmatkul + '/' + req.params.dosenmatkul);
        };
        mulaiIzin(user);
    };
});

var rand, host, link;
app.post('/home/dosenform/:namamatkul/:kodematkul/:kelasmatkul/:dosenmatkul', (req, res) => {
    if (!req.session.home) {
        res.redirect('login')
    }
    else {
        rand = Math.floor((Math.random() * 100000000) + 54);
        host = req.get('host');
        link = "http://" + req.get('host') + "/verify" + "/" + req.params.namamatkul + "/" + req.params.kodematkul + "/" + req.params.kelasmatkul + "/" + req.params.dosenmatkul + "?id=" + rand;
        var user = auth.currentUser;
        const mulaiIzin = async (user) => {
            var tanggal3 = new Date().getDate() + "-" + new Date().getMonth() + "-" + new Date().getFullYear();
            var waktu3 = new Date().getHours() + "." + new Date().getMinutes();
            waktu = tanggal3 + "," + waktu3;
            var transport = nm.createTransport({
                host: 'smtp.gmail.com',
                port: 465,
                secure: true,
                auth: {
                    user: 'yues.963@gmail.com',
                    pass: 'Wzady3576'
                }
            });
            await client.connect(uri, { useUnifiedTopology: true }, (err, client) => {
                const getIzin = client.db('sistemizin').collection('izin').find({ userAuth: user.uid });
                getIzin.forEach(obj => {
                    var idx;
                    for (var j = 0; j < obj.dataIzin.length; j++) {
                        if (obj.dataIzin[j].kodematkulIzin == req.params.kodematkul) {
                            idx = j;
                            break;
                        }
                    }
                    let mailOptions = {
                        from: '"SistemIzin" <sistemizin@ugm.ac.id>',
                        to: "alrasyidharun308@gmail.com",
                        subject: "<no-reply> Verifikasi izin mahasiswa",
                        html: `<table class="container" cellspacing="0" cellpadding="0">\
                        <tr>\
                            <td>\
                                <h2>SistemIzin Mahasiswa</h2>\
                                <p class="preheader" style:float:right;>`+ new Date().toDateString() + `</p>\
                                <div class="wrapper">\
                                    <p class="text margin">Salam Hormat,</p> \
                                    <p>Dengan ini kami sampaikan bahwa: </p> \
                                    <p>Nama:`+ obj.dataIzin[idx].namaIzin + `</p>\
                                    <p>NIU:`+ obj.dataIzin[idx].nimIzin + `</p>\
                                    <p>Berhalangan hadir pada kelas mata kuliah <strong>`+ obj.dataIzin[idx].namamatkulIzin + `</strong> kelas <strong>` + obj.dataIzin[idx].kelasmatkulIzin + `</strong> dikarenakan alasan <strong>` + obj.dataIzin[idx].inputperluIzin + `,</strong>\
                                    dimulai dari tanggal <strong>`+ obj.dataIzin[idx].tanggalIzin + ` selama ` + obj.dataIzin[idx].durasiIzin + ` hari</strong>. Harap dimaklumi, dan atas perhatiannya, kami ucapkan terima kasih.</p>\
                                    <p>Berikut ini kami lampirkan attachment surat fisik sebagai tanda bukti.</p>\
                                    <p>Dimohon untuk klik link di bawah ini, ketika dosen menyetujui izin mahasiswa.</p><br>\
                                    <a href="http://${host}/verify/${req.params.namamatkul}/${req.params.kodematkul}/${req.params.kelasmatkul}/${req.params.dosenmatkul}?id=${rand}">${link}</a>\
                                </div>\
                            </td>\
                        </tr>\
                    </table>`,
                    }
                    transport.sendMail(mailOptions, (err, resp) => {
                        if (err) console.log("error sending email dosen");
                        else {
                            resp.end('sent')
                            console.log("success sending email dosen")
                        }
                    });
                });
            })
            res.redirect('/home/' + req.params.namamatkul + '/' + req.params.kodematkul + '/' + req.params.kelasmatkul + '/' + req.params.dosenmatkul);
        };
        mulaiIzin(user);
    };
});

app.get('/verify/:namamatkul/:kodematkul/:kelasmatkul/:dosenmatkul', (req, res) => {
    var user = auth.currentUser;
    const mulaiverify = async (user) => {
        console.log("host: "+host);
        console.log('protocol verify: '+req.protocol);
        console.log("host verify: "+req.get("host"));
        if ((req.protocol + "://" + req.get('host')) == ("http://" + host)) {
            console.log("Domain sama");
            if (req.query.id == rand) {
                console.log("email terverifikasi");
                client.connect(uri, { useUnifiedTopology: true }, (err, client) => {
                    const getIzin = client.db('sistemizin').collection('izin').find({ userAuth: user.uid });
                    getIzin.forEach(obj => {
                        var idx;
                        for (var j = 0; j < obj.dataIzin.length; j++) {
                            if (obj.dataIzin[j].kodematkulIzin == req.params.kodematkul) {
                                idx = j;
                                break;
                            }
                        }
                        client.db('sistemizin').collection('izin').updateOne({ userAuth: user.uid }, {
                            $set: { [`dataIzin.${idx}.timeDosenform`]: waktu, [`dataIzin.${idx}.statusDosenform`]: "active" }
                        });
                    })
                });
                res.redirect('/home/' + req.params.namamatkul + '/' + req.params.kodematkul + '/' + req.params.kelasmatkul + '/' + req.params.dosenmatkul);
            }
            else {
                console.log("email is not verified");
                res.end("<h1>Bad Request</h1>");
            }
        }
        else {
            res.end("<h1>Request is from unknown source");
        }
    }
    mulaiverify(user);
})

app.get('/riwayat', (req, res) => {
    if (!req.session.home) {
        res.redirect("login");
    } else {
        var user = auth.currentUser;
        const mulaiRiwayat = async (user) => {
            client.connect(uri, { useUnifiedTopology: true }, (err, client) => {
                const getRiwayat = client.db('sistemizin').collection('izin').find({ userAuth: user.uid });
                getRiwayat.forEach(obj => {
                    res.render("riwayat", {
                        username: req.session.Unamehome,
                        matkulIzin: obj.dataIzin
                    });

                })
            })
        }
        mulaiRiwayat(user);
    }
})

app.get("/homeadmin", (req, res) => {
    if (!req.session.homeadmin) {
        res.redirect("login");
    } else {
        res.render("homeadmin", {
            sessadmin: req.session.homeadmin,
            sess: req.session.home
        });
    }
});

app.get("/logout", (req, res) => {
    auth.signOut().then(() => {
        req.session.destroy(function (err) {
            res.redirect("/login");
        });
    });
});
module.exports.app = app;