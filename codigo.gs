const SHEET_ID = '1gRt7F6AFURsR8sa6aEYJq6EG9VRLKw4GYoScZfzGBNg';

function doGet(e) {
  const html = HtmlService.createHtmlOutputFromFile('index');
  html.setTitle('CanchaStats');
  html.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  return html;
}

function serverSetup() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheets = {
    ligas:['id','nombre','temporada','fechas','categoria','modalidad','creado'],
    equipos:['id','liga_id','nombre','color','creado'],
    jugadores:['id','equipo_id','nombre','camiseta','posicion','creado'],
    tacticas:['id','liga_id','categoria','titulo','creado'],
    partidos:['id','liga_id','local_id','visitante_id','fecha','estado','modalidad','cuarto','ml','mv','titulares_local','titulares_rival','creado'],
    acciones:['id','partido_id','jugador_id','tipo','coordx','coordy','cuarto','tiempo','ml','mv','tactica','creado']
  };
  const existing = ss.getSheets().map(s => s.getName());
  for (const [name, headers] of Object.entries(sheets)) {
    if (!existing.includes(name)) {
      const sheet = ss.insertSheet(name);
      sheet.getRange(1,1,1,headers.length).setValues([headers]);
      sheet.getRange(1,1,1,headers.length).setFontWeight('bold');
    }
  }
  return { ok: true };
}

function serverGetAll() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const result = {};
  for (const name of ['ligas','equipos','jugadores','tacticas','partidos']) {
    try {
      const sheet = ss.getSheetByName(name);
      if (!sheet) { result[name]=[]; continue; }
      const rows = sheet.getDataRange().getValues();
      if (rows.length<=1) { result[name]=[]; continue; }
      const headers = rows[0];
      result[name] = rows.slice(1).filter(r=>r[0]).map(row=>{
        const obj={};
        headers.forEach((h,i)=>{obj[h]=String(row[i]!==undefined?row[i]:'');});
        return obj;
      });
    } catch(e) { result[name]=[]; }
  }
  return result;
}

function serverAppend(sheetName, values) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return {ok:false,error:'Hoja no encontrada: '+sheetName};
    sheet.appendRow(values);
    return {ok:true};
  } catch(e) { return {ok:false,error:e.message}; }
}

function serverUpdate(sheetName, id, values) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return {ok:false,error:'Hoja no encontrada'};
    const rows = sheet.getDataRange().getValues();
    for (let i=1;i<rows.length;i++) {
      if (String(rows[i][0])===String(id)) {
        sheet.getRange(i+1,1,1,values.length).setValues([values]);
        return {ok:true};
      }
    }
    return {ok:false,error:'No encontrado'};
  } catch(e) { return {ok:false,error:e.message}; }
}

function serverDelete(sheetName, id) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return {ok:false,error:'Hoja no encontrada'};
    const rows = sheet.getDataRange().getValues();
    for (let i=1;i<rows.length;i++) {
      if (String(rows[i][0])===String(id)) {
        sheet.deleteRow(i+1);
        return {ok:true};
      }
    }
    return {ok:false,error:'No encontrado'};
  } catch(e) { return {ok:false,error:e.message}; }
}

function serverCrearPartido(ligaId, localId, visitanteId, modalidad, titularesLocal, titularesVisitante) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName('partidos');
    if (!sheet) return {ok:false,error:'Hoja partidos no encontrada'};
    const id = Utilities.getUuid();
    const fecha = new Date().toISOString();
    sheet.appendRow([id,ligaId,localId,visitanteId,fecha,'en_curso',modalidad,'1','0','0',JSON.stringify(titularesLocal),JSON.stringify(titularesVisitante),fecha]);
    return {ok:true,id:id};
  } catch(e) { return {ok:false,error:e.message}; }
}

function serverGuardarEstado(partidoId, cuarto, ml, mv, titularesLocal, titularesVisitante, estado) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName('partidos');
    const rows = sheet.getDataRange().getValues();
    const h = rows[0];
    const idx = {id:h.indexOf('id'),estado:h.indexOf('estado'),cuarto:h.indexOf('cuarto'),ml:h.indexOf('ml'),mv:h.indexOf('mv'),tl:h.indexOf('titulares_local'),tv:h.indexOf('titulares_rival')};
    for (let i=1;i<rows.length;i++) {
      if (String(rows[i][idx.id])===String(partidoId)) {
        sheet.getRange(i+1,idx.estado+1).setValue(estado||'en_curso');
        sheet.getRange(i+1,idx.cuarto+1).setValue(cuarto);
        sheet.getRange(i+1,idx.ml+1).setValue(ml);
        sheet.getRange(i+1,idx.mv+1).setValue(mv);
        sheet.getRange(i+1,idx.tl+1).setValue(JSON.stringify(titularesLocal));
        sheet.getRange(i+1,idx.tv+1).setValue(JSON.stringify(titularesVisitante));
        return {ok:true};
      }
    }
    return {ok:false,error:'Partido no encontrado'};
  } catch(e) { return {ok:false,error:e.message}; }
}

function serverGuardarAccion(accion) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName('acciones');
    if (!sheet) return {ok:false,error:'Hoja acciones no encontrada'};
    sheet.appendRow([accion.id,accion.partido_id,accion.jugador_id,accion.tipo,accion.coordx,accion.coordy,accion.cuarto,accion.tiempo,accion.ml,accion.mv,accion.tactica||'',new Date().toISOString()]);
    return {ok:true};
  } catch(e) { return {ok:false,error:e.message}; }
}

function serverGetAcciones(partidoId) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName('acciones');
    if (!sheet) return {ok:true,data:[]};
    const rows = sheet.getDataRange().getValues();
    if (rows.length<=1) return {ok:true,data:[]};
    const headers = rows[0];
    const data = rows.slice(1)
      .filter(r=>r[0]&&String(r[1])===String(partidoId))
      .map(row=>{
        const obj={};
        headers.forEach((h,i)=>{obj[h]=String(row[i]!==undefined?row[i]:'');});
        return obj;
      });
    return {ok:true,data:data};
  } catch(e) { return {ok:false,error:e.message}; }
}
