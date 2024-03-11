const request = require("request");

var buffer = [];//buffer de validarAccion
module.exports.validarAccion = (id, accion, validas = 50) => {

    //borro todo excepto el ultimo minuto
    let time = new Date().getTime();
    let oneMinuteAgo = time - (1000 * 60);
    buffer = buffer.filter(item=>item.time > oneMinuteAgo);

    //verifico cant de coincidencias
    let coincidencias = buffer.filter(item=>item.id == id && item.accion == accion);
    if(coincidencias.length > validas) return false;//evito el SOBRE-SPAM

    buffer.push({
        id: id,
        accion: accion,
        time: time
    });
    
    if(coincidencias.length > validas) return false;
    return true;
}
//module.exports.getIp = (req) => (req && req.headers['x-forwarded-for']) || (req && req.socket.remoteAddress);
module.exports.getIp = (req) => req.connection.remoteAddress;
module.exports.validarHcaptcha = (response) =>{
    return new Promise(resolve=>{
        if(process.env.NODE_ENV == "development"){ resolve(true); return; }
        const secret_key = process.env.HCATPCHA_SECRET_KEY;
        const url = `https://api.hcaptcha.com/siteverify?secret=${secret_key}&response=${response}`;
        
        request(url, function(error, response, body) {
            if(error) console.log("hcaptcha-error:", error);
            body = JSON.parse(body);
            resolve( body.success );
        });
    })
}
module.exports.validarRecaptcha = (response) =>{
    return new Promise(resolve=>{
        if(process.env.NODE_ENV == "development"){ resolve(true); return; }
        const secret_key = process.env.RECAPTCHA_SECRET_KEY;
        const url = `https://www.google.com/recaptcha/api/siteverify?secret=${secret_key}&response=${response}`;
        
        request(url, function(error, response, body) {
            body = JSON.parse(body);
            resolve( body.success );
        });
    })
}
module.exports.validEmail = (email) =>{
    let whitelist = [ "@hotmail.", "@gmail.", "@live.", "@yahoo.", "@outlook.", "@msn.", "@aol.", "@ymail.", "@googlemail.", "@facebook."];
    let encontro = whitelist.find(ex=> email.indexOf(ex) != -1);
    return encontro ? true : false;
}