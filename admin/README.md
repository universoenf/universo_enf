# Universo ENF Admin

PWA separado em /admin/. Esta versão apresenta o painel e a estrutura de autenticação, **não** um backend configurado.

## Ativação segura
1. Criar projeto Supabase, configurar autenticação por email e senha e habilitar MFA para a administradora.
2. Criar tabelas admin_users (user_id uuid primary key references auth.users(id)), products, orders e customers com esquemas apropriados.
3. Habilitar Row Level Security em TODAS as tabelas e escrever políticas que verifiquem auth.uid() em admin_users. Restringir rigorosamente INSERT/UPDATE/DELETE de admin_users, exclusivamente via ambiente confiável (nunca permitir autoelevação).
4. Inserir user_id da administradora por console administrativo seguro. Não colocar credenciais de serviço no GitHub.
5. Preencher config.js somente com URL e chave pública anon/publishable do projeto. Nunca colocar senha, service_role ou segredo nesse arquivo.
6. Integrar a loja pública ao mesmo banco com políticas próprias, validar fluxos e evitar exposição de dados pessoais.
7. Adicionar ícones PNG 192/512 e apple-touch-icon PNG para compatibilidade de instalação.

Observação: GitHub Pages é hospedagem pública. A página /admin/ não é secreta; proteção real depende de Supabase Auth e RLS. O painel inicial faz somente consultas e usa limites de 100 registros, sem números de faturamento calculados. Não cadastrar dados reais até finalizar a segurança.