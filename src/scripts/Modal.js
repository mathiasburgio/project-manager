var Modal = function(){
    /*
        ¿Como generar una COLA de modales?
        modal.mostrar({
            fnOcultar2 : function(){
                aquí ponemos la llamada al modal previo
            }
        })
    
    */
    var clase = this;
    this.config = undefined;
    this.iniciado = false;
    this.ret_value = undefined;//variable para clonar el fn(ret_value) en fnOcultar2(ret_value) 
    this.num = undefined;


    //modal botones validos : si | no | volver | aceptar | cerrar | cancelar | guardar | procesar

    this.ini = function(num){
        num = (typeof num == "undefined" ? "" : num);
        clase.num = num;
        let foo = ` <div id="modal${num}" data-backdrop="static" class="modal fade" tabindex="-1" role="dialog">
                        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" role="document">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title">Modal title</h5>
                                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                    </button>
                                </div>
                                <div class="modal-body">
                                    <div class="modal-cuerpo">
                                    
                                    </div>
                                </div>   
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                                    <button type="button" class="btn btn-primary">Save changes</button>
                                </div>
                            </div>
                        </div>
                    </div>`;
        $("body").append(foo);
        $(`#modal${clase.num}`).on('show.bs.modal', function (e) {
            if(clase.config && clase.config.fnMostrar){
                clase.config.fnMostrar();
            }
            var modal = this;
            var hash = modal.id;
            window.location.hash = hash;
            window.onhashchange = function() {
                if (!location.hash){
                    clase.ocultar();
                }
            }
        });
        $(`#modal${clase.num}`).on('shown.bs.modal', function (e) {
            if(clase.config && clase.config.fnMostrar2){
                clase.config.fnMostrar2();
            }
            if(clase.config && clase.config.focus){
                $(clase.config.focus).focus();
            }
        });
        $(`#modal${clase.num}`).on('hide.bs.modal', function (e) {
            if(clase.config && clase.config.fnOcultar){
                clase.config.fnOcultar(clase.ret_value);
            }
        });
        $(`#modal${clase.num}`).on('hidden.bs.modal', function (e) {
            if(clase.config && clase.config.fnOcultar2){
                clase.config.fnOcultar2(clase.ret_value);
            }
        });
        clase.iniciado = true;
    }
    this.mostrar = function(obj){
        if(clase.iniciado == false){clase.ini();}
        clase.ret_value = undefined;
        if(typeof obj == "undefined"){console.log("Falta objeto configurador.");return false;}
        if(obj == "help"){
            let foo2 = `obj = {
                header : bool,
                esc : bool (true),
                titulo | title : str,
                cuerpo | texto : str,
                pie | footer : str,
                botones : Array {text attr color cerrar(true|false)} || str (cerrar/aceptar | cerrar | no/si | aceptar | volver | cancelar/aceptar | cancelar/guardar ),
                tamano : str (modal-sm | modal-lg | modal-xl),
                fnMostrar : function //se dispara inmediatamente al mostrar,
                fnMostrar2 : function //se dispara cuando termina de mostrar,
                fnOcultar : function //se dispara inmediatamente al ocultar,
                fnOcultar2 : function //se dispara cuando termina de ocultar,
                fn : function //general que avisa que boton fue presionado del footer del modal,
                zindex : int //default = 1050,
                focus : stringQuery Dom
            }
            ¿Como generar una COLA de modales?
            modal.mostrar({
                fnOcultar2 : function(){
                    aquí ponemos la llamada al modal previo
                }
            })
            `;
            console.log(foo2);
            return false;
        }
        if(obj.titulo){
            $(`#modal${clase.num} .modal-header`).removeClass("d-none");
            $(`#modal${clase.num} .modal-title`).html(obj.titulo);
        }else{
            $(`#modal${clase.num} .modal-header`).addClass("d-none");
        }
        if(obj.header === false){
            $(`#modal${clase.num} .modal-header`).addClass("d-none");
        }

        if(obj.esc === false){
            $(`#modal${clase.num}`).attr("data-keyboard", "false");
        }else{
            $(`#modal${clase.num}`).removeAttr("data-keyboard");
        }

        if(obj.title){$(`#modal${clase.num} .modal-title`).html(obj.title);}
        if(obj.cuerpo){$(`#modal${clase.num} .modal-cuerpo`).html(obj.cuerpo);}//ojo la clase modal-cuerpo modal-body
        if(obj.texto){$(`#modal${clase.num} .modal-cuerpo`).html(obj.texto);}
        //if(obj.cuerpo){$(`#modal${clase.num} .modal-body`).html(obj.cuerpo);}
        //if(obj.texto){$(`#modal${clase.num} .modal-body`).html(obj.texto);}
        if(typeof obj.zindex == "undefined"){obj.zindex = 1050;}
        if(obj.botones){
            let foo_ = "";
            if(Array.isArray(obj.botones)){
                obj.botones.forEach(item=>{
                    foo_ += `<button type="button" class="btn btn-${item.color || "primary"}" ${item.attr} ${item.cerrar || item.close ? "data-dismiss='modal'" : ""}>${item.text}</button>`;
                });
            }else{
                let btn_ = [obj.botones];
                if(obj.botones.indexOf("-") != -1){btn_ = obj.botones.split("-");}
                if(obj.botones.indexOf("|") != -1){btn_ = obj.botones.split("|");}
                if(obj.botones.indexOf("/") != -1){btn_ = obj.botones.split("/");}
                if(obj.botones.indexOf(" ") != -1){btn_ = obj.botones.split(" ");}
    
                
                btn_.forEach((item)=>{
                    item = item.toString().toLowerCase();
                    if(item == "cerrar"){
                        foo_ += `<button type="button" style='width:100px' class="btn btn-outline-secondary" btCancelar >Cerrar</button>`;
                    }else if(item == "aceptar"){
                        foo_ += `<button type="button" style='width:100px' class="btn btn-primary" btAceptar >Aceptar</button>`;
                    }else if(item == "cancelar"){
                        foo_ += `<button type="button" style='width:100px' class="btn btn-outline-secondary" btCancelar >Cancelar</button>`;
                    }else if(item == "guardar"){
                        foo_ += `<button type="button" style='width:100px' class="btn btn-success" btGuardar >Guardar</button>`;
                    }else if(item == "volver"){
                        foo_ += `<button type="button" style='width:100px' class="btn btn-outline-secondary" btVolver >Volver</button>`;
                    }else if(item == "procesar"){
                        foo_ += `<button type="button" style='width:100px' class="btn btn-success" btProcesar >Procesar</button>`;
                    }else if(item == "si"){
                        foo_ += `<button type="button" style='width:100px' class="btn btn-primary" btSi >Si</button>`;
                    }else if(item == "no"){
                        foo_ += `<button type="button" style='width:100px' class="btn btn-danger" btNo >No</button>`;
                    }else if(item == "imprimir"){
                        foo_ += `<button type="button" style='width:100px' class="btn btn-warning" btImprimir >Imprimir</button>`;
                    }
                });
            }
            $(`#modal${clase.num} .modal-footer`).removeClass("d-none").html(foo_);
        }else{
            if(obj.pie || obj.footer){
                let aux = obj.pie;
                if(obj.footer){aux = obj.footer;}
                $(`#modal${clase.num} .modal-footer`).removeClass("d-none");
                $(`#modal${clase.num} .modal-footer`).html(aux);
            }else{
                $(`#modal${clase.num} .modal-footer`).addClass("d-none");
            }
        }
        if(obj.tamano){
            $(`#modal${clase.num} .modal-dialog`).addClass(obj.tamano);
        }else{
            $(`#modal${clase.num} .modal-dialog`).removeClass("modal-sm").removeClass("modal-lg").removeClass("modal-xl");
        }
        $(`#modal${clase.num}`).css("z-index", obj.zindex);
        if(obj.esperando === true){
            $(`#modal${clase.num} .modal-cuerpo`).append(`  <div class='loader text-center my-2'><div class="spinner-grow text-primary" role="status">
                                                    <span class="sr-only">Loading...</span>
                                                </div></div>`);
            $(`#modal${clase.num} .modal-footer`).addClass("d-none");
            $(`#modal${clase.num} .modal-header`).addClass("d-none");
        }

        $(`#modal${clase.num} [btCancelar]`).unbind("click");
        $(`#modal${clase.num} [btCancelar]`).click(()=>{
            clase.ret_value = "cancelar";
            clase.ocultar();
            if(obj.fn){obj.fn("cancelar");} 
        });
        $(`#modal${clase.num} [btGuardar]`).unbind("click");
        $(`#modal${clase.num} [btGuardar]`).click(()=>{
            clase.ret_value = "guardar";
            clase.ocultar();
            if(obj.fn){obj.fn("guardar");} 
        });
        $(`#modal${clase.num} [btCerrar]`).unbind("click");
        $(`#modal${clase.num} [btCerrar]`).click(()=>{
            clase.ret_value = "cerrar";
            clase.ocultar();
            if(obj.fn){obj.fn("cerrar");} 
        });
        $(`#modal${clase.num} [btAceptar]`).unbind("click");
        $(`#modal${clase.num} [btAceptar]`).click(()=>{
            clase.ret_value = "aceptar";
            clase.ocultar();
            if(obj.fn){obj.fn("aceptar");} 
        });
        $(`#modal${clase.num} [btSi]`).unbind("click");
        $(`#modal${clase.num} [btSi]`).click(()=>{
            clase.ret_value = true;
            clase.ocultar();
            if(obj.fn){obj.fn(true);} 
        });
        $(`#modal${clase.num} [btNo]`).unbind("click");
        $(`#modal${clase.num} [btNo]`).click(()=>{
            clase.ret_value = false;
            clase.ocultar();
            if(obj.fn){obj.fn(false);} 
        });

        $(`#modal${clase.num} [btVolver]`).unbind("click");
        $(`#modal${clase.num} [btVolver]`).click(()=>{
            clase.ret_value = "volver";
            clase.ocultar();
            if(obj.fn){obj.fn("volver");}
        });
        $(`#modal${clase.num} .modal-footer [btProcesar]`).unbind("click");
        $(`#modal${clase.num} .modal-footer [btProcesar]`).click(()=>{
            clase.ret_value = "procesar";
            clase.ocultar();
            if(obj.fn){obj.fn("procesar");}
        });

        $(`#modal${clase.num} .modal-footer [btImprimir]`).unbind("click");
        $(`#modal${clase.num} .modal-footer [btImprimir]`).click(()=>{
            clase.ret_value = "imprimir";
            //clase.ocultar();
            if(obj.fn){obj.fn("imprimir");}
        });

        clase.config = obj;
        $(`#modal${clase.num}`).modal("show");
        
    }
    this.ocultar = function(cb){
        $(`#modal${clase.num}`).modal("hide");
        if(cb){//sobreescribe fnOcultar2
            clase.config.fnOcultar2 = cb;
        }
    }
    this.ocultarAsync = () =>{
        return new Promise(resolve=>{
            $(`#modal${clase.num}`).modal("hide");
            clase.config.fnOcultar2 = () => resolve(true);
        });
    }
    this.esperando = function(obj){
        if(!obj){obj = {};}
        if(typeof obj == "string"){
            let aux = {};
            aux.titulo = "...";
            aux.cuerpo = obj;
            obj = aux;
        }
        if(!obj.titulo){obj.titulo = "...";}
        if(!obj.cuerpo){obj.cuerpo = "Cargando...";}

        clase.mostrar({
            titulo : obj.titulo,
            esperando : true,
            cuerpo : obj.cuerpo
        })
    }
    this.encadenar = (conf, tt) =>{
        clase.config.fnOcultar2 = ()=>{
            if(tt == "esperando"){
                clase.esperando(conf);
            }else if(tt == "mensaje"){
                if(typeof conf == "object"){conf = conf.cuerpo;}
                clase.mensaje(conf);
            }else{
                clase.mostrar(conf);
            }
        }
        clase.ocultar();
    }   
    this.mensaje = (cuerpo, callback) =>{
        clase.mostrar({
            titulo : "Mensaje",
            cuerpo : cuerpo,
            botones : "aceptar",
            fnMostrar2 : ()=>{
                $(`#modal${clase.num} [btAceptar]`).focus();
            },
            fnOcultar2: () =>{
                if(callback) callback();
            }
        });;
    } 
    this.prompt = ({label, value="", type="text", small="", keydown=null, keyup=null}) =>{
        return new Promise(resolve=>{
            let fox = `<div class='form-group'>
                <label>${label}</label>
                <input class='form-control' type='${type}'>
                <small class='text-muted'>${small}</small>
            </div>`
            this.mostrar({
                titulo: "...",
                cuerpo: fox,
                focus: "#modal input",
                botones:"volver/aceptar",
                fnOcultar2: e =>{
                    
                    if(e == "aceptar"){
                        let v = $("#modal input").val();
                        resolve(v)
                    }else{
                        resolve(null)
                    }
                }
            })

            if(value != null) $("#modal input").val(value)

            $("#modal input").keyup(ev=>{
                let v = $("#modal input").val();
                if(keyup) keyup(v, ev);
                if(ev.keyCode == 13){
                    $("#modal [btAceptar]").click();
                }
            }).keydown(ev=>{
                let v = $("#modal input").val();
                if(keydown) keydown(v, ev);
            })
        })
    }
    this.async_sino = async(txt, focus = null) =>{
        return new Promise(resolve=>{
            this.mostrar({
                titulo: "...",
                cuerpo: txt,
                botones: "no/si",
                fnMostrar2: e =>{
                    if(focus === true) $("#modal [btSi]").focus()
                    else if(focus === false) $("#modal [btNo]").focus()
                },
                fnOcultar2 : e =>{
                    resolve(e);
                }
            });
        })
    }
    this.async_esperando = async (txt) =>{
        return new Promise(resolve=>{
            this.mostrar({
                titulo: "...",
                cuerpo: txt,
                footer: false,
                fnMostrar2 : () =>{
                    resolve(true);
                }
            });
        })
    }
    this.ocultar_header = (e) =>{
        if(e){
            $(`#modal${clase.num} .modal-header`).addClass("d-none");
        }else{
            $(`#modal${clase.num} .modal-header`).removeClass("d-none");
        }
    }
    this.ocultar_footer = (e) =>{
        if(e){
            $(`#modal${clase.num} .modal-footer`).addClass("d-none");
        }else{
            $(`#modal${clase.num} .modal-footer`).removeClass("d-none");
        }
    }
    this.pregunta = (txt, focus) =>{
        return new Promise(resolve=>{
            this.mostrar({
                titulo: "Pregunta",
                cuerpo: txt,
                botones:"no/si",
                fnMostrar2: e =>{
                    if(focus === true){
                        $("#modal [btSi]").focus();
                    }else if(focus === false){
                        $("#modal [btNo]").focus();
                    }
                },
                fnOcultar2: e =>{
                    resolve(e);
                }
            })
        });
    }
    this.esperando2 = (txt) =>{
        return new Promise(resolve=>{
            clase.mostrar({
                titulo : false,
                esperando : true,
                cuerpo : txt,
                fnMostrar2: e =>{
                    resolve(true);
                }
            })
        })
    };
    this.setEsperando3 = (estado, txt = "") =>{
        $("#modal .modal-content .modal-esperando").remove();
        
        if(estado){
            document.activeElement.blur();
            let fox = `<div class="modal-esperando">
                            <div class='loader text-center my-2'>
                                <span class="my-3">${txt}</span>
                                <br>
                                <div class="spinner-grow text-primary" role="status">
                                    <span class="sr-only">Loading...</span>
                                </div>
                            </div>
                        </div>`;
            $("#modal .modal-content").append(fox);
            $("#modal .modal-content .modal-esperando")
            .css("position", "absolute")
            .css("top", "0")
            .css("left", "0")
            .css("width", "100%")
            .css("height", "100%")
            .css("background", "rgba(20,20,20,0.75)")
            .css("z-index", "20")
            .css("padding-top", "20px")
            .css("color", "white");
        }
    }
    this.addPopover = ({querySelector, type="message", callback=null, message="", label="myLabel", inputType="text", value=""}) =>{
        type = type.toLowerCase()
        $("#modal #popover-backdrop").remove();
        $("#modal .modal-content").append(`<div style='position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.2); z-index: 10;' id='popover-backdrop'></div>`)
        let element = querySelector instanceof jQuery ? querySelector : $(querySelector).first();
        element.popover("dispose")
        let v = null;
        
        element.popover({
            animation: true,
            container: "#modal .modal-body",
            html: true,
            placement: "auto",
            trigger: "manual",
            content: "..."
        })
        element.popover("show");
        element.css("position", "relative").css("z-index", 20);

        let html = "";
        if(type == "message"){
            html = `
            <div>
                <p>${message}</p>
                <div class='text-right'>
                    <button class='btn btn-sm btn-primary' name='popover-aceptar' tabindex="1">Aceptar</button>
                </div>
            </div>`;
            
        }else if(type=="yesno" || type == "noyes"){
            html = `
            <div>
                <p>${message}</p>
                <div class='text-right'>
                    <button class='btn btn-sm btn-danger' name='popover-no' style="width:50px">No</button>
                    <button class='btn btn-sm btn-primary ml-2' name='popover-si' style="width:50px">Si</button>
                </div>
            </div>`;
        }else if(type=="input"){
            html = `<div class='form-group'>
                <label>${label}</label>
                <input type='${inputType}' class='form-control' autocomplete="off" value=${value}>
            </div>
            <div class='text-right'>
                <button class='btn btn-sm btn-danger' name='popover-cancelar' style="width:100px">Cancelar</button>
                <button class='btn btn-sm btn-primary ml-2' name='popover-aceptar' style="width:100px">Aceptar</button>
            </div>`;
        }
        $("#modal .popover-body").html(html);
        

        $("#modal .popover input, #modal .popover button").keyup(ev=>{
            let jq = $(ev.currentTarget);
            if(ev.keyCode == 13){//enter
                v = $("#modal .popover input").val();
                if(jq.attr("name") == "popover-si") v = true
                if(jq.attr("name") == "popover-no") v = false
                element.popover("hide");
            }else if(ev.keyCode == 27){//escape
                ev.preventDefault();
                ev.stopPropagation();
                element.popover("hide");
                return false;
            }
        }).keydown(ev=>{
            if(ev.keyCode == 27){
                ev.preventDefault();
                ev.stopPropagation();
                element.popover("hide");
                return false;
            }
        });

        $("#modal .popover [name='popover-aceptar']").click(ev=>{
            v = $("#modal .popover input").val();
            element.popover("hide");
        });
        
        $("#modal .popover [name='popover-no']").click(ev=>{
            v = false;
            element.popover("hide");
        });
        $("#modal .popover [name='popover-si']").click(ev=>{
            v = true;
            element.popover("hide");
        });

        $("#modal .popover [name='popover-cancelar']").click(ev=>{
            element.popover("hide");
        });

        

        element.on('hidden.bs.popover', function () {
            $("#modal #popover-backdrop").remove();
            if(callback) callback(v);
        });
        element.on('shown.bs.popover', function () {
            if(type == "message") $("#modal .popover-body [name='popover-aceptar']").focus().select();
            if(type == "yesno") $("#modal .popover-body [name='popover-si']").focus().select();
            if(type == "input") $("#modal .popover-body input").focus().select();
        });
    }
    this.addAsyncPopover = (obj) =>{
        return new Promise(resolve=>{
            
            obj.callback = e =>{
                resolve(e)    
            }
            this.addPopover(obj)
        });
    }
}