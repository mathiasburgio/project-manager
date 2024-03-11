
class ProjectManager{
    constructor(){
        this.info = null;//info general devuelta por el servidor

        this.getInfo();

        $("[name='logout']").click(async()=>{
            let resp = await modal.pregunta("¿Confirm LOGOUT?")
            if(!resp) return;
            let ret = await $.post({url: "/logout"});
            window.location.href = "https://mateflix.app";
        })

        $("#info [name='makeBackup']").click(async (ev)=>{
            await modal.esperando2("Making backup...");
            let ele = $(ev.currentTarget);
            ele.prop("disabled", true);
            let resp = await $.post({url: "/make-backup"});
            console.log(resp);
            modal.ocultar(()=>{
                if(resp.error){
                    modal.mensaje(resp.message);
                }else{
                   modal.mensaje("The backups appear after refresh");
                }
            })
        });

        $("#apps [type='search']").keyup(ev=>{
            this.filterApps();
        })

        $("#apps [type='checkbox']").change(ev=>{
            this.filterApps();
        })
        $("#companies [type='search']").keyup(ev=>{
            this.filterCompanies();
        })

        $("#companies [name='newCompany']").click(ev=>{
            this.modalCompany(null);
        });
        $("#companies [name='updates']").click(ev=>{
            this.modalCompanyUpdates();
        });

        $("#files [type='file']").change(async ev=>{
            let f = $(ev.currentTarget)[0].files[0];
            if(!f) return;
            this.uploadFile(f);
        })
        
    }
    async getInfo(){
        let resp = await $.get({ url: "/info" });
        if(typeof resp == "string") resp = JSON.parse(resp);
        this.info = resp;

        this.drawCharts();
        this.showBackups();

        this.listPM2();
        this.processApps();
        this.filterApps();
        this.procesCompanies();
        this.filterCompanies();
        this.listFiles();
        $("#pm2 [name='pm2LogViewer']").html("...");
    }
    drawCharts(){

        $("#info [name='chartInterval']").html( this.info.info.sys_info_interval / 1000 );
        

        let labelTime = [];
        let valuesCPU = [];
        let valuesRAM = [];

        this.info.info.sys_info.forEach((tx, ind)=>{
            labelTime.push(ind);
            valuesCPU.push(parseInt(tx.cpu));
            let _ram = tx.usoRAM * 100 / Number(this.info.info.total_memory.replace("MB", ""));
            valuesRAM.push(parseInt(_ram));
        });

        // Configuración del gráfico
        const configChartCPU = {
            type: 'line',
            data: {
                labels: labelTime,
                datasets: [
                    {
                        label: "CPU",
                        data: valuesCPU,
                        fill: false,
                        borderColor: '#dc3545',
                        tension: 0.1
                    },
                    {
                        label: "RAM",
                        data: valuesRAM,
                        fill: false,
                        borderColor: '#007bff',
                        tension: 0.1
                    }
                ]
            },
        };

        // Crear el gráfico de líneas
        new Chart(
            document.getElementById('chartCPU'),
            configChartCPU
        );
    }
    showBackups(){
        $("#info [name='backupInterval']").html( (this.info.info.backup_interval / 1000 / 60 / 60) + "hs" );

        let tbody = "";
        this.info.backups.forEach(bx=>{
            tbody += `<tr>
                <td>${bx}</td>
            </tr>`;
        })
        $("#info table:eq(0) tbody").html(tbody);
    }
    getBadge(val, color){
        return `<span class="badge badge-${color}">${val}</span>`;
    }
    getStrSimple(str = "", lower = false){
        let aux = str.toString().toLowerCase();
        aux = aux.replace(/[^a-zA-Z0-9]/g, '');
        aux = aux.replaceAll("á", "a").replaceAll("é", "e").replaceAll("í", "i").replaceAll("ó", "o").replaceAll("ú", "u");
        return aux;
    }
    listPM2(){
        let tbody = "";
        this.info.pm2.forEach(app=>{
            
            tbody += `<tr pid="${app.pid}" appName="${app.name}">
                <td>${app.pid}</td>
                <td>${app.name}</td>
                <td>${app.restarts}</td>
                <td>${app.uptime2}</td>
                <td>${Math.round(app.monit.memory / 1024 / 1024)}mb</td>
                <td>${app.monit.cpu}%</td>
                <td>${this.getBadge(app.status, app.status == "stopped" ? "danger" : "success")}</td>
                <td>
                    <select class='form-control form-control-sm' style="width:135px">
                        <option value='0'>--ACTION--</option>
                        <hr>
                        <option class="${app.isProjectManager && "d-none"}" value='start'>Start</option>
                        <option class="${app.isProjectManager && "d-none"}" value='stop'>Stop</option>
                        <option class="${app.isProjectManager && "d-none"}" value='restart'>Restart</option>
                        <hr>
                        <option value='get-log'>Get Log</option>
                        <option value='get-error-log'>Get error log</option>
                        <option value='flush-logs'>Flush logs</option>
                    </select>
                </td>
            </tr>`

        });
        $("#pm2 table:eq(0) tbody").html(tbody);
    
        $("#pm2 table:eq(0) tbody select").change(async ev=>{
            let ele = $(ev.currentTarget);
            let v = ele.val();
            let appName = ele.parent().parent().attr("appName");
            let app = this.info.pm2.find(p=>p.name == appName);
            ele.val("0");//limpio el select de accion
            if(v == "0") return;

            //console.log({name: appName, action: v});

            $("#pm2 [name='pm2LogViewer']").html("...");
            if(v == "start"){
                await modal.esperando2("Starting...");
                let ret = await this.sendAction("/pm2", v, {appName});
                Object.assign(app, ret.resp);
                this.listPM2();
                $("#pm2 [name='pm2LogViewer']").val("Starting the project");
                modal.ocultar();
            }else if(v == "stop"){
                let sino = await modal.pregunta("Confirm stopping the project?");
                if(sino == false) return;
                await modal.esperando2("Stopping...");
                let ret = await this.sendAction("/pm2", v, {appName});
                Object.assign(app, ret.resp);
                this.listPM2();
                $("#pm2 [name='pm2LogViewer']").val("Project stoped");
                modal.ocultar();
            }else if(v == "restart"){
                let sino = await modal.pregunta("Confirm restart the project?");
                if(sino == false) return;
                await modal.esperando2("Restarting...");
                let ret = await this.sendAction("/pm2", v, {appName});
                Object.assign(app, ret.resp);
                this.listPM2();
                $("#pm2 [name='pm2LogViewer']").val("Project restarted");
                modal.ocultar();
            }else if(v == "get-log"){
                let ret = await this.sendAction("/pm2", v, {appName});
                $("#pm2 [name='pm2LogViewer']").val("LOG\n\n" + ret.resp);
            }else if(v == "get-error-log"){
                let ret = await this.sendAction("/pm2", v, {appName});
                $("#pm2 [name='pm2LogViewer']").val("ERROR LOG\n\n" + ret.resp);
            }else if(v == "flush-logs"){
                let sino = await modal.pregunta("Confirm flush logs?");
                if(sino == false) return;
                let ret = await this.sendAction("/pm2", v, {appName});
                $("#pm2 [name='pm2LogViewer']").val("");    
            }
            $("#pm2 [name='pm2LogViewer']").scrollTop(Number.MAX_SAFE_INTEGER);
        })
        
    }
    async sendAction(url, action, values){
        let data = { action };
        Object.assign(data, values);
        let ret = await $.post({
            url: url,
            data: data
        })
        if(typeof ret == "string") ret = JSON.parse(ret);
        return ret;
    }
    processApps(){
        this.info.apps.totals = {
            totals: 0,
            trial: 0,
            thisMonth: 0,
            clients: 0
        };

        this.info.apps.emprendimientos.forEach(emp=>{

            let vencimiento = fechas.parse2(emp.vencimiento, "USA_FECHA");
            let vencimientoDiff = fechas.diff_days(this.info.fx, vencimiento);
            let creado = fechas.parse2(emp.creado, "USA_FECHA");
            let creadoDiff = fechas.diff_days(this.info.fx, creado);
            let ultimaActividad = fechas.parse2((emp.ultimaActividad || emp.ultimoIngreso), "USA_FECHA");
            let ultimaActividadDiff = fechas.diff_days(ultimaActividad, this.info.fx);

            emp.fechas = {
                vencimiento,
                vencimientoDiff,
                creado,
                creadoDiff,
                ultimaActividad,
                ultimaActividadDiff
            };

            this.info.apps.totals.totals++;
            if(creadoDiff > -15)  this.info.apps.totals.trial++;
            if(this.info.fx.substring(0,7) == creado.substring(0,7)) this.info.apps.totals.thisMonth++;
            if(creadoDiff > 15 && vencimientoDiff > -10)  this.info.apps.totals.clients++;

        })

        $("#apps [name='totalRegistered']").html("Total: " + this.info.apps.totals.totals);
        $("#apps [name='trialUsers']").html("Trial: " + this.info.apps.totals.trial);
        $("#apps [name='monthlyRegistrations']").html("This Month: " + this.info.apps.totals.thisMonth);
        $("#apps [name='convertedToClients']").html("Clients: " + this.info.apps.totals.clients);

    }
    filterApps(){
        let word = $("#apps [type='search']").val();
        let word2 = this.getStrSimple(word, true);
        this.info.apps.emprendimientos.forEach(emp=>{
            if(
                word2 == ""
                || this.getStrSimple(emp.nombre, true).includes(word2)
                || emp.usuario1.toLowerCase().includes(word)
            ){
                emp.mostrar = true;
            }else{
                emp.mostrar = false;
            }
        })
        this.listApps();
    }
    listApps(){
        let superOlds = $("#apps [type='checkbox']").prop("checked");
        let mostrados = 0;
        let tbody = "";
        this.info.apps.emprendimientos.forEach(emp=>{
            if(superOlds == false && emp.fechas.ultimaActividadDiff > 60) return;//hide super olds
            if(emp.mostrar && mostrados < 100){
                mostrados++;

                let colorBadgeVenc = "";
                if(emp.fechas.vencimientoDiff <= 0) colorBadgeVenc = "danger";
                else if(emp.fechas.vencimientoDiff <= 15) colorBadgeVenc = "warning";
                else if(emp.fechas.vencimientoDiff > 15) colorBadgeVenc = "success";
                let badgeVenc = this.getBadge(`${emp.fechas.vencimiento} (${emp.fechas.vencimientoDiff})`, colorBadgeVenc);

                let colorBadgeUltAct = "";
                if(emp.fechas.ultimaActividadDiff <= 5) colorBadgeUltAct = "success";
                else if(emp.fechas.ultimaActividadDiff <= 10) colorBadgeUltAct = "warning";
                else if(emp.fechas.ultimaActividadDiff > 10) colorBadgeUltAct = "danger";
                let badgeUltAct = this.getBadge(emp.fechas.ultimaActividadDiff, colorBadgeUltAct);

                tbody += `<tr _id="${emp._id}">
                        <td>${emp.nombre}</td>
                        <td>${emp.usuario1}</td>
                        <td>${emp.tipo}</td>
                        <td>${emp.plan}</td>
                        <td>${badgeVenc}</td>
                        <td>${badgeUltAct}</td>
                        <td>
                            <select class='form-control form-control-sm' style="width:135px">
                                <option value='0'>--ACTION--</option>
                                <hr>
                                <option value='moreInfo'>More info</option>
                                <option value='setVenc'>Set venc</option>
                                <option value='setPlan'>Set plan</option>
                            </select>
                        </td>
                    </tr>`;
            }
        })
        $("#apps table:eq(0) tbody").html(tbody);

        $("#apps table:eq(0) tbody select").change(ev=>{
            let ele = $(ev.currentTarget);
            let v = ele.val();
            let _id = ele.parent().parent().attr("_id");
            let app = this.info.apps.emprendimientos.find(emp=>emp._id == _id);
            if(v == "moreInfo") this.appMoreInfo(app);
            else if(v == "setVenc") this.appSetVenc(app);
            else if(v == "setPlan") this.appSetPlan(app);
            ele.val("0");
        })
    }
    appMoreInfo(app){
        let fox = $(".modal_moreInfo").html();
        modal.mostrar({
            titulo: "moreInfo",
            cuerpo: fox,
            botones: "volver"
        });

        $("#modal [name='_id']").val(app._id);
        $("#modal [name='name']").val(app.nombre);
        $("#modal [name='type']").val(app.tipo);
        $("#modal [name='plan']").val(app.plan);
        let usuario1 = this.info.apps.usuarios.find(u=>u.email == app.usuario1);
        if(usuario1) $("#modal [name='phone']").val(usuario1.telefono);
        $("#modal [name='vendorCode']").val(app.codigoVendedor);
    }
    appSetVenc(app){
        let fox = $(".modal_setVenc").html();
        modal.mostrar({
            titulo: "setVenc",
            cuerpo: fox,
            botones: "volver"
        });

        $("#modal [name='_id']").val(app._id);
        $("#modal [name='venc']").val(fechas.parse2(app.vencimiento, "USA_FECHA"));
        $("#modal [name='newVenc']").val(fechas.parse2(new Date(), "USA_FECHA"));

        $("#modal [name='confirm']").click(async ev=>{
            let ele = $(ev.currentTarget);
            let resp = await modal.addAsyncPopover({querySelector: ele, type: "yesno", message: "Confirm new venc?"});
            if(!resp) return;

            let newVenc = $("#modal [name='newVenc']").val();

            let resp2 = this.sendAction("/apps", "setVenc", {newVenc, eid: app._id});
            console.log(resp2);
            modal.ocultar(()=>{
                if(resp2.error){
                    modal.mensaje(resp2.message);
                }else{
                    app.vencimiento = fechas.parse2(newVenc, "USA_FECHA");
                    this.processApps();
                    this.filterApps();
                }
            });
        })
    }
    appSetPlan(app){
        let fox = $(".modal_setPlan").html();
        modal.mostrar({
            titulo: "setPlan",
            cuerpo: fox,
            botones: "volver"
        });

        $("#modal [name='_id']").val(app._id);
        $("#modal [name='plan']").val(app.plan);

        $("#modal [name='confirm']").click(async ev=>{
            let ele = $(ev.currentTarget);
            let resp = await modal.addAsyncPopover({querySelector: ele, type: "yesno", message: "Confirm new plan?"});
            if(!resp) return;

            let newPlan = $("#modal [name='plan']").val();

            let resp2 = this.sendAction("/apps", "setPlan", {newPlan, eid: app._id});
            console.log(resp2);
            modal.ocultar(()=>{
                if(resp2.error){
                    modal.mensaje(resp2.message);
                }else{
                    app.plan = newPlan;
                    this.processApps();
                    this.filterApps();
                }
            });
        })
    }
    filterCompanies(){
        let word = $("#companies [type='search']").val();
        let word2 = this.getStrSimple(word, true);
        this.info.companies.empresas.forEach(emp=>{
            if(
                word2 == ""
                || this.getStrSimple(emp.nombre, true).includes(word2)
                || this.getStrSimple(emp.administrador, true).includes(word2)
            ){
                emp.mostrar = true;
            }else{
                emp.mostrar = false;
            }
        })
        this.listCompanies();
    }
    procesCompanies(){
        this.info.companies.empresas.forEach(emp=>{
            
            let vencimiento = fechas.parse2(emp.vencimiento, "USA_FECHA");
            let vencimientoDiff = fechas.diff_days(this.info.fx, vencimiento);

            let lastLogin = emp.ingresos.length > 0 ? fechas.parse2(emp.ingresos.at(-1).fecha, "USA_FECHA") : null;
            let lastLoginDiff = lastLogin ? fechas.diff_days(lastLogin, this.info.fx) : 999;


            emp.fechas = {
                vencimiento,
                vencimientoDiff,
                lastLogin,
                lastLoginDiff
            };
        });
    }
    listCompanies(){
        let mostrados = 0;
        let tbody = "";
        this.info.companies.empresas.forEach(emp=>{
            if(emp.mostrar && mostrados < 100){
                mostrados++;

                let badgeVenc = this.getBadge(`${emp.fechas.vencimiento}`, "info");

                let colorBadgeUltAct = "";
                if(emp.fechas.lastLoginDiff <= 15) colorBadgeUltAct = "success";
                else if(emp.fechas.lastLoginDiff < 30) colorBadgeUltAct = "warning";
                else colorBadgeUltAct = "danger";
                let badgeUltAct = this.getBadge(emp.fechas.lastLoginDiff, colorBadgeUltAct);

                let tt = this.info.companies.tipos.find(t=>t.codigo === emp.tipo);

                tbody += `<tr _id="${emp._id}">
                        <td>${emp.nombre}</td>
                        <td>${tt ? tt.nombreCorto : "???"}</td>
                        <td>${badgeVenc}</td>
                        <td>${badgeUltAct}</td>
                        <td>
                            <select class='form-control form-control-sm' style="width:135px">
                                <option value='0'>--ACTION--</option>
                                <hr>
                                <option value='company'>Company</option>
                                <option value='modify'>Modify</option>
                                <option value='services'>Services</option>
                                <option value='backups'>Backups</option>
                                <option value='logins'>Logins</option>
                            </select>
                        </td>
                    </tr>`;
            }
        })
        $("#companies table:eq(0) tbody").html(tbody);

        $("#companies table:eq(0) tbody select").change(ev=>{
            let ele = $(ev.currentTarget);
            let v = ele.val();
            let _id = ele.parent().parent().attr("_id");
            let emp = this.info.companies.empresas.find(emp=>emp._id == _id);
            if(v == "company") this.modalCompany(emp);
            else if(v == "modify") this.modalCompany(emp, true);
            else if(v == "services") this.modalCompanyServices(emp);
            else if(v == "backups") this.modalCompanyBackups(emp);
            else if(v == "logins") this.modalCompanyLogins(emp);
            ele.val("0");
        })
    }
    modalCompany(emp, edit = false){
        let fox = $(".modal_company").html();
        modal.mostrar({
            titulo: "Company",
            cuerpo: fox,
            botones: "volver"
        })

        let opt = "<option value='0' selected>-SELECT-</option>";
        this.info.companies.tipos.forEach(t=>{
            opt += `<option value="${t.codigo}">${t.nombreCorto}</option>`
        })
        $("#modal [name='type']").html(opt);

        $("#modal [name='localKey']").dblclick(ev=>{
            if(edit == false) return;
            $("#modal [name='localKey']").prop("readonly", false);
        })

        if(emp){
            $("#modal [name='EID']").val(emp._id);
            $("#modal [name='oldId']").val(emp.oldId);
            $("#modal [name='name']").val(emp.nombre);
            $("#modal [name='location']").val(emp.direccion);
            $("#modal [name='phone']").val(emp.telefono);
            $("#modal [name='administrator']").val(emp.administrador);
            $("#modal [name='type']").val(emp.tipo);
            $("#modal [name='localKey']").val(emp.llaveLocal);
            $("#modal [name='onlineKey']").val(emp.llaveOnline);
            $("#modal [name='status']").val( emp.estado.toString() );
            
            $("#modal [name='created']").val(fechas.parse2(emp.creado, "USA_FECHA"));
            $("#modal [name='lastAccess']").val(fechas.parse2(emp.ultimoIngreso, "USA_FECHA"));
            $("#modal [name='venc']").val(fechas.parse2(emp.vencimiento, "USA_FECHA"));


            $("#modal [name='token']").val(emp.token);
        }

        if(edit == false){
            $("#modal [name='save']").remove();
            $("#modal input, #modal select").prop("disabled", true).prop("readonly", true);
        }

        $("#modal [name='save']").click(async ev=>{
            let data = {
                eid: $("#modal [name='EID']").val(),
                oldId: $("#modal [name='oldId']").val(),
                name: $("#modal [name='name']").val(),
                location: $("#modal [name='location']").val(),
                phone: $("#modal [name='phone']").val(),
                administrator: $("#modal [name='administrator']").val(),
                type: $("#modal [name='type']").val(),
                localKey: $("#modal [name='localKey']").val(),
                onlineKey: $("#modal [name='onlineKey']").val(),
                status: $("#modal [name='status']").val(),
            }

            let resp = await this.sendAction("/companies", (emp ? "modifyCompany" : "newCompany"), data);
            console.log(resp);
            modal.ocultar(()=>{
                if(resp.error){
                    modal.mensaje(resp.message);
                }else{
                    modal.mensaje("Refresh/update to see the changes");
                }
            });
        });
    }
    modalCompanyUpdates(){
        let fox = $(".modal_updates").html();
        modal.mostrar({
            titulo: "Updates",
            cuerpo: fox,
            tamano: "modal-lg",
            botones: "volver"
        })

        let tbody = "";
        this.info.companies.actualizaciones.forEach(ax=>{
            tbody += `<tr _id="${ax._id}" class="${ax.activa && "table-success"}">
                <td>${fechas.parse2(ax.fecha, "USA_FECHA_HORA")}</td>
                <td>${ax.archivo}</td>
                <td>${ax.contrasena}</td>
                <td>
                    <button class='btn btn-flat btn-primary btn-xs' name="active">Active</button>
                </td>
            </tr>`
        })
        $("#modal tbody").html(tbody);

        $("#modal tbody button").click(async ev=>{
            let ele = $(ev.currentTarget);
            let _id = ele.parent().parent().attr("_id");
            let resp = await modal.addAsyncPopover({querySelector: ele, type: "yesno", message: "Activate this update?"});
            if(!resp) return;
            let resp2 = await this.sendAction("/companies", "setUpdate", {_id: _id});
            console.log(resp2);
            modal.ocultar(()=>{
                modal.mensaje(resp2.message);

                if(!resp2.error){
                    this.info.companies.actualizaciones.forEach(ax=>{
                        if(ax._id == _id){
                            ax.activa = true;
                        }else{
                            ax.activa = false;
                        }
                    })
                }
            })
        })

        $("#modal [name='upload']").click(async ev=>{
            let ele = $(ev.currentTarget);
            let file = $("#modal [type='file']")[0].files[0];
            let password = $("#modal [name='password']").val();

            if(!file || file.name.endsWith(".zip") == false) return;
            if(!password || password.length < 6) return;

            $("#modal [name='upload']").prop("disabled", true);

            let fd = new FormData();
            fd.append("password", password);
            fd.append("update", file);

            let resp = await $.post({
                url: "/companies/upload-update",
                data: fd,
                processData: false,
                contentType: false,
            })
            modal.ocultar(()=>{
                if(resp._id){
                    this.info.companies.actualizaciones.push({
                        _id: resp._id,
                        archivo: file.name,
                        contrasena: password,
                        fecha: new Date(),
                    })
                    modal.mensaje("Upload successfull");
                }else{
                    modal.mensaje(resp.message || "ERROR?");   
                }
            })
        });
    }
    modalCompanyLogins(emp){
        let fox = $(".modal_companyLogins").html();
        modal.mostrar({
            titulo: "Company logins",
            cuerpo: fox,
            botones: "volver"
        })
        console.log(emp);

        let tbody = "";
        emp.ingresos.forEach(ax=>{
            tbody += `<tr _id="${ax._id}">
                <td>${fechas.parse2(ax.fecha, "USA_FECHA_HORA")}</td>
                <td><span class="badge badge-info">${fechas.diff_days(ax.fecha, new Date())}</span></td>
                <td>${ax.ip}</td>
            </tr>`
        })
        $("#modal tbody").html(tbody);
    }
    modalCompanyBackups(emp){
        let fox = $(".modal_companyBackups").html();
        modal.mostrar({
            titulo: "Company backups",
            cuerpo: fox,
            botones: "volver"
        })

        let tbody = "";
        emp.respaldos.forEach(ax=>{
            tbody += `<tr _id="${ax._id}">
                <td>${fechas.parse2(ax.fecha, "USA_FECHA_HORA")}</td>
                <td>${ax.archivo}</td>
                <td>
                    <button class='btn btn-flat btn-primary btn-xs' name="download">Download</button>
                </td>
            </tr>`
        })
        $("#modal tbody").html(tbody);

        $("#modal tbody button").click(async ev=>{
            let ele = $(ev.currentTarget);
            let row = ele.parent().parent();
            let _id = row.attr("_id");
            let backup = emp.respaldos.find(r=>r._id == _id).archivo;
            window.open( "/companies/download-backup/" + emp._id + "/" + backup, "_blank");
            modal.ocultar();
        })
    }
    modalCompanyServices(emp){
        let fox = $(".modal_companyServices").html();
        modal.mostrar({
            titulo: "Company services",
            cuerpo: fox,
            tamano: "modal-lg",
            botones: "volver"
        })

        let tbody = "";
        emp.servicios.forEach(sx=>{
            tbody += `<tr>
                <td>${ this.info.companies.servicios.find(s=>s.codigo === sx.codigo).nombre }</td>
                <td>${ fechas.parse2(sx.vencimiento, "USA_FECHA") }</td>    
            </tr>`
        })
        $("#modal table tbody").html(tbody)

        let opt = `<option value='0' selected>-SELECT ONE-</option>`;
        this.info.companies.servicios.forEach(sx=>{
            opt += `<option value='${sx.codigo}'>${sx.nombre}</option>`;
        })
        $("#modal [name='service']").html(opt);

        $("#modal [name='months']").change(ev=>{
            let v = Number($(ev.currentTarget).val());
            if(v && v > 0){
                let now = new Date();
                now.setMonth(now.getMonth() + v);
                console.log()
                $("#modal [name='venc']").val( fechas.parse2(now, "USA_FECHA") );
            }else{
                $("#modal [name='venc']").val( null );
            }
        });
        $("#modal [name='venc']").change(ev=>{
            let v = $(ev.currentTarget).val();
            $("#modal [name='months']").val( null );
        });

        $("#modal [name='asign']").click(async ev=>{
            let ele = $(ev.currentTarget);
            let venc = $("#modal [name='venc']").val();
            let service = $("#modal [name='service']").val();
            if(!venc || service == "0") return;
            let resp = await modal.addAsyncPopover({querySelector: ele, type: "yesno", message: "confirm the action?"});
            if(!resp) return;

            let ret = await this.sendAction("/companies", "setService", {eid: emp._id, serviceCode: service, newVenc: venc, detail: ""});
            console.log(ret);
        });

    }
    listFiles(){
        let tbody = "";
        this.info.files.forEach(file=>{          
            tbody += `<tr file="${file}">
                <td style="width:100%;">${file}</td>
                <td style="width:auto;">
                    <select class='form-control form-control-sm' style="width:135px">
                        <option value='0'>--ACTION--</option>
                        <hr>
                        <option value='rename'>Rename</option>
                        <option value='openDownload'>Open / Download</option>
                        <option value='delete'>Delete</option>
                        <option class="${file.endsWith(".enc") == false && "d-none"}" value='decrypt'>Decrypt</option>
                    </select>
                </td>
            </tr>`

        });
        $("#files table:eq(0) tbody").html(tbody);
        $("#files table:eq(0)").parent().scrollTop(Number.MAX_SAFE_INTEGER);
        

        $("#files table:eq(0) tbody select").change(async ev=>{
            let ele = $(ev.currentTarget);
            let v = ele.val();
            let file = ele.parent().parent().attr("file");
            ele.val("0");//limpio el select de accion
            if(v == "0") return;
            
            if(v == "rename"){
                let newName = await modal.prompt({label: "New name", value: file});
                if(!newName) return;
                newName = newName.toString().trim();
                if(newName.length < 3) return;//el nuevo nombre tiene que tener mas de 3 caracters
                if(file == newName) return;//el nuevo nombre no puede ser igual al actual

                let ret = await this.sendAction("/files", "rename", {file, newName});
                
                if(ret.error){
                    modal.mensaje(ret.message);
                }else{
                    this.info.files = this.info.files.filter(f=>f != file);
                    this.info.files.push(newName);
                }

            }else if(v == "openDownload"){
                window.open( window.location.origin + "/files/" + file,"_blank")
            }else if(v == "delete"){
                let resp = await modal.pregunta("¿Seguro de eliminar el archivo?");
                if(!resp) return;
                let ret = await this.sendAction("/files", "delete", { file });
                this.info.files = this.info.files.filter(f=>f != file);
            }else if(v == "decrypt"){
                let password = await modal.prompt({label: "Admin password", value: "", type: "password"});
                if(!password) return;

                let ret = await this.sendAction("/files", "decrypt", { file, password });

                if(ret.error){
                    modal.mensaje(ret.message);
                }else{
                    this.info.files.push(file.substring(0, file.length -4));
                }
            }
            this.listFiles();
        });
    }
    async uploadFile(file){

        let fd = new FormData();
        fd.append("file", file);

        await modal.esperando2("Uploading...")
        let ret = await $.post({
            url: "/files/upload",
            data: fd,
            processData: false,
            contentType: false,
        });
        
        if(ret.error){
            modal.ocultar(()=>{
                modal.mensaje(ret.message);
            });
        }else{
            this.info.files.push(f.name);
            this.listFiles();
            modal.ocultar();
        }
    }
}

var projectManager = null;
var modal = new Modal();
var fechas = new Fechas();
window.onload = () => { projectManager = new ProjectManager(); }