$().ready(function(){
  listenToSSE();
});

function listenToSSE(){
  var regex = /\/device\/([^\/]*)/;
  var path = regex.exec(window.location.pathname);
  
  if (!path || !path.length){
    //Invalid path .. weird
    return;
  }
  var source = new EventSource(path[0]+'/live');
  source.onmessage = deviceEvent;
  
}


function deviceEvent(event) {
  var data;
  try{
    data = JSON.parse(event.data);
  }
  catch(err){
    console.warn("JSON parsing error - %s", err);
  }
  var $live = $('#live');
  $('.live-date', $live).text(moment(data.date).calendar());
  $('.live-id', $live).text(data.who.tag);
  $('.live-person', $live).text(data.who.name);
}