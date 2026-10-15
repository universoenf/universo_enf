/* Universo ENF: modalidades de compra, preços de lançamento */
(()=>{
const catalog=[
["Sistema Esquelético",54],["Sistema Articular",12],["Sistema Tegumentar",18],["Sistema Urinário",18],["Sistema Endócrino",28],["Sistema Respiratório",34],["Sistema Linfático",32],["Sistema Cardiovascular",24],["Sistema Digestivo",42],["Farmacologia",250],["Urgência e Emergência",62],["Dispositivos",32],["Escalas",26],["Semiologia",8],["Procedimentos",84],["Relatórios",46],["Feridas e Curativos",20],["Exames",18],["Enfermagem Cirúrgica",122],["Saúde da Criança",32],["Saúde da Mulher",22],["Saúde do Adolescente",2],["Saúde do Homem",4],["Saúde do Idoso",8],["Comorbidades",2]];
const packs=[["Kit Mini",10,30],["Kit Básico",20,55],["Kit Essencial",30,75],["Kit por Matéria",40,90],["Kit Premium",50,140],["Kit Completo Plus",100,250]];
const money=n=>"R$ "+n.toFixed(2).replace(".",",");
let mode="avulso",choice=0,qty=1,first=false,pack=0;
const $=id=>document.getElementById(id),root=$("buycontrols");
function current(){
 if(mode==="avulso")return {count:qty,amount:qty*2.5,label:qty+" card(s) avulso(s)"};
 if(mode==="kit"){let p=packs[pack];return {count:p[1],amount:p[2],label:p[0]};}
 let c=catalog[choice];return {count:c[1],amount:c[1]*2.5*(first?.5:1),label:"Conjunto completo: "+c[0]};
}
function render(){
 document.querySelectorAll(".buytabs button").forEach(b=>b.classList.toggle("active",b.dataset.mode===mode));
 if(mode==="avulso")root.innerHTML='<div class="buyfield"><label for="buyqty">Quantidade de cards avulsos (R$ 2,50 cada)</label><input id="buyqty" type="number" min="1" max="1000" step="1" value="'+qty+'"></div><p class="buy-note">Informe os nomes dos cards desejados na mensagem do WhatsApp.</p>';
 if(mode==="conjunto")root.innerHTML='<div class="buyfield"><label for="buyset">Selecione o conjunto completo</label><select id="buyset">'+catalog.map((c,i)=>'<option value="'+i+'" '+(choice===i?"selected":"")+' '+(c[1]===null?"disabled":"")+'>'+c[0]+(c[1]===null?" · Em produção":" · "+c[1]+" cards")+'</option>').join("")+'</select></div><label class="buycheck"><input type="checkbox" id="buyfirst" '+(first?"checked":"")+'> É minha primeira compra na Universo ENF</label><p class="buy-note">Primeira compra: 50% de desconto sobre o conjunto completo. A elegibilidade será conferida no atendimento pelo WhatsApp. O desconto não se aplica a cards avulsos ou kits personalizados.</p>';
 if(mode==="kit")root.innerHTML='<div class="buyfield"><label for="buypack">Escolha seu kit personalizado</label><select id="buypack">'+packs.map((p,i)=>'<option value="'+i+'" '+(pack===i?"selected":"")+'>'+p[0]+' · '+p[1]+' cards · '+money(p[2])+'</option>').join("")+'</select></div><p class="buy-note">Tabela de kits anterior mantida provisoriamente. Alguns kits podem custar mais do que cards avulsos; confira as opções antes de pedir.</p>';
 const q=$("buyqty"),c=$("buyset"),f=$("buyfirst"),p=$("buypack");
 if(q)q.oninput=()=>{qty=Math.max(1,Math.min(1000,Math.floor(Number(q.value)||1)));update()};
 if(c)c.onchange=()=>{choice=Number(c.value);update()};
 if(f)f.onchange=()=>{first=f.checked;update()};
 if(p)p.onchange=()=>{pack=Number(p.value);update()};
 update();
}
function update(){let x=current();$("buytotal").textContent=money(x.amount);$("buydisclaimer").textContent=mode==="conjunto"&&first?"Valor promocional sujeito à confirmação da primeira compra pelo WhatsApp.":mode==="kit"?"Kits com valores anteriores; compare com a compra avulsa antes de confirmar.":"Preço de lançamento: R$ 2,50 por card.";}
document.querySelectorAll(".buytabs button").forEach(b=>b.addEventListener("click",()=>{mode=b.dataset.mode;render()}));
$("buywa").onclick=()=>{
 let x=current();let note=mode==="conjunto"?(first?"Solicito desconto de primeira compra, sujeito a confirmação.":"Compra sem desconto de primeira compra."):"";
 let msg=["💜 *PEDIDO UNIVERSO ENF*","*Modalidade:* "+({avulso:"Cards avulsos",conjunto:"Conjunto completo",kit:"Kit personalizado"}[mode]),"*Seleção:* "+x.label,"*Quantidade:* "+x.count+" cards","*Valor estimado:* "+money(x.amount),note,mode==="avulso"||mode==="kit"?"Gostaria de informar os conteúdos desejados.":"","Por favor, confirme disponibilidade, preço e condições do pedido."].filter(Boolean).join("\n");
 window.open("https://wa.me/5596991522760?text="+encodeURIComponent(msg),"_blank","noopener");
};
render();
})();