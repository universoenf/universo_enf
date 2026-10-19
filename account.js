import {SUPABASE_URL,SUPABASE_ANON_KEY} from "./supabase-config.js";
const $=id=>document.getElementById(id);
const status=$("auth-status");
const show=(id,visible)=>{const el=$(id);if(el)el.hidden=!visible};
if(!SUPABASE_URL||!SUPABASE_ANON_KEY){
  status.textContent="Cadastro em preparação. Falta conectar o projeto Supabase.";
  show("auth-forms",false);
}else{
  try{
    const {createClient}=await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
    const db=createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
    const say=message=>{status.textContent=message};
    async function refresh(){
      const {data:{user}}=await db.auth.getUser();
      show("auth-forms",!user);
      show("auth-account",!!user);
      show("admin-entry",false);
      if(!user){say("Entre ou crie sua conta.");return}
      say("Conta conectada com segurança.");
      const {data:profile}=await db.from("profiles").select("full_name,email").eq("id",user.id).maybeSingle();
      $("account-details").textContent=(profile?.full_name||user.email)+" • "+(profile?.email||user.email);
      const {data:ledger,error}=await db.from("star_ledger").select("stars").eq("user_id",user.id);
      $("account-stars").textContent=error?"Não foi possível consultar estrelas.":"Saldo confirmado: "+(ledger||[]).reduce((sum,row)=>sum+Number(row.stars||0),0)+" ⭐";
      const {data:admin,error:adminError}=await db.from("admins").select("user_id").eq("user_id",user.id).maybeSingle();
      show("admin-entry",!adminError&&!!admin);
    }
    $("auth-signup").onclick=async()=>{
      const email=$("auth-email").value.trim(),password=$("auth-password").value,name=$("auth-name").value.trim();
      if(!name||!email||password.length<8){say("Informe nome, e-mail e senha com pelo menos 8 caracteres.");return}
      const {error}=await db.auth.signUp({email,password,options:{data:{full_name:name},emailRedirectTo:location.origin+location.pathname}});
      say(error?error.message:"Cadastro solicitado. Verifique seu e-mail para confirmar a conta.");
      if(!error)await refresh();
    };
    $("auth-signin").onclick=async()=>{
      const {error}=await db.auth.signInWithPassword({email:$("auth-email").value.trim(),password:$("auth-password").value});
      say(error?error.message:"Login realizado.");
      if(!error)await refresh();
    };
    $("auth-google").onclick=async()=>{
      const {error}=await db.auth.signInWithOAuth({provider:"google",options:{redirectTo:location.origin+location.pathname}});
      if(error)say(error.message);
    };
    $("auth-signout").onclick=async()=>{await db.auth.signOut();await refresh()};
    db.auth.onAuthStateChange(()=>setTimeout(refresh,0));
    await refresh();
  }catch(e){status.textContent="Falha ao iniciar autenticação. Confira a configuração e a conexão."}
}
