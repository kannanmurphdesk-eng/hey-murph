'use strict';
// v84: Home dashboard removed from the UI. Data layers stay loaded. First render only.
function renderHome(){const el=$('#home');if(el)el.hidden=true}
if(typeof render==='function')render();
