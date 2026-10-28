// Hey Murph journal email relay. Deploy as Web app under kannanmurphdesk@gmail.com:
//   Execute as: Me   |   Who has access: Anyone
// Then Project Settings > Script properties: add TOKEN = <a long random string> (never commit it).
function doPost(e){
  var d=JSON.parse(e.postData.contents||'{}'),P=PropertiesService.getScriptProperties();
  if(!d.token||d.token!==P.getProperty('TOKEN'))return out({ok:false,err:'auth'});
  var lock=LockService.getScriptLock();lock.waitLock(20000);
  try{
    if(P.getProperty('sent_'+d.id))return out({ok:true,dup:true});   // de-dupe retries
    MailApp.sendEmail('kannanmurphdesk@gmail.com',String(d.subject).slice(0,200),String(d.body));
    P.setProperty('sent_'+d.id,String(Date.now()));
    return out({ok:true});
  }finally{lock.releaseLock()}
}
function out(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON)}
