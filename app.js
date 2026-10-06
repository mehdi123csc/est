const products=[
{id:1,name:"N Core Overshirt",cat:"men",price:89},
{id:2,name:"N Studio Tee",cat:"men",price:49},
{id:3,name:"N Form Jacket",cat:"women",price:119},
{id:4,name:"N Essential Top",cat:"women",price:59},
{id:5,name:"N Motion Trousers",cat:"men",price:99},
{id:6,name:"N Line Dress",cat:"women",price:109},
{id:7,name:"N Everyday Hoodie",cat:"men",price:79},
{id:8,name:"N Shape Knit",cat:"women",price:89}
];
let bag=JSON.parse(localStorage.getItem("nbyn_bag")||"[]");
const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
window.addEventListener("load",()=>setTimeout(()=>$("#loader").classList.add("hide"),900));
window.addEventListener("scroll",()=>$("#nav").classList.toggle("scrolled",scrollY>40));
function renderProducts(filter="all"){
 const grid=$("#productGrid"); const list=products.filter(p=>filter==="all"||p.cat===filter);
 grid.innerHTML=list.map((p,i)=>`<article class="product-card" data-id="${p.id}"><div class="product-image"><span class="product-number">0${i+1}</span><button class="add" aria-label="Add ${p.name}">+</button></div><div class="product-info"><div>${p.name}<small>${p.cat.toUpperCase()}</small></div><strong>$${p.price}</strong></div></article>`).join("");
 $$(".add").forEach(b=>b.addEventListener("click",e=>{e.stopPropagation();addToBag(+b.closest(".product-card").dataset.id)}));
}
function addToBag(id){bag.push(id);localStorage.setItem("nbyn_bag",JSON.stringify(bag));updateBag();openOverlay("bagOverlay")}
function updateBag(){
 $("#bagCount").textContent=bag.length;
 const counts={};bag.forEach(id=>counts[id]=(counts[id]||0)+1);
 $("#bagItems").innerHTML=Object.entries(counts).map(([id,q])=>{let p=products.find(x=>x.id==id);return `<div class="bag-item"><span>${p.name} × ${q}</span><b>$${p.price*q}</b></div>`}).join("")||"<p>Your bag is empty.</p>";
 $("#bagTotal").textContent="$"+bag.reduce((s,id)=>s+products.find(p=>p.id===id).price,0);
}
function openOverlay(id){$("#"+id).classList.add("open")}
function closeOverlay(id){$("#"+id).classList.remove("open")}
renderProducts();updateBag();
$$(".filter").forEach(b=>b.addEventListener("click",()=>{$$(".filter").forEach(x=>x.classList.remove("active"));b.classList.add("active");renderProducts(b.dataset.filter)}));
$$(".text-link").forEach(a=>a.addEventListener("click",()=>{setTimeout(()=>{let f=a.dataset.filter;$$(".filter").forEach(x=>x.classList.toggle("active",x.dataset.filter===f));renderProducts(f)},50)}));
$("#bagBtn").onclick=()=>openOverlay("bagOverlay");$("#searchBtn").onclick=()=>{openOverlay("searchOverlay");$("#searchInput").focus()};$$("[data-close]").forEach(x=>x.onclick=()=>closeOverlay(x.dataset.close));
$("#menuBtn").onclick=()=>$("#mobileMenu").classList.add("open");$("#mobileClose").onclick=()=>$("#mobileMenu").classList.remove("open");$$(".mobile-menu a").forEach(a=>a.onclick=()=>$("#mobileMenu").classList.remove("open"));
$("#searchInput").addEventListener("input",e=>{let q=e.target.value.toLowerCase();$("#searchResults").innerHTML=products.filter(p=>p.name.toLowerCase().includes(q)||p.cat.includes(q)).map(p=>`<div class="search-result"><span>${p.name}</span><b>$${p.price}</b></div>`).join("")});
$("#newsletterForm").onsubmit=e=>{e.preventDefault();$("#newsletterMsg").textContent="You're on the list. Welcome to N by N.";e.target.reset()};
$("#checkoutBtn").onclick=()=>alert("Checkout is ready to be connected to your payment provider.");
const io=new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting&&e.target.classList.add("visible")),{threshold:.12});$$(".reveal").forEach(x=>io.observe(x));
const orb=$(".hero-orb");window.addEventListener("pointermove",e=>{if(innerWidth>800){let x=(e.clientX/innerWidth-.5)*16,y=(e.clientY/innerHeight-.5)*16;orb.style.transform=`translate(calc(-50% + ${x}px),calc(-50% + ${y}px))`}});