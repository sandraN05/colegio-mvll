
function toggleMenu(){
  const menu = document.getElementById('mobileMenu');
  if(menu) menu.classList.toggle('open');
}

(function(){
  let completo = false;
  try{
    completo = localStorage.getItem('mvll_juego_completo') === 'true';
  }catch(e){}

  const bloqueado = document.getElementById('jg-bloqueado');
  const contenido = document.getElementById('jg-contenido');

  if(completo){
    if(contenido) contenido.style.display = '';
  } else {
    if(bloqueado) bloqueado.style.display = '';
  }
})();
