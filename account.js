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
    async function customers(){
      const {data,error}=await db.from("profiles").select("id,full_name,email,created_at").order("created_at",{ascending:false}).limit(100);
      const root=$("admin-customers");root.replaceChildren();
      if(error){root.textContent="Não foi possível consultar clientes.";return}
      const title=document.createElement("p");title.textContent="Clientes cadastrados (até 100 mais recentes): "+data.length;root.append(title);
      data.forEach(p=>{const row=document.createElement("div");row.className="cartline";const info=document.createElement("div");const strong=document.createElement("strong");strong.textContent=p.full_name||"Sem nome";const detail=document.createElement("small");detail.textContent=(p.email||"Sem e-mail")+" • "+p.id;info.append(strong,detail);const choose=document.createElement("button");choose.className="clear";choose.textContent="Selecionar";choose.onclick=()=>{$("admin-user").value=p.id;$("admin-amount").focus()};row.append(info,choose);root.append(row)})
    }
    $("auth-signup").onclick=async()=>{const email=$("auth-email").value.trim(),password=$("auth-password").value,name=$("auth-name").value.trim();if(!name||!email||password.length<8){say("Informe nome, e-mail e senha com pelo menos 8 caracteres.");return}const {error}=await db.auth.signUp({email,password,options:{data:{full_name:name},emailRedirectTo:location.origin+location.pathname}});say(error?error.message:"Cadastro solicitado. Verifique seu e-mail para confirmar a conta.");await refresh()};
    $("auth-signin").onclick=async()=>{const {error}=await db.auth.signInWithPassword({email:$("auth-email").value.trim(),password:$("auth-password").value});say(error?error.message:"Login realizado.");if(!error)await refresh()};
    $("auth-google").onclick=async()=>{const {error}=await db.auth.signInWithOAuth({provider:"google",options:{redirectTo:location.origin+location.pathname}});if(error)say(error.message)};
    $("auth-signout").onclick=async()=>{await db.auth.signOut();await refresh()};
    $("admin-credit").onclick=async()=>{const user_id=$("admin-user").value.trim(),amount=Number($("admin-amount").value),note=$("admin-note").value.trim();if(!/^[0-9a-f-]{36}$/i.test(user_id)||!Number.isFinite(amount)||amount<=0){$("admin-status").textContent="Selecione um cliente e informe um valor válido.";return}const {data,error}=await db.rpc("confirm_purchase",{p_user_id:user_id,p_amount:amount,p_note:note});$("admin-status").textContent=error?"Erro: "+error.message:"Compra confirmada! "+data+" estrela(s) creditada(s).";if(!error){$("admin-amount").value="";$("admin-note").value=""}};
    db.auth.onAuthStateChange(()=>setTimeout(refresh,0));
    await refresh();
  }catch(e){status.textContent="Falha ao iniciar autenticação. Confira a configuração e a conexão."}
}
