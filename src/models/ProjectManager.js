const { Router } = require("express");
const router = Router();
const path = require("path");
const fsp = require("fs/promises");
const fs = require("fs");
const si = require("systeminformation");

const { exec } = require('child_process');

const fechas = require("../scripts/Fechas");
const crypto = require("./Crypto");

const os = require('os');
const process = require('process');

const request = require("request");

//funcion y parametros para realizar respaldos
const _backup = {
    timer: null,
    interval: (1000 * 60 * 60 * 12),//12hs
    cache: [],
    fn: async ( cb ) =>{
        try{
            let fx = fechas.getNow(true).replaceAll(" ", "_").replaceAll(":", ".");
            let now = fechas.getNow(true);
    
            const fullpathApp = path.join(__dirname, "..", "..", "backups", `bdApp_${fx}.zip`);
            const comandoApp = `mongodump --db dbApp --gzip --archive=${fullpathApp}`;
            let ret1 = await EXEC(comandoApp);
            const fullpathAppEnc = await crypto.encryptFile(fullpathApp);
    
            const fullpathEmpresa = path.join(__dirname, "..", "..", "backups", `bdEmpresa_${fx}.zip`);
            const comandoEmpresa = `mongodump --db dbEmpresa --gzip --archive=${fullpathEmpresa}`;
            let ret2 = await EXEC(comandoEmpresa);
            const fullpathEmpresaEnc = await crypto.encryptFile(fullpathEmpresa);

            request.post({ 
                url: process.env.BACKUP_ENDPOINT, 
                formData: {
                    dbApp: fs.createReadStream(fullpathAppEnc),
                    dbEmpresa: fs.createReadStream(fullpathEmpresaEnc),
                } 
            }, async (error, response, body) => {
                console.log("Backup => " + fx );
                let backupsPath = path.join(__dirname, "..", "..", "backups");
                let files = await fsp.readdir(backupsPath);
                for(let f of files){
                    if(f != "." && f != ".."){
                        let filepath = path.join( backupsPath, f);
                        if(f.endsWith(".enc") == false){
                            await fsp.unlink( filepath );
                        }else{
                            let stats = await fsp.stat( filepath );
                            if(fechas.diff_days(stats.birthtime, now) > 30) await fsp.unlink( filepath )
                        }
                    }
                }

                if(error){
                    console.error('Error sending backup:', error);
                    if(cb) cb({ error: true, message: error.toString() });
                }else{
                    if(cb){
                        //a los archivos les concateno el ".enc" ya que la funcion path.parse().name me devuelve el nonbre del archivo y elimina la ext 
                        cb({ 
                            message: "ok", 
                            b1: path.parse(fullpathAppEnc).name + ".enc", 
                            b2: path.parse(fullpathEmpresaEnc).name + ".enc"
                        });
                    }
                }
            });
            
        }catch(err){
            console.log(err);
            if(cb) cb({ error: true, message: err.toString() });
        }
    }
}
const _sysInfo = {
    timer: null,
    interval: (1000 * 5),//5 segundos
    cache: [],
    fn: async () =>{
        const cpuData = await si.currentLoad();
        const ramData = await si.mem();
        _sysInfo.cache.push({
            fx: new Date(),
            cpu: cpuData.currentLoad.toFixed(2),
            usoRAM: ramData.used / 1024 / 1024
        });
    
        if(_sysInfo.cache.length > 100) _sysInfo.cache.shift();//borro el registro mas antiguo
    }
}
//ejecuta comandos bash
const EXEC = (comando) =>{
    return new Promise((resolve, reject)=>{ 
        exec(comando, (error, stdout, stderr) => {
            //console.log(error, stdout, stderr);
            if (error) {
                reject(error);
            } else {
                resolve(stdout);
            }
        })
    });
}
const requestAsync = (url, options) =>{
    return new Promise((resolve, reject)=>{
        request(url, options, (error, response, body)=>{
            if(error){
                reject(error)
            }else{
                resolve({response, body});
            }
        })
    })
}
//Verifica si es el usuario mathias
const CHECK_MATHIAS = (req) =>{
    if(req?.session?.email == "mathias.b@live.com.ar"){
        return true;
    }else{
        return false;
    }
}
//obtiene toda la informacion inicial
const GET_INFO = async (req, res) =>{
    let t0 = performance.now();
    let resp = {
        fx: fechas.getNow(true), 
        info: {},
        pm2: [],
        apps: [],
        companies: {},
        files: [],
        backups: []
    };
    try{
        if(!CHECK_MATHIAS(req)) throw "Usuario no válido.";

        const formatBytes = (bytes) =>{
            return Math.round(bytes / (1024 * 1024)) + "MB";
        }
        
        //info
        resp.info = {
            arch: os.arch(),
            cores: os.cpus().length,
            cpu_model: os.cpus()[0].model,
            total_memory: formatBytes(os.totalmem()),
            free_memory: formatBytes(os.freemem()),
            sys_info: _sysInfo.cache,
            sys_info_interval: _sysInfo.interval,
            backup_interval: _backup.interval,
            performance: -1
        };

        //PM2
        let respPM2 = await EXEC("pm2 jlist");
        if(typeof respPM2 == "string") respPM2 = JSON.parse(respPM2);
        respPM2.forEach(p=>{
            
            const uptimeSeconds = process.pm2_env ? process.pm2_env.axm_monitor.uptime : 0;
            const uptimeHours = Math.floor(uptimeSeconds / 3600);
            const uptimeMinutes = Math.floor((uptimeSeconds % 3600) / 60);

            //esta variable almacena el proyecto NODE que gestiona esta misma aplicacion
            const isProjectManager = (p.pm2_env.pm_cwd == path.join(__dirname, "..", ".."));
    
            resp.pm2.push({
                isProjectManager: isProjectManager,
                name: p.name,
                pid: p.pid,
                monit: p.monit,
                uptime: p.pm2_env.pm_uptime,
                uptime2: `${uptimeMinutes}Min`,
                restarts: p.pm2_env.restart_time,
                status: p.pm2_env.status,
            })
        })

        //APPS
        let respApps = await requestAsync("http://localhost:3000/app/panel/emprendimientos", {
            method: "POST",
            json: true,
            body: { PANEL_PRIVATE_KEY: process.env.PANEL_PRIVATE_KEY }
        })
        resp.apps = respApps.body || [];

        //COMPANIES
        let respCompanies = await requestAsync("http://localhost:3000/empresa/panel/emprendimientos", {
            method: "POST",
            json: true,
            body: { PANEL_PRIVATE_KEY: process.env.PANEL_PRIVATE_KEY }
        })
        resp.companies = respCompanies.body || [];


        //FILES
        resp.files = await fsp.readdir( path.join(__dirname, "..", "..", "files") );

        //BACKUPS
        resp.backups = await fsp.readdir( path.join(__dirname, "..", "..", "backups") );


        let t1 = performance.now();
        resp.performance = (t1 - t0).toFixed(2) + "ms";
        res.json(resp);
    }catch(err){
        res.json({error: true, message: err.toString()});
    }
}
const GET_PM2_STATUS = async(appName) =>{
    let respPM2 = await EXEC("pm2 jlist");
    if(typeof respPM2 == "string") respPM2 = JSON.parse(respPM2);
    let proy = respPM2.find(p=>p.name == appName);
    if(!proy) return;

    return {
        name: proy.name,
        pid: proy.pid,
        monit: proy.monit,
        restarts: proy.pm2_env.restart_time,
        status: proy.pm2_env.status,
    };
}
const GET_DIR_INFO = async(dirpath) =>{
    let files = fsp.readdir( dirpath );
    let ret = {};
    for(let file of files){
        if(file != "." && file != ".."){
            ret[file] = await fsp.stat( path.join(dirpath, file) );
        }
    }
    return ret;
}

//VIEWS
router.get(["/", "/index", "/index.html"], async(req, res)=>{
    res.sendFile( path.join(__dirname, "..", "views", "index.html") );
});
router.get(["/panel", "/panel.html"], (req, res)=>{
    if(!CHECK_MATHIAS(req)) throw "Usuario no válido.";
    res.sendFile( path.join(__dirname, "..", "views", "panel.html") );
});
router.get("/info", async(req, res)=>{
    GET_INFO(req, res);
})

let flagAntispam = false;
let startTimerAntispam = () =>{
    if(flagAntispam) return;
    flagAntispam = true;
    setTimeout(()=>{ flagAntispam = false; }, 1000 * 10);
}

//login / logout
router.post("/login", async(req, res)=>{
    try{
        
        if(flagAntispam) throw "Spam detectado.";
        startTimerAntispam();

        let email = (req.fields.email || "").toString();
        let password = (req.fields.password || "").toString();
        console.log({email, password})

        let comparacion1 = (email === process.env.EMAIL);
        let comparacion2 = await crypto.comparePasswordHash(password, process.env.PASSWORD);
        if(!comparacion1 || !comparacion2) throw "Combinacion no válida.";

        req.session.email = "mathias.b@live.com.ar";
        req.session.tlogin = fechas.getNow(true);
        req.session.save();

        res.json({login: true, url: "/panel.html"});
    }catch(err){
        res.json({error: true, message: err.toString()});
    }
})
router.post("/logout", async(req, res)=>{
    req.session.destroy();
    res.end();
})

//INFO
router.get("/status", async(req, res)=>{
    try{
        if(!CHECK_MATHIAS(req)) throw "Usuario no válido.";
    }catch(err){
        res.json({error: true, message: err.toString()});
    }
});
router.post("/make-backup", async(req, res)=>{
    try{
        if(!CHECK_MATHIAS(req)) throw "Usuario no válido.";
        _backup.fn(ret=>{
            res.json(ret);
        });
    }catch(err){
        res.json({error: true, message: err.toString()});
    }
});

//PM2
router.post("/pm2", async (req, res)=>{
    try{
        if(!CHECK_MATHIAS(req)) throw "Usuario no válido.";

        let proys = await EXEC("pm2 jlist");
        if(typeof proys == "string") proys = JSON.parse(proys);
        let proy = proys.find(p=>p.name == req.fields.appName);
        if(!proy) throw "Proyecto no encontrado";

        console.log({name: req.fields.appName, action: req.fields.action});
        let resp = null;
        const action = req.fields.action;
        if(action == "start"){
            await EXEC(`pm2 start ${req.fields.appName}`);
            resp = await GET_PM2_STATUS(req.fields.appName);
        }else if(action == "stop"){
            await EXEC(`pm2 stop ${req.fields.appName}`);
            resp = await GET_PM2_STATUS(req.fields.appName);
        }else if(action == "restart"){
            await EXEC(`pm2 restart ${req.fields.appName}`);
            resp = await GET_PM2_STATUS(req.fields.appName);
        }else if(action == "flush-logs"){
            await EXEC(`pm2 flush ${req.fields.appName}`);
        }else if(action == "get-log"){
            let log = await fsp.readFile(proy.pm2_env.pm_out_log_path, "utf-8");
            resp = log.split("\n").slice(-200).join("\n");
        }else if(action == "get-error-log"){
            let log = await fsp.readFile(proy.pm2_env.pm_err_log_path, "utf-8");
            resp = log.split("\n").slice(-200).join("\n");
        }
        res.json({message: "ok", resp});
    }catch(err){
        res.json({error: true, message: err.toString()});
    }
})

//FILES
router.get("/files/:fileName", async (req, res)=>{
    try{
        if(!CHECK_MATHIAS(req)) throw "Usuario no válido.";
        res.sendFile( path.join(__dirname, "..", "..", "files", req.params.fileName) );
    }catch(err){
        res.json({error: true, message: err.toString()});
    }
})

router.post("/files", async (req, res)=>{
    try{
        if(!CHECK_MATHIAS(req)) throw "Usuario no válido.";

        const files = await fsp.readdir( path.join(__dirname, "..", "..", "files") );
        if(!files.includes(req.fields.file)) throw "File not found";
        
        const file = path.join(__dirname, "..", "..", "files", req.fields.file);
        const action = req.fields.action;

        if(action == "rename"){
            if(files.includes(req.fields.newName)) throw "Ya existe un archivo con este nombre";
            let ret = await fsp.rename( file, path.join(__dirname, "..", "..", "files", req.fields.newName) );
        }else if(action == "delete"){
            let ret = await fsp.unlink( file );
        }else if(action == "decrypt"){
            if(flagAntispam) throw "Spam detectado.";
            let checkPassword = await crypto.comparePasswordHash(req.fields.password, process.env.PASSWORD);
            if(!checkPassword){
                startTimerAntispam();
                throw "Incorrect password. Wait 10 seconds";
            }
            let ret = await crypto.decryptFile( file );
        }
        res.json({message: "ok"});
    }catch(err){
        res.json({error: true, message: err.toString()});
    }
})
router.post("/files/upload", async(req, res)=>{
    try{
        if(!CHECK_MATHIAS(req)) throw "Usuario no válido.";

        let file = req.files.file;
        let dest = path.join(__dirname, "..", "..", "files", file.name);
        let ret = await fsp.copyFile( file.path, dest);
        res.json({message: "ok"});
    }catch(err){
        res.json({error: true, message: err.toString()});
    }
})

//APPS
router.post("/apps", async(req, res)=>{
    try{
        if(!CHECK_MATHIAS(req)) throw "Usuario no válido.";

        let body = {
            PANEL_PRIVATE_KEY: process.env.PANEL_PRIVATE_KEY,
            eid: req.fields.eid,
            action: req.fields.action
        };

        if(req.fields.action == "setVenc") body.newVenc = req.fields.newVenc;
        if(req.fields.action == "setPlan") body.newPlan = req.fields.newPlan;
        let resp = await requestAsync("http://localhost:3000/app/panel/accionar", {
            method: "POST",
            json: true,
            body: body
        }) 
        res.json(resp.body);
    }catch(err){
        res.json({error: true, message: err.toString()});
    }
});

//COMPANIES
router.post("/companies", async(req, res)=>{
    try{
        if(!CHECK_MATHIAS(req)) throw "Usuario no válido.";

        let body = { PANEL_PRIVATE_KEY: process.env.PANEL_PRIVATE_KEY };
        Object.assign(body, req.fields);
        
        delete body.password;
        let resp = await requestAsync("http://localhost:3000/empresa/panel/accionar", {
            method: "POST",
            json: true,
            body: body
        }) 
        //res.json(resp.body);
        res.json(resp.body);

    }catch(err){
        res.json({error: true, message: err.toString()});
    }
});
router.get("/companies/download-backup/:eid/:backup", async (req, res)=>{
    try{
        if(!CHECK_MATHIAS(req)) throw "Usuario no válido.";
        let body = { 
            PANEL_PRIVATE_KEY: process.env.PANEL_PRIVATE_KEY,
            eid: req.params.eid,
            backup: req.params.backup,
            action: "downloadBackup"
        };
        
        let resp = await requestAsync("http://localhost:3000/empresa/panel/accionar", {
            method: "POST",
            json: true,
            body: body
        });
        
        res.sendFile( resp.body.absolutePath );
    }catch(err){
        res.json({error: true, message: err.toString()});
    }
});
router.post("/companies/upload-update", async(req, res)=>{
    try{
        if(!CHECK_MATHIAS(req)) throw "Usuario no válido.";

        //temporalmente lo subo a la carpeta de files
        let file = req.files.update;
        let password = req.fields.password;
        let newPath = path.join(__dirname, "..", "..", "files", file.name);
        await fsp.copyFile(file.path, newPath);
        
        let body = { 
            PANEL_PRIVATE_KEY: process.env.PANEL_PRIVATE_KEY,
            updatePath: newPath,
            fileName: file.name,
            password: password,
            action: "uploadUpdate"
        };
        
        let resp = await requestAsync("http://localhost:3000/empresa/panel/accionar", {
            method: "POST",
            json: true,
            body: body
        });
        
        res.json( resp.body );

    }catch(err){
        res.json({error: true, message: err.toString()});
    }
})

module.exports.startTimerBackup = () =>{
    _backup.timer = setInterval(()=>{
        _backup.fn();
    }, _backup.interval);
}
module.exports.startTimerSysInfo = () =>{
    _sysInfo.fn();
    _sysInfo.timer = setInterval(()=>{
        _sysInfo.fn();
    }, _sysInfo.interval);
}
module.exports.getRoutes = () => router;

//test que verifica la recepcion de archivos de respaldo
router.post("/test-respaldo", async(req, res)=>{
    try{
        await fsp.copyFile(req.files.dbApp.path, path.join(__dirname, "..", "..", "archivos", req.files.dbApp.name));
        await fsp.copyFile(req.files.dbEmpresa.path, path.join(__dirname, "..", "..", "archivos", req.files.dbEmpresa.name));
    }catch(err){
        console.log(err);
    }
});

//NOTA: Previo a la restauracion se debe eliminar la coleccion con db.collection(${collectionName}).drop();
const restaurar = async (strPath, dbName) =>{
    try{
        const comandoDrop = `mongo --host 127.0.0.1 --port 27017 --eval "db.collection.drop()" ${dbName}`;
        let ret1 = await EXEC(comandoDrop);
        const comandoRestore = `mongorestore  --gzip --archive=${strPath}`;
        let ret2 = await EXEC(comandoRestore);
        return {drop: re1, restore: ret2};
    }catch(err){
        console.log(err);
    }
}
