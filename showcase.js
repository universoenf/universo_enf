(()=>{
const root=document.getElementById("showcase");
const panel=document.getElementById("catalog-view");
const catalog=document.getElementById("catalog");
if(!root||!panel||!catalog||typeof D==="undefined")return;
const anatomyImages={
"Sistema Esquelético":"file_00000000829c820e81593db25b950ec2.png",
"Sistema Articular":"ARTICULAR.png","Sistema Cardiovascular":"CARDIOVASCULAR.png",
"Sistema Digestivo":"DIGESTIVO.png","Sistema Endócrino":"ENDOCRINO.png",
"Sistema Linfático":"LINFATICO.png","Sistema Muscular":"MUSCULAR.png",
"Sistema Nervoso":"NERVOSO.png","Sistema Genital":"GENITAL.png",
"Sistema Respiratório":"RESPIRATORIO.png","Sistema Tegumentar":"TEGUMENTAR.png",
"Sistema Urinário":"URINARIO.png"};
const categoryImages={
"CIRÚRGICA":"CIRURGICAS.png","DISPOSITIVOS":"DISPOSITIVOS.png",
"ESCALAS DE ENFERMAGEM":"ESCALAS.png","FERIDAS E CURATIVOS":"FERIDAS.png",
"SAÚDE DA CRIANÇA":"CRIANÇA.png","SAÚDE DA MULHER":"MULHER.png",
"SAÚDE DO IDOSO":"IDOSO.png","URGÊNCIA E EMERGÊNCIA":"URGENCIAEMERGENCIA.png",
"SEMIOLOGIA":"SEMIOLOGIA.png","SEMIOTÉCNICA":"SEMIOTECNICA.png",
"EXAMES LABORATORIAIS":"EXAMES.png"};
const icons={"ANATOMIA":"🫀","CIRÚRGICA":"🩺","FARMACOLOGIA":"💊","SAÚDE DO HOMEM":"💙","SAÚDE DO ADOLESCENTE":"🌷","RELATÓRIOS":"📋","TERMINOLOGIAS":"📖","ISTs":"🧬","VACINAÇÃO":"💉","TEORIAS DA ENFERMAGEM":"📚","DISPOSITIVOS":"🩹"};
const idFor=c=>"cat-"+c.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9]+/g,"-").toLowerCase();
function openCollection(category,group){
 const search=document.getElementById("search");
 if(search){search.value="";search.dispatchEvent(new Event("input"))}
 panel.hidden=false;
 const details=document.getElementById(idFor(category));
 if(details?.tagName==="DETAILS")details.open=true;
 panel.scrollIntoView({behavior:"smooth",block:"start"});
 if(group&&details)setTimeout(()=>{
 const match=[...details.querySelectorAll(".gt")].find(el=>el.textContent.trim().includes(group));
 if(match)match.scrollIntoView({behavior:"smooth",block:"start"});
 },250);
}
document.getElementById("back-collections")?.addEventListener("click",()=>{
 panel.hidden=true;document.getElementById("categorias").scrollIntoView({behavior:"smooth"});
});
const collections=[
 ...Object.keys(D.ANATOMIA||{}).map(group=>({title:group,category:"ANATOMIA",group,image:anatomyImages[group],icon:"🫀"})),
 ...Object.keys(D).filter(c=>c!=="ANATOMIA").map(category=>({
 title:category==="CIRÚRGICA"?"Enfermagem Cirúrgica":category,
 category,image:categoryImages[category],icon:icons[category]||"💜",
 coming:D[category]===null||["RELATÓRIOS","TERMINOLOGIAS"].includes(category)
 }))
];
collections.forEach(item=>{
 const card=document.createElement("article");card.className="showcase-card";
 const art=document.createElement("div");
 if(item.image){
 const img=document.createElement("img");img.src=encodeURI(item.image);img.alt="Imagem ilustrativa da coleção "+item.title;img.loading="lazy";
 img.onerror=()=>{img.remove();const fallback=document.createElement("div");fallback.className="promo-placeholder";fallback.textContent=item.icon;art.append(fallback);sub.textContent="IMAGEM EM PRODUÇÃO • Coleção em preparação";button.textContent="💜 Ver coleção em produção"};
 art.append(img);
 }else{
 const fallback=document.createElement("div");fallback.className="promo-placeholder";fallback.textContent=item.icon;art.append(fallback);
 }
 const name=document.createElement("strong");name.textContent=item.title;
 const sub=document.createElement("small");sub.textContent=item.coming?"EM PRODUÇÃO • Novidades em breve":item.image?"Conheça os cards disponíveis":"IMAGEM EM PRODUÇÃO • Coleção em preparação";
 const button=document.createElement("button");button.type="button";button.textContent=(item.coming||!item.image)?"💜 Ver coleção em produção":"🛒 Ver cards da coleção";
 button.onclick=()=>openCollection(item.category,item.group);
 card.append(art,name,sub,button);root.append(card);
});
const search=document.getElementById("search");
search?.addEventListener("input",()=>{if(search.value.trim())panel.hidden=false});
})();