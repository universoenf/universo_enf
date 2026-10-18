/* Universo ENF: modalidades de compra, preços de lançamento */
(()=>{
const catalog=[
["Sistema Esquelético",54],["Sistema Articular",12],["Sistema Tegumentar",18],["Sistema Urinário",18],["Sistema Endócrino",28],["Sistema Respiratório",34],["Sistema Linfático",32],["Sistema Cardiovascular",24],["Sistema Digestivo",42],["Farmacologia",250],["Urgência e Emergência",62],["Dispositivos",32],["Escalas",26],["Semiologia",9],["Semiotécnica",43],["Relatórios",null],["Terminologias",null],["Feridas e Curativos",20],["Exames Laboratoriais",7],["Enfermagem Cirúrgica",122],["Saúde da Criança",32],["Saúde da Mulher",22],["Saúde do Adolescente",65],["Saúde do Homem",4],["Saúde do Idoso",8],["Comorbidades",2]];
const packs=[["Kit Mini",10,30],["Kit Básico",20,55],["Kit Essencial",30,75],["Kit por Matéria",40,90],["Kit Premium",50,140],["Kit Completo Plus",100,250]];
const money=n=>"R$ "+n.toFixed(2).replace(".",",");
let mode="avulso",choice=0,qty=1,first=false,pack=0;
const $=id=>document.getElementById(id),root=$("buycontrols");
function current(){
 if(mode==="avulso"){const selected=typeof S!=="undefined"?[...S.values()]:[];const count=selected.reduce((n,x)=>n+x.qty,0);return {count,amount:count*2.5,label:count+" card(s) avulso(s)",selected};}
 if(mode==="kit"){let p=packs[pack];return {count:p[1],amount:p[2],label:p[0]};}
 let c=catalog[choice];return {count:c[1],amount:c[1]*2.5*(first?.5:1),label:"Conjunto completo: "+c[0]};
}
function render(){
 document.querySelectorAll(".buytabs button").forEach(b=>b.classList.toggle("active",b.dataset.mode===mode));
 if(mode==="avulso")root.innerHTML='<p class="buy-note">Marque os cards desejados na lista de coleções abaixo. Os nomes e quantidades serão incluídos automaticamente no WhatsApp.</p><div id="buyselected" class="buyfield" aria-live="polite"></div><button type="button" id="goto-catalog" class="clear">📚 Escolher cards no catálogo</button>';
 if(mode==="conjunto"&&catalog[choice][1]===null)choice=catalog.findIndex(x=>x[1]!==null);
 if(mode==="conjunto")root.innerHTML='<div class="buyfield"><label for="buyset">Selecione o conjunto completo</label><select id="buyset">'+catalog.map((c,i)=>'<option value="'+i+'" '+(choice===i?"selected":"")+' '+(c[1]===null?"disabled":"")+'>'+c[0]+(c[1]===null?" · Em produção":" · "+c[1]+" cards")+'</option>').join("")+'</select></div><label class="buycheck"><input type="checkbox" id="buyfirst" '+(first?"checked":"")+'> É minha primeira compra na Universo ENF</label><p class="buy-note">Primeira compra: 50% de desconto sobre o conjunto completo. A elegibilidade será conferida no atendimento pelo WhatsApp. O desconto não se aplica a cards avulsos ou kits personalizados.</p>';
 if(mode==="kit")root.innerHTML='<div class="buyfield"><label for="buypack">Escolha seu kit personalizado</label><select id="buypack">'+packs.map((p,i)=>'<option value="'+i+'" '+(pack===i?"selected":"")+'>'+p[0]+' · '+p[1]+' cards · '+money(p[2])+'</option>').join("")+'</select></div><p class="buy-note">Tabela de kits anterior mantida provisoriamente. Alguns kits podem custar mais do que cards avulsos; confira as opções antes de pedir.</p>';
 const go=$("goto-catalog");if(go)go.onclick=()=>document.getElementById("categorias")?.scrollIntoView({behavior:"smooth"});const q=$("buyqty"),c=$("buyset"),f=$("buyfirst"),p=$("buypack");
 if(q)q.oninput=()=>{qty=Math.max(1,Math.min(1000,Math.floor(Number(q.value)||1)));update()};
 if(c)c.onchange=()=>{choice=Number(c.value);update()};
 if(f)f.onchange=()=>{first=f.checked;update()};
 if(p)p.onchange=()=>{pack=Number(p.value);update()};
 update();
}
function update(){let x=current();if(mode==="avulso"){const el=$("buyselected");if(el){el.replaceChildren();const title=document.createElement("strong");title.textContent=x.count?"Cards selecionados ("+x.count+"):":"Nenhum card selecionado ainda.";el.append(title);(x.selected||[]).forEach(item=>{const line=document.createElement("div");line.textContent="• "+item.cat+" | "+item.name+" ("+item.qty+" card"+(item.qty>1?"s":"")+")";el.append(line)})}}$("buytotal").textContent=money(x.amount);$("buydisclaimer").textContent=mode==="conjunto"&&first?"Valor promocional sujeito à confirmação da primeira compra pelo WhatsApp.":mode==="kit"?"Kits com valores anteriores; compare com a compra avulsa antes de confirmar.":"Preço de lançamento: R$ 2,50 por card.";}
document.querySelectorAll(".buytabs button").forEach(b=>b.addEventListener("click",()=>{mode=b.dataset.mode;render()}));
$("buywa").onclick=()=>{
 let x=current();if(mode==="avulso"&&!x.count){alert("Selecione os cards no catálogo antes de enviar o pedido.");document.getElementById("categorias")?.scrollIntoView({behavior:"smooth"});return}let note=mode==="conjunto"?(first?"Solicito desconto de primeira compra, sujeito a confirmação.":"Compra sem desconto de primeira compra."):"";
 let lines=mode==="avulso"?(x.selected||[]).map(i=>"• "+i.cat+" / "+i.name+" ("+i.qty+" card"+(i.qty>1?"s":"")+")"):[];let msg=["💜 *PEDIDO UNIVERSO ENF*","*Modalidade:* "+({avulso:"Cards avulsos",conjunto:"Conjunto completo",kit:"Kit personalizado"}[mode]),"*Seleção:* "+x.label,...(lines.length?["*Cards escolhidos:*",...lines]:[]),"*Quantidade:* "+x.count+" cards","*Valor estimado:* "+money(x.amount),note,mode==="kit"?"Gostaria de informar os conteúdos desejados.":"","Por favor, confirme disponibilidade, preço e condições do pedido."].filter(Boolean).join("\n");
 window.open("https://wa.me/5596991522760?text="+encodeURIComponent(msg),"_blank","noopener");
};
render();
if(typeof S!=="undefined"){const originalUp=up;up=function(){originalUp();if(mode==="avulso")update()}}
})();