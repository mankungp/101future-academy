/* 101future site — nav + scroll reveal (เบาๆ ไม่มี dependency) */
(function(){
  // mobile nav
  var burger=document.querySelector('.nav-burger');
  var links=document.querySelector('.nav-links');
  if(burger&&links){
    burger.addEventListener('click',function(){links.classList.toggle('open')});
    links.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click',function(){links.classList.remove('open')});
    });
  }
  // reveal on scroll
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){ if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);} });
  },{threshold:.12});
  document.querySelectorAll('.reveal').forEach(function(el){io.observe(el)});
  // year in footer
  var y=document.querySelector('[data-year]'); if(y) y.textContent=new Date().getFullYear()+543;
})();
