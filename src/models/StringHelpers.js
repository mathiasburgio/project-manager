module.exports.onlyAlphanumeric = (str, noSpaces = false) =>{
    str = str.replaceAll("á", "a");
    str = str.replaceAll("é", "e");
    str = str.replaceAll("í", "i");
    str = str.replaceAll("ó", "o");
    str = str.replaceAll("ú", "u");
    str = str.replaceAll("Á", "a");
    str = str.replaceAll("É", "e");
    str = str.replaceAll("Í", "i");
    str = str.replaceAll("Ó", "o");
    str = str.replaceAll("Ú", "u");
    str = str.replaceAll("ñ", "n");
    str = str.replaceAll("Ñ", "n");
    str = str.replace(/[^a-z0-9 -]/gi, '').toLowerCase().trim();
    if(noSpaces){
        return str.replaceAll(" ", "-")
    }else{
        return str
    }
}
module.exports.strToBd = (str, withTags = false) =>{
    try{
        if(str == null || !str){ str = ""; }
        if(!str){return str;}
        str = ("" + str);
        if(withTags == false){
            str = str.replace(/</g, "");
            str = str.replace(/>/g, "");
            str = str.replace(/%3c/g, "");
            str = str.replace(/%3e/g, "");
            str = str.replace(/%3C/g, "");
            str = str.replace(/%3E/g, "");
        }else{
            str = str.replace(/</g, "_3@@");
            str = str.replace(/>/g, "_4@@");
        }
        
        str = str.replace(/'/g, "_1@@");
        str = str.replace(/"/g, "_2@@");
        str = encodeURI(str);
        return str;
    }catch(err){
        return str;
    }
}
module.exports.bdToStr = (str, withTags = false) =>{
    if(str == null || !str){ str = ""; }
    try{
        if(!str){return str;}
        str = ("" + str);
        str = decodeURI(str);

        str = str.replace(/_1@@/g, "'");
        str = str.replace(/_2@@/g, '"');
        if(withTags === true){
            str = str.replace(/_3@@/g, "<");
            str = str.replace(/_4@@/g, '>');
        }
    }catch(ex){
        console.log(str, ex);
    }
    return str;
}
module.exports.validateString = (str, validator) =>{
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const telRegex = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/;

    if(validator == "email" || validator == "mail") return emailRegex.test(str);
    else if(validator == "uuid" || validator == "guid") return uuidRegex.test(str);
    else if(validator == "ip") return ipRegex.test(str);
    else if(validator == "tel" || validator == "phone") return telRegex.test(str) && str.length > 6 && str.length < 20;
    else return null;
}
const GET_UUID = () =>{
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {  
        var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);  
        return v.toString(16);  
    });  
}
module.exports.UUID = () => GET_UUID();
module.exports.GUID = () => GET_UUID();

module.exports.tryJson = (str) =>{
    try{
        str = ("" + str);
        if(typeof str == "string" && str[0] === "{") return JSON.parse(str)
    }catch(err){
        return null
    }
}
module.exports.getRandomString = (length= 8, characters= true, numbers= true) =>{
    let caracteres = ""; 
    if(characters) caracteres += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if(numbers) caracteres += '0123456789';
    
    let cadenaAleatoria = '';
    for (let i = 0; i < length; i++) {
        const indice = Math.floor(Math.random() * caracteres.length);
        cadenaAleatoria += caracteres.charAt(indice);
    }

    return cadenaAleatoria;
}