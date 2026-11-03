-- Textos legales editables desde el panel (borradores; los datos del titular van entre {{llaves}})
-- y Libro de Reclamaciones virtual con registro correlativo.

create table public.legal_sections (
  id text primary key,
  title text not null,
  body text not null,
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.legal_sections enable row level security;
create policy "legal_lectura_publica" on public.legal_sections for select to anon, authenticated using (true);
create policy "admin_legal" on public.legal_sections for all to authenticated
  using (exists (select 1 from public.staff_profiles s where s.user_id = (select auth.uid()) and s.role = 'admin'))
  with check (exists (select 1 from public.staff_profiles s where s.user_id = (select auth.uid()) and s.role = 'admin'));

insert into public.store_settings (key, value) values
  ('biz_legal_name', ''), ('biz_ruc', ''), ('biz_address', ''), ('biz_email', ''), ('biz_phone', ''), ('biz_city', ''),
  ('biz_payment_methods', 'transferencia bancaria, Yape o Plin (a coordinar por WhatsApp)'),
  ('change_days', '7'), ('complaints_days', '15');

insert into public.legal_sections (id, title, body, sort_order) values
('terminos', 'Términos y condiciones', $t$## 1. Quiénes somos
{{razon_social}}, con RUC {{ruc}} y domicilio en {{domicilio}}, es titular de la tienda MariArte | Joyería y Accesorios, disponible en {{sitio}}. Puedes contactarnos por WhatsApp al {{whatsapp}} o al correo {{correo}}.

## 2. Productos y precios
Los precios están expresados en soles (S/) y son referenciales hasta que la tienda confirme tu pedido. Las fotografías son referenciales: por tratarse de piezas con detalles artesanales, pueden existir ligeras diferencias de tono, tamaño o forma. La disponibilidad depende del stock al momento de confirmar el pedido.

## 3. Cómo se realiza un pedido
Registrar un pedido en la web es una solicitud de compra, no una venta confirmada. La compra se perfecciona cuando la tienda confirma por WhatsApp la disponibilidad, el precio final, el costo de envío, la forma de pago y la entrega. Podemos cancelar un pedido si no hay stock o si no es posible entregarlo, y te avisaremos por el mismo medio.

## 4. Pago
Los pagos se coordinan directamente con la tienda: {{medios_pago}}. Esta web no cobra en línea ni solicita datos de tarjetas. Nunca compartas datos bancarios por el chat del asistente.

## 5. Personalización
Las dedicatorias y los empaques de regalo se preparan según lo que indiques. La tienda puede rechazar textos ofensivos, ilegales o que vulneren derechos de terceros. Las piezas personalizadas pueden tener condiciones distintas de cambio (ver Cambios y devoluciones).

## 6. Envíos, cambios y reclamos
El envío se rige por la Política de envíos y los cambios por la Política de cambios y devoluciones. Para reclamos y quejas contamos con un Libro de Reclamaciones virtual.

## 7. Propiedad intelectual
La marca MariArte, las fotografías y los textos de esta web pertenecen a su titular y no pueden usarse sin autorización.

## 8. Ley aplicable
Estos términos se rigen por las leyes de la República del Perú. Cualquier controversia se someterá a los jueces y tribunales de {{ciudad}}, sin perjuicio de los derechos que la ley reconoce al consumidor.

## 9. Cambios en estos términos
Podemos actualizar estos términos. La versión vigente es la publicada en esta página.$t$, 1),
('privacidad', 'Política de privacidad', $t$## 1. Responsable del tratamiento
{{razon_social}} (RUC {{ruc}}), con domicilio en {{domicilio}}, es responsable del tratamiento de tus datos personales, de acuerdo con la Ley N.° 29733, Ley de Protección de Datos Personales, y su reglamento. Contacto: {{correo}} · WhatsApp {{whatsapp}}.

## 2. Qué datos recopilamos
- Al hacer un pedido: nombre, celular, distrito o ciudad, dirección (si la indicas), productos elegidos y dedicatoria o nota de regalo.
- Al dejar un aviso de stock: nombre, celular, correo (opcional) y nota.
- Al presentar un reclamo: los datos que exige el Libro de Reclamaciones (nombre, documento, domicilio, teléfono, correo y detalle).
- Al usar el asistente virtual: los mensajes que escribas.
- Al contactarnos: el contenido que nos envíes por WhatsApp.

## 3. Para qué los usamos
Para registrar, confirmar, preparar y entregar tu pedido; permitirte seguir su estado con tu código y celular; avisarte cuando vuelva un producto (solo si lo pides); atender tus consultas y reclamos; y cumplir obligaciones legales. No vendemos tus datos ni los usamos para publicidad de terceros.

## 4. Con quién los compartimos
Solo con proveedores necesarios para operar la tienda: servicios de alojamiento y base de datos (Supabase y Vercel), empresas de transporte para entregar tu pedido, y, si usas el asistente virtual con inteligencia artificial, el proveedor que procesa tus mensajes (OpenAI). Algunos de estos proveedores tienen servidores fuera del Perú, por lo que tus datos pueden almacenarse o procesarse en otros países con medidas de seguridad adecuadas. No compartas datos sensibles en el chat del asistente.

## 5. Cuánto tiempo los conservamos
Por el tiempo necesario para atender tu pedido, tus consultas y reclamos, y durante los plazos que la ley exija para conservar información comercial y de consumo.

## 6. Tus derechos
Puedes ejercer tus derechos de acceso, rectificación, cancelación y oposición escribiéndonos a {{correo}} o por WhatsApp al {{whatsapp}}, indicando tu nombre y qué deseas solicitar. Si consideras que no atendimos tu solicitud, puedes acudir a la Autoridad Nacional de Protección de Datos Personales.

## 7. Almacenamiento en tu dispositivo
Para que no pierdas tu carrito, tus favoritos y no tengas que escribir de nuevo tus datos de contacto, guardamos esa información en tu navegador (almacenamiento local). No usamos cookies de publicidad ni de seguimiento de terceros. Puedes borrar esos datos en cualquier momento limpiando los datos del sitio.

## 8. Seguridad
Aplicamos medidas técnicas y organizativas razonables para proteger tus datos: conexión cifrada (HTTPS), acceso restringido al panel de administración y límites contra el uso indebido.

## 9. Cambios
Podemos actualizar esta política. La versión vigente es la publicada en esta página.$t$, 2),
('envios', 'Política de envíos', $t$## Cobertura
Realizamos envíos a todo el Perú. Las zonas, los costos y los tiempos estimados vigentes se muestran al elegir tu zona de envío en el carrito. Si tu zona no aparece, la tienda te indicará el costo y el plazo por WhatsApp antes de confirmar el pedido.

## Costo
El costo de envío se calcula según la zona elegida y se suma al total del pedido. Algunos pedidos pueden tener envío gratis según las condiciones vigentes de la tienda. En destinos que requieran una empresa de transporte, el costo final se confirma con la tienda antes de pagar.

## Plazos
Los plazos son estimados y comienzan a contarse desde que el pedido está confirmado y pagado. Pueden variar por la empresa de transporte, el destino o causas de fuerza mayor. La tienda no garantiza fechas exactas hasta confirmarlas contigo.

## Recojo en tienda
Si la tienda habilita el recojo, se coordina día y hora por WhatsApp. Domicilio de recojo: {{domicilio}}.

## Dirección y recepción
Es importante que los datos de entrega estén completos y correctos. Si la dirección es incorrecta o no hay quien reciba el pedido, podrían generarse costos adicionales de reenvío.

## Seguimiento
Puedes consultar el estado de tu pedido en {{sitio}}/pedido con tu código y celular.$t$, 3),
('cambios', 'Cambios y devoluciones', $t$## Si tu pedido llega con un problema
Si recibes un producto defectuoso, dañado o distinto al que pediste, escríbenos por WhatsApp al {{whatsapp}} dentro de los {{dias_cambio}} días calendario siguientes a la recepción, con fotos y tu código de pedido. Evaluaremos el caso y, según corresponda, cambiaremos el producto, repararemos la pieza o devolveremos el dinero, conforme a la ley.

## Cambios por otra razón
Si deseas cambiar una pieza por otra razón (por ejemplo, talla o preferencia), consúltanos dentro de los {{dias_cambio}} días calendario desde la recepción. El producto debe estar sin uso, en buen estado y con su empaque. El costo de envío del cambio lo asume el cliente, salvo que el cambio se deba a un error de la tienda.

## Piezas personalizadas
Los productos con dedicatoria o personalización hechos a pedido solo admiten cambio o devolución si presentan defectos de fabricación o no corresponden a lo solicitado.

## Cómo se devuelve el dinero
Cuando proceda una devolución, se reembolsa por el mismo medio de pago utilizado o el que acordemos contigo.

## Reclamos
Si no estás conforme con la respuesta, puedes presentar un reclamo en nuestro Libro de Reclamaciones virtual.$t$, 4);

create sequence public.complaint_seq start 1;

create table public.complaints (
  id bigint generated always as identity primary key,
  number text not null unique,
  created_at timestamptz not null default now(),
  consumer_name text not null,
  doc_type text not null check (doc_type in ('DNI','CE','Pasaporte','RUC')),
  doc_number text not null,
  address text not null,
  phone text not null,
  email text not null,
  guardian_name text,
  item_type text not null check (item_type in ('producto','servicio')),
  item_description text not null,
  amount numeric(10,2) check (amount is null or amount >= 0),
  kind text not null check (kind in ('reclamo','queja')),
  detail text not null,
  request text not null,
  order_code text,
  consent boolean not null check (consent),
  status text not null default 'pendiente' check (status in ('pendiente','respondido')),
  response text,
  responded_at timestamptz,
  ip_hash text
);
create index complaints_status_idx on public.complaints(status, created_at desc);
create index complaints_ip_idx on public.complaints(ip_hash, created_at desc);
alter table public.complaints enable row level security;
create policy "admin_reclamos" on public.complaints for all to authenticated
  using (exists (select 1 from public.staff_profiles s where s.user_id = (select auth.uid()) and s.role = 'admin'))
  with check (exists (select 1 from public.staff_profiles s where s.user_id = (select auth.uid()) and s.role = 'admin'));

create function public.submit_complaint(
  p_name text, p_doc_type text, p_doc_number text, p_address text, p_phone text, p_email text,
  p_item_type text, p_item_description text, p_amount numeric, p_kind text,
  p_detail text, p_request text, p_order_code text default '', p_guardian text default '', p_consent boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := trim(coalesce(p_name, ''));
  v_doc text := upper(regexp_replace(coalesce(p_doc_number, ''), '\s', '', 'g'));
  v_address text := trim(coalesce(p_address, ''));
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g');
  v_email text := lower(trim(coalesce(p_email, '')));
  v_item text := trim(coalesce(p_item_description, ''));
  v_detail text := trim(coalesce(p_detail, ''));
  v_request text := trim(coalesce(p_request, ''));
  v_order text := upper(trim(coalesce(p_order_code, '')));
  v_guardian text := nullif(trim(coalesce(p_guardian, '')), '');
  v_headers text := nullif(current_setting('request.headers', true), '');
  v_ip text := '';
  v_hash text;
  v_number text;
  v_created timestamptz;
begin
  if not coalesce(p_consent, false) then raise exception 'Debes aceptar el tratamiento de tus datos para registrar el reclamo'; end if;
  if char_length(v_name) < 3 or char_length(v_name) > 120 then raise exception 'Escribe tu nombre completo'; end if;
  if p_doc_type not in ('DNI','CE','Pasaporte','RUC') then raise exception 'Elige el tipo de documento'; end if;
  if (p_doc_type = 'DNI' and v_doc !~ '^[0-9]{8}$')
     or (p_doc_type = 'RUC' and v_doc !~ '^[0-9]{11}$')
     or (p_doc_type in ('CE','Pasaporte') and v_doc !~ '^[A-Z0-9]{6,12}$') then
    raise exception 'El número de documento no es válido para el tipo elegido';
  end if;
  if char_length(v_address) < 5 or char_length(v_address) > 200 then raise exception 'Escribe tu domicilio'; end if;
  if v_phone !~ '^\+?[0-9]{7,15}$' then raise exception 'Escribe un teléfono válido'; end if;
  if char_length(v_email) > 120 or v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$' then raise exception 'Escribe un correo válido'; end if;
  if p_item_type not in ('producto','servicio') then raise exception 'Indica si se trata de un producto o un servicio'; end if;
  if char_length(v_item) < 3 or char_length(v_item) > 300 then raise exception 'Describe el producto o servicio'; end if;
  if p_amount is not null and (p_amount < 0 or p_amount > 1000000) then raise exception 'El monto reclamado no es válido'; end if;
  if p_kind not in ('reclamo','queja') then raise exception 'Elige si es un reclamo o una queja'; end if;
  if char_length(v_detail) < 10 or char_length(v_detail) > 1500 then raise exception 'Cuéntanos qué ocurrió (10 a 1500 caracteres)'; end if;
  if char_length(v_request) < 5 or char_length(v_request) > 800 then raise exception 'Indica qué solicitas (5 a 800 caracteres)'; end if;
  if char_length(v_order) > 30 then raise exception 'El código de pedido no es válido'; end if;
  if v_guardian is not null and char_length(v_guardian) > 120 then raise exception 'El nombre del padre, madre o tutor es demasiado largo'; end if;

  if v_headers is not null then
    v_ip := split_part(coalesce((v_headers::json)->>'x-forwarded-for', ''), ',', 1);
  end if;
  v_hash := case when v_ip <> '' then md5(v_ip || ':mariarte') end;
  if v_hash is not null and (select count(*) from public.complaints where ip_hash = v_hash and created_at > now() - interval '1 hour') >= 3 then
    raise exception 'Enviaste varios reclamos seguidos. Inténtalo más tarde o escríbenos por WhatsApp';
  end if;
  if (select count(*) from public.complaints where doc_number = v_doc and created_at > now() - interval '24 hours') >= 5 then
    raise exception 'Se alcanzó el máximo de reclamos diarios para este documento';
  end if;

  v_number := 'LR-' || lpad(nextval('public.complaint_seq')::text, 6, '0') || '-' || to_char(now(), 'YYYY');
  insert into public.complaints (number, consumer_name, doc_type, doc_number, address, phone, email, guardian_name,
                                 item_type, item_description, amount, kind, detail, request, order_code, consent, ip_hash)
  values (v_number, v_name, p_doc_type, v_doc, v_address, v_phone, v_email, v_guardian,
          p_item_type, v_item, p_amount, p_kind, v_detail, v_request, nullif(v_order, ''), true, v_hash)
  returning created_at into v_created;

  return jsonb_build_object('number', v_number, 'created_at', v_created);
end;
$$;

revoke all on function public.submit_complaint(text,text,text,text,text,text,text,text,numeric,text,text,text,text,text,boolean) from public;
grant execute on function public.submit_complaint(text,text,text,text,text,text,text,text,numeric,text,text,text,text,text,boolean) to anon, authenticated;
