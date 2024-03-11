const http = require("http");
const express = require("express");
const server = express();
const path = require("path");
const fsp = require("fs/promises");
const fs = require("fs");
const formidableMiddleware = require("express-formidable");
const session = require("express-session");
const FileStore = require('session-file-store')(session);
const cors = require("cors");
const morgan = require("morgan");
const favicon = require('serve-favicon');
const fechas = require("./src/scripts/Fechas");

require('dotenv').config({path:'./.env'});
server.use(cors())
if(process.env.NODE_ENV == 'development') server.use(morgan("dev"))

server.use(formidableMiddleware())
//SESIONES
server.use(session({
    secret: 'mateflix-carolina-herrera',
    resave: true,
    saveUninitialized: false,
    cookie: {
        maxAge : (86400 * 1000),//la sesion dura 24hs
        secure : !(process.env.NODE_ENV == 'development') // true ssl
    },
    store: new FileStore({logFn: function(){}})//loFn: ... es para q no joda buscando sessiones q han sido cerradas
}));

server.use( favicon( __dirname + "/src/resources/favicon.png" ) )

server.get("/ping", (req, res)=>{
    res.send("pong");
    res.end();
})


const projectManager = require("./src/models/ProjectManager");
projectManager.startTimerSysInfo();
projectManager.startTimerBackup();
server.use( projectManager.getRoutes() );

server.use("/scripts", express.static(__dirname + "/src/scripts"));
server.use("/resources", express.static(__dirname + "/src/resources"));


server.use((req, res, next) => {
    res.status(404).sendFile( path.join(__dirname, "src", "views", "404.html") )
})


const filesExist = fs.existsSync( path.join(__dirname, "files") );
if( !filesExist ) fs.mkdir( path.join(__dirname, "files"), ()=>{} );

const backupsExist = fs.existsSync( path.join(__dirname, "backups") );
if( !backupsExist ) fs.mkdir( path.join(__dirname, "backups"), ()=>{} );

const httpServer = http.createServer(server);
httpServer.listen(3005, () =>{
    console.log(`Listen 3005 # ${fechas.getNow(true)}`);
});