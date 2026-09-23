const SESSION_KEY='__SESSION_KEY__';
const BACKEND_URL='__BACKEND_URL__';
function doGet(){
 const email=Session.getActiveUser().getEmail().trim().toLowerCase();
 if(!email||email!==Session.getEffectiveUser().getEmail().trim().toLowerCase())throw new Error('請登入 Google 帳號。');
 const now=Math.floor(Date.now()/1000),claims={aud:'jpwork-channels-v1',email:email,iat:now,exp:now+3600,nonce:Utilities.getUuid()};
 const payload=Utilities.base64EncodeWebSafe(JSON.stringify(claims));
 const ticket=payload+'.'+Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(payload,SESSION_KEY));
 const html=HtmlService.createTemplateFromFile('Login');html.email=email;html.destination=BACKEND_URL+'#'+ticket;
 return html.evaluate().setTitle('PWA Google 登入').addMetaTag('viewport','width=device-width, initial-scale=1');
}