import {SUPABASE_URL,SUPABASE_ANON_KEY} from "./supabase-config.js";
const $=id=>document.getElementById(id),status=$("auth-status");
const show=(id,value)=>$(id).hidden=!value;
if(!SUPABASE_URL||!SUPABASE_ANON_KEY){status.textContent="Cadastro em preparação. Falta conectar o projeto Supabase.";show("auth-forms",false)}else{
  try{
    const {createClient}=await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
    const db=createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
    const say=(message)=>{status.textContent=message};
    async function refresh(){
      const {data:{user}}=await db.auth.getUser();
      show("auth-forms",!user);show("auth-account",!!user);show("admin-panel",false);
      if(!user){say("Entre ou crie sua conta.");return}
      say("Conta conectada com segurança.");
      const {data:profile,error:pe}=await db.from("profiles").select("full_name,email").eq("id",user.id).single();
      $("account-details").textContent=(profile?.full_name||user.email)+" • "+(profile?.email||user.email);
      const {data:ledger,error:le}=await db.from("star_ledger").select("stars").eq("user_id",user.id);
      $("account-stars").textContent=le?"Não foi possível consultar estrelas.":"Saldo confirmado: "+(ledger||[]).reduce((s,x)=>s+x.stars,0)+" ⭐";
      const {data:admin}=await db.from("admins").select("user_id").eq("user_id",user.id).maybeSingle();
      if(admin){show("admin-panel",true);await customers()}
    }
    let selectedProfile=null;
    async function customers(){
      const {data,error}=await db.from("profiles").select("id,full_name,email,created_at").order("created_at",{ascending:false}).limit(100);
      const root=$("admin-customers");root.replaceChildren();
      if(error){root.textContent="Não foi possível consultar clientes.";return}
      const title=document.createElement("p");title.textContent="Clientes cadastrados (até 100 mais recentes): "+data.length;root.append(title);
      const search=document.createElement("input");search.placeholder="Buscar cliente por nome ou e-mail";root.append(search);
      const list=document.createElement("div");root.append(list);
      function render(){list.replaceChildren();data.filter(p=>(p.full_name+" "+p.email).toLowerCase().includes(search.value.toLowerCase())).forEach(p=>{const row=document.createElement("div");row.className="cartline";const info=document.createElement("div");const strong=document.createElement("strong");strong.textContent=p.full_name||"Sem nome";const detail=document.createElement("small");detail.textContent=(p.email||"Sem e-mail")+" • "+p.id;info.append(strong,detail);const choose=document.createElement("button");choose.className="clear";choose.textContent="Selecionar";choose.onclick=()=>selectProfile(p);row.append(info,choose);list.append(row)})}
      search.oninput=render;render()
    }
    async function selectProfile(p){
      selectedProfile=p;$("admin-user").value=p.id;
      $("selected-client-name").textContent="Cliente: "+(p.full_name||"Sem nome")+" • "+(p.email||"Sem e-mail");
      const root=$("selected-client-history");root.textContent="Carregando histórico...";
      const [orders,entries]=await Promise.all([
        db.from("purchases").select("amount,note,created_at").eq("user_id",p.id).order("created_at",{ascending:false}).limit(30),
        db.from("star_ledger").select("stars").eq("user_id",p.id)
      ]);
      root.replaceChildren();
      if(orders.error||entries.error){root.textContent="Não foi possível consultar o histórico.";return}
      const balance=document.createElement("p");balance.textContent="⭐ Saldo de estrelas: "+entries.data.reduce((n,e)=>n+e.stars,0);root.append(balance);
      const heading=document.createElement("strong");heading.textContent="Histórico de compras confirmadas";root.append(heading);
      if(!orders.data.length){const empty=document.createElement("p");empty.textContent="Nenhuma compra confirmada.";root.append(empty)}
      const {data:redeems}=await db.from("star_redemptions").select("reward_type,created_at,note").eq("user_id",p.id).order("created_at",{ascending:false}).limit(20);if(redeems?.length){const label=document.createElement("strong");label.textContent="Resgates de estrelas";root.append(label);redeems.forEach(r=>{const line=document.createElement("p");line.textContent=new Date(r.created_at).toLocaleDateString("pt-BR")+" • "+(r.reward_type==="cards4"?"4 cards gratuitos":"R$ 10 de desconto")+(r.note?" • "+r.note:"");root.append(line)})}
      orders.data.forEach(o=>{const line=document.createElement("p");line.textContent=new Date(o.created_at).toLocaleDateString("pt-BR")+" • "+Number(o.amount).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})+(o.note?" • "+o.note:"");root.append(line)});
    }
    $("auth-signup").onclick=async()=>{const email=$("auth-email").value.trim(),password=$("auth-password").value,name=$("auth-name").value.trim();if(!name||!email||password.length<8){say("Informe nome, e-mail e senha com pelo menos 8 caracteres.");return}const {error}=await db.auth.signUp({email,password,options:{data:{full_name:name},emailRedirectTo:location.origin+location.pathname}});say(error?error.message:"Cadastro solicitado. Verifique seu e-mail para confirmar a conta.");await refresh()};
    $("auth-signin").onclick=async()=>{const {error}=await db.auth.signInWithPassword({email:$("auth-email").value.trim(),password:$("auth-password").value});say(error?error.message:"Login realizado.");if(!error)await refresh()};
    $("auth-google").onclick=async()=>{const {error}=await db.auth.signInWithOAuth({provider:"google",options:{redirectTo:location.origin+location.pathname}});if(error)say(error.message)};
    $("auth-signout").onclick=async()=>{await db.auth.signOut();await refresh()};
    $("admin-credit").onclick=async()=>{const user_id=$("admin-user").value.trim(),amount=Number($("admin-amount").value),note=$("admin-note").value.trim();if(!/^[0-9a-f-]{36}$/i.test(user_id)||!Number.isFinite(amount)||amount<=0){$("admin-status").textContent="Selecione um cliente e informe um valor válido.";return}const {data,error}=await db.rpc("confirm_purchase",{p_user_id:user_id,p_amount:amount,p_note:note});$("admin-status").textContent=error?"Erro: "+error.message:"Compra confirmada! "+data+" estrela(s) creditada(s).";if(!error){$("admin-amount").value="";$("admin-note").value="";if(selectedProfile)await selectProfile(selectedProfile);await refresh()}};
    let redeemBusy=false;
    $("redeem-confirm").onclick=async()=>{
      const message=$("redeem-status"),button=$("redeem-confirm");
      if(redeemBusy)return;
      if(!selectedProfile){message.textContent="Selecione um cliente primeiro.";return}
      const amount=Number($("redeem-order").value),type=$("redeem-type").value,note=$("redeem-note").value.trim();
      if(!Number.isFinite(amount)||amount<30){message.textContent="Informe um pedido de pelo menos R$ 30.";return}
      const reward=type==="cards4"?"4 cards gratuitos":"R$ 10 de desconto";
      if(!confirm("Confirmar resgate de 10 estrelas para "+(selectedProfile.full_name||selectedProfile.email)+"? Recompensa: "+reward+". Pedido: R$ "+amount.toFixed(2)))return;
      redeemBusy=true;button.disabled=true;message.textContent="Registrando resgate...";
      try{
        const {data,error}=await db.rpc("redeem_stars",{p_user_id:selectedProfile.id,p_reward_type:type,p_order_amount:amount,p_note:note,p_request_id:crypto.randomUUID()});
        message.textContent=error?"Resgate não realizado: "+error.message:"Resgate confirmado! Saldo restante: "+data+" ⭐";
        if(!error){$("redeem-order").value="";$("redeem-note").value="";await selectProfile(selectedProfile);await refresh()}
      }finally{redeemBusy=false;button.disabled=false}
    };
    db.auth.onAuthStateChange(()=>setTimeout(refresh,0));
    await refresh();
  }catch(e){status.textContent="Falha ao iniciar autenticação. Confira a configuração e a conexão."}
}
