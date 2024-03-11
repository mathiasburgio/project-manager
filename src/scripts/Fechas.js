class Fechas{
    constructor(){
        this.FORMATO = {
            ARG_FULL: 1,
            ARG_FECHA: 2,
            ARG_HORA: 3,
            ARG_FECHA_HORA: 4,

            USA_FULL: 5,
            USA_FECHA: 6,
            USA_HORA: 7,
            USA_FECHA_HORA: 8,

            OBJECT: 9,
            OBJECT_INT: 10,
            ARRAY: 11,
            ARRAY_INT: 12
        };
        this.DAY_OF_WEEK = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
        this.MONTH_NAME = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    }
    parse({val = undefined, formato = 9}){
       
        let ff = {dia: "00", mes: "00", anio: "0000", hora: "00", minuto: "00", segundo: "00", milisegundo: "000"};

        if(typeof val == "string"){
            if(val.at(-1) == "Z"){
                return this.parse({val: new Date(val), formato: formato});
            }
            if( /\d{1,4}[-/]\d{1,2}[-/]\d{2,4}/.test(val) ){
                val = val.replaceAll("/", "-");
                let p1 = "";//parte de fecha
                let p2 = "";//parte de hora
                if(val.indexOf("T") > -1){ p1 = val.split("T")[0]; p2 = val.split("T")[1]; }
                if(val.indexOf(" ") > -1){ p1 = val.split(" ")[0]; p2 = val.split(" ")[1]; }
                if(p1 == ""){ p1 = val; }

                let _p1 = p1.split("-");
                if(_p1[0].length == 4){
                    ff.dia = ( _p1[2].length == 1 ? ("0" + _p1[2]) : _p1[2] );
                    ff.mes = ( _p1[1].length == 1 ? ("0" + _p1[1]) : _p1[1] );
                    ff.anio = _p1[0];
                }else if(_p1[2].length == 4){
                    ff.dia = ( _p1[0].length == 1 ? ("0" + _p1[0]) : _p1[0] );
                    ff.mes = ( _p1[1].length == 1 ? ("0" + _p1[1]) : _p1[1] );
                    ff.anio = _p1[2];
                }

                if(p2 != ""){
                    p2 = p2.replaceAll("Z", "").replaceAll(".", ":");
                    let _p2 = p2.split(":");
                    ff.hora = _p2[0];
                    ff.minuto = _p2[1];
                    if(_p2.length > 1){ ff.segundo = _p2[2]; }
                    if(_p2.length > 2){ ff.milisegundo = _p2[3]; }
                }
            }
        }else if(typeof val == "object"){//type Date
            //console.log(val);
            ff.anio = val.getFullYear().toString();
            ff.mes = (val.getMonth() + 1).toString();
            ff.dia = val.getDate().toString();
            ff.hora = val.getHours().toString();
            ff.minuto = val.getMinutes().toString();
            ff.segundo = val.getSeconds().toString();
            ff.milisegundo = val.getMilliseconds().toString();

            if(ff.mes.length == 1){ ff.mes = "0" + ff.mes; }
            if(ff.dia.length == 1){ ff.dia = "0" + ff.dia; }
            if(ff.hora.length == 1){ ff.hora = "0" + ff.hora; }
            if(ff.minuto.length == 1){ ff.minuto = "0" + ff.minuto; }
            if(ff.segundo.length == 1){ ff.segundo = "0" + ff.dia; }
        }
        
        if(formato == this.FORMATO.ARG_FULL){
            return ff.dia + "/" + ff.mes + "/" + ff.anio + " " + ff.hora + ":" + ff.minuto + ":" + ff.segundo + "." + ff.milisegundo;
        }else if(formato == this.FORMATO.ARG_FECHA){
            return ff.dia + "/" + ff.mes + "/" + ff.anio;
        }else if(formato == this.FORMATO.ARG_HORA){
            return ff.hora + ":" + ff.minuto;
        }else if(formato == this.FORMATO.ARG_FECHA_HORA){
            return ff.dia + "/" + ff.mes + "/" + ff.anio + " " + ff.hora + ":" + ff.minuto;
        }

        
        if(formato == this.FORMATO.USA_FULL){
            return ff.anio + "-" + ff.mes + "-" + ff.dia + " " + ff.hora + ":" + ff.minuto + ":" + ff.segundo + "." + ff.milisegundo;
        }else if(formato == this.FORMATO.USA_FECHA){
            return ff.anio + "-" + ff.mes + "-" + ff.dia;
        }else if(formato == this.FORMATO.USA_HORA){
            return ff.hora + ":" + ff.minuto;
        }else if(formato == this.FORMATO.USA_FECHA_HORA){
            return ff.anio + "-" + ff.mes + "-" + ff.dia + " " + ff.hora + ":" + ff.minuto;
        }

        if(formato == this.FORMATO.OBJECT){
            return ff;
        }

        if(formato == this.FORMATO.OBJECT_INT){
            for(let prop in ff){ff[prop] = parseInt(ff[prop]);}
            return ff;
        }

        if(formato == this.FORMATO.ARRAY){
            return Object.values(ff);
        }

        if(formato == this.FORMATO.ARRAY_INT){
            for(let prop in ff){ff[prop] = parseInt(ff[prop]);}
            return Object.values(ff);
        }

        return null;
    }
    toInputDatetime(v){
        let aux = fechas.parse({val: v || new Date(), formato: fechas.FORMATO.USA_FECHA_HORA});
        aux = aux.replaceAll(" ","T");
        return aux;
    }
    toInputDate(v){
        return fechas.parse({val: v || new Date(), formato: fechas.FORMATO.USA_FECHA});
    }
    timeToMs(str){
        let t = str.toString().split(":");
        return (Number(t[0]) * 60 * 60 * 1000) + (Number(t[1]) * 60 * 1000);
    }
    msToTime(str){
        let x = Number(str) / 60 /  60 / 1000;
        let h = parseInt(x);
        
        let decimales = x - h;
        let m = parseInt((decimales * 60).toFixed(6));
        if(h > 23){h = h - 24;}
        let r =  (h > 9 ? h : "0" + h) + ":" + (m > 9 ? m : "0" + m);
        return r;
    }
    diff_days(f1, f2){
        f1 = this.parse({val: f1, formato: this.FORMATO.ARG_FECHA});
        f2 = this.parse({val: f2, formato: this.FORMATO.ARG_FECHA});
        let aFecha1 = f1.split('/');
        let aFecha2 = f2.split('/');
        let fFecha1 = Date.UTC(aFecha1[2],aFecha1[1]-1,aFecha1[0]);
        let fFecha2 = Date.UTC(aFecha2[2],aFecha2[1]-1,aFecha2[0]);
        let dif = fFecha2 - fFecha1;
        let dias = Math.floor(dif / (1000 * 60 * 60 * 24));
        return dias;
    }
    days_in_month(year, month){
        return new Date(year, month, 0).getDate();
    }
    parse2(v = "", str = "USA_FULL"){
        if(!v){v = new Date();}
        return this.parse({ val: v, formato: this.FORMATO[str]});
    }
    lastDayOfMonth(anio, mes){
        let d = new Date(anio, mes + 1, 0);
        return d.getDate();
    }
    getAhora(hora = true){
        if(hora){
            return this.parse({val: new Date(), formato: this.FORMATO.ARG_FECHA_HORA});
        }else{
            return this.parse({val: new Date(), formato: this.FORMATO.USA_FECHA});
        }
    }
    getNow(hora = true){
        if(hora){
            return this.parse({val: new Date(), formato: this.FORMATO.USA_FECHA_HORA});
        }else{
            return this.parse({val: new Date(), formato: this.FORMATO.USA_FECHA});
        }
    }
}
if(typeof module != "undefined"){
    let f = new Fechas();
    module.exports = f;
}