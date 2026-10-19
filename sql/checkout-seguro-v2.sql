-- Universo ENF: checkout seguro, versão 2.
-- Executar no SQL Editor do Supabase antes de atualizar o site.
-- Não altera a função antiga até a migração do checkout.
CREATE OR REPLACE FUNCTION public.enf_register_store_order_v2(
  p_request_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_items text,
  p_product_code text,
  p_quantity integer,
  p_first_purchase_requested boolean DEFAULT false,
  p_notes text DEFAULT ''
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_unit_price numeric;
  v_total numeric;
  v_expected_cards integer;
  v_cards integer;
  v_order_id bigint;
  v_phone text;
  v_notes text;
BEGIN
  v_phone := regexp_replace(coalesce(p_customer_phone,''), '[^0-9]', '', 'g');
  IF left(v_phone,2) = '55' AND length(v_phone) IN (12,13) THEN
    v_phone := substring(v_phone FROM 3);
  END IF;
  IF p_request_id IS NULL
     OR length(v_phone) NOT IN (10,11)
     OR p_quantity IS NULL OR p_quantity < 1 OR p_quantity > 1000
     OR length(trim(coalesce(p_items,''))) = 0 OR length(p_items) > 3000
     OR length(coalesce(p_customer_name,'')) > 120
     OR length(coalesce(p_customer_phone,'')) > 30
     OR length(coalesce(p_notes,'')) > 2500
  THEN
    RAISE EXCEPTION 'Dados inválidos';
  END IF;

  SELECT price INTO v_unit_price
  FROM public.enf_store_prices
  WHERE product_code = p_product_code AND is_active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'Produto indisponível'; END IF;

  IF p_product_code = 'card_avulso' THEN
    v_cards := p_quantity;
    v_total := v_unit_price * p_quantity;
  ELSIF p_product_code LIKE 'kit_%' THEN
    IF p_quantity <> 1 THEN RAISE EXCEPTION 'Quantidade inválida para kit'; END IF;
    v_expected_cards := substring(p_product_code FROM '^kit_([0-9]+)$')::integer;
    IF v_expected_cards IS NULL OR v_expected_cards NOT IN (10,20,30,40,50,100)
    THEN RAISE EXCEPTION 'Kit inválido'; END IF;
    v_cards := v_expected_cards;
    v_total := v_unit_price;
  ELSIF p_product_code LIKE 'conjunto_%' THEN
    IF p_quantity <> 1 THEN RAISE EXCEPTION 'Quantidade inválida para conjunto'; END IF;
    IF mod(v_unit_price, 2.50) <> 0 THEN
      RAISE EXCEPTION 'Preço do conjunto inconsistente';
    END IF;
    v_cards := (v_unit_price / 2.50)::integer;
    v_total := v_unit_price;
  ELSE
    RAISE EXCEPTION 'Produto inválido';
  END IF;

  IF p_first_purchase_requested AND p_product_code NOT LIKE 'conjunto_%'
  THEN RAISE EXCEPTION 'Promoção disponível apenas para conjuntos'; END IF;

  v_notes := trim(concat_ws(' | ', nullif(trim(coalesce(p_notes,'')), ''),
    'Origem: checkout v2; produto: ' || p_product_code,
    CASE WHEN p_first_purchase_requested THEN
      'Cliente solicitou desconto de primeira compra (50%); sujeito à aprovação administrativa'
    ELSE NULL END));

  INSERT INTO public.enf_orders
    (store_request_id,customer_name,customer_phone,items,quantity,
     total_amount,status,payment_status,notes)
  VALUES
    (p_request_id,coalesce(nullif(trim(p_customer_name),''),'Cliente pelo site'),
     v_phone,p_items,v_cards,round(v_total,2),'Pendente','Aguardando',v_notes)
  ON CONFLICT (store_request_id) DO NOTHING
  RETURNING id INTO v_order_id;

  IF v_order_id IS NULL THEN
    SELECT id INTO v_order_id FROM public.enf_orders
    WHERE store_request_id = p_request_id;
    IF v_order_id IS NULL THEN RAISE EXCEPTION 'Não foi possível recuperar pedido'; END IF;
  END IF;
  RETURN jsonb_build_object('order_id',v_order_id,'total_amount',round(v_total,2),
    'discount_pending',coalesce(p_first_purchase_requested,false));
END;
$$;
REVOKE ALL ON FUNCTION public.enf_register_store_order_v2(
  uuid,text,text,text,text,integer,boolean,text
) FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.enf_register_store_order_v2(
  uuid,text,text,text,text,integer,boolean,text
) TO anon, authenticated;
