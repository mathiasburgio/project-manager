const crypto = require('crypto');
const bcrypt = require("bcrypt");
const fs = require("fs");

const crypto_options = {
    algorithm: 'aes-256-cbc',
    ENC_KEY : process.env.CYPHER_KEY,
    IV : process.env.CYPHER_IV
};

module.exports.encryptString = (val) => {
    val = val.toString().trim();
    if(val == ""){return "";}
    let cipher = crypto.createCipheriv(crypto_options.algorithm, crypto_options.ENC_KEY, crypto_options.IV);
    let encrypted = cipher.update(val, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted + "__ENC__";
};
module.exports.decryptString = (val) => {
    val = val.toString().trim();
    if(val.substring(val.length - 7) == "__ENC__"){
        val = val.substring(0,val.length - 7);
        if(val == ""){return "";}
        let decipher = crypto.createDecipheriv(crypto_options.algorithm, crypto_options.ENC_KEY, crypto_options.IV);
        let decrypted = decipher.update(val, 'base64', 'utf8');
        return (decrypted + decipher.final('utf8'));
    }else{
        return "";
    }
};
module.exports.getPasswordHash = async function(field_password){
    let salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(field_password, salt);
}
module.exports.comparePasswordHash = async function(field_password, bd_password){
    return await bcrypt.compare(field_password, bd_password);
}

module.exports.encryptFile = (filePath) =>{
    return new Promise((resolve, reject)=>{
        const cipher = crypto.createCipheriv(crypto_options.algorithm, Buffer.from(crypto_options.ENC_KEY), crypto_options.IV);
        
        const inputStream = fs.createReadStream(filePath);
        const outputStream = fs.createWriteStream(filePath + ".enc");
    
        inputStream.pipe(cipher).pipe(outputStream);
    
        outputStream.on('finish', () => {
            resolve(filePath + ".enc");
        });
        
        outputStream.on('error', (err) => {
            console.error('Error al encriptar el archivo:', err);
            reject(err);
        });
    })

} 
module.exports.decryptFile = (filePath) =>{
    return new Promise((resolve, reject)=>{
        const decipher = crypto.createDecipheriv(crypto_options.algorithm, Buffer.from(crypto_options.ENC_KEY), crypto_options.IV);
        
        let oldfullpath = filePath.substring(0, filePath.length -4);
        const inputStream = fs.createReadStream(filePath);
        const outputStream = fs.createWriteStream(oldfullpath);
    
        inputStream.pipe(decipher).pipe(outputStream);
    
        outputStream.on('finish', () => {
            resolve(oldfullpath);
        });
        
        outputStream.on('error', (err) => {
            console.error('Error al desencriptar el archivo:', err);
            reject(err);
        });
    })
} 