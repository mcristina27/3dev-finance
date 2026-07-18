# Plan: de app de finanzas a mini-ERP de 3Dev

Objetivo: stock de productos, pedidos y eventos que descuentan stock y generan ingresos (pagado/pendiente), y costo real por producto vía insumos.

Orden recomendado: Fase 1 → 2 → 3 → 4 → 5 → 6. Sin las fases 1-2 (stock), pedidos y eventos no tienen de dónde descontar.

## Fase 1 — Modelo de datos (la base de todo)

- [ ] Crear tipo `ProductStock { productId, qty }` guardado localmente, ligado al id del catálogo web (el API solo trae `inStock: boolean`, no cantidades).
- [ ] Extender `Entry` con `paymentStatus: 'paid' | 'pending'` y `sourceActivityId` (de qué pedido/evento vino el ingreso).
- [ ] Extender `ActivityItem` con `qtySold` (eventos: llevé X, vendí Y).
- [ ] Agregar flag `stockDeducted` a `Activity` para nunca descontar dos veces.
- [ ] Crear tipo `Recipe { productId, ingredients: [{ materialId, qty }] }` (insumos anclados a productos).

## Fase 2 — Sección Stock

- [ ] Nuevo `InventoryContext` (AsyncStorage, mismo patrón que los contexts existentes).
- [ ] Pantalla Stock: catálogo remoto + cantidades locales combinados.
- [ ] Entradas/ajustes manuales de stock ("produje 5 llaveros").

## Fase 3 — Pedidos

- [ ] Reusar `Activity type: 'order'` (ya existe), no crear sección desde cero.
- [ ] Al marcar pedido como completado: descontar stock de los items + crear automáticamente el `Entry` de ingreso con etiqueta pagado/pendiente.
- [ ] Vista de pedidos filtrada dentro de Agenda o como tab propio.

## Fase 4 — Eventos

- [ ] Flujo "cierre de evento": registrar qty vendida por producto → descuenta stock → genera ingreso(s) con pagado/pendiente.
- [ ] Del mismo formulario sale el reporte "cuánto llevé vs cuánto vendí" (secundario).

## Fase 5 — Costo real por producto (recetas)

- [ ] Pantalla de receta: asignar insumos y cantidades a cada producto.
- [ ] Costo real = Σ(qty × costPerUnit del insumo); mostrar margen vs precio del catálogo.
- [ ] Opcional: al registrar producción de stock, descontar también insumos según receta.

## Fase 6 — Reportes

- [ ] Ingresos por canal (feria / pedido / online).
- [ ] Pendientes de cobro (entries con `paymentStatus: 'pending'`).
- [ ] Margen real usando las recetas.

## Decisiones pendientes

1. ¿El stock de productos vive solo en la app (local) o algún día sincroniza el `inStock` de la web?
2. ¿Producir stock descuenta insumos automáticamente o control manual?
