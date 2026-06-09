# Requirements — navigation-layout

## R1
El sistema DEBE envolver toda la aplicación en un `HashRouter` de `react-router-dom` v6
para que las rutas sean compatibles con el protocolo `file://` de Electron en producción.

## R2
El sistema DEBE renderizar un layout de dos columnas: una barra lateral izquierda de
ancho fijo (~220 px) y un área de contenido principal que ocupa el espacio restante.

## R3
El sistema DEBE mostrar los siguientes ítems de navegación en la barra lateral,
en este orden: Scout (`/`), Results (`/results`), Pipeline (`/pipeline`),
Boards & Keywords (`/boards`), Resume (`/resume`).

## R4
El sistema DEBE mostrar el ítem Settings (`/settings`) empujado al fondo de la
barra lateral, separado visualmente de los ítems del grupo principal.

## R5
CUANDO el usuario navega a una ruta, el sistema DEBE resaltar el ítem de la barra
lateral cuya ruta coincide con la ruta activa usando el color `--color-accent`.

## R6
CUANDO el usuario hace clic en un ítem de la barra lateral, el sistema DEBE
navegar a la ruta correspondiente sin recargar la página.

## R7
El sistema DEBE aplicar la clase `theme-dark` al elemento `<html>` como valor
predeterminado al arrancar, a menos que `localStorage` contenga `theme: "light"`.

## R8
CUANDO el usuario hace clic en el botón de alternancia de tema, el sistema DEBE
conmutar la clase del elemento `<html>` entre `theme-dark` y `theme-light` y
persistir la nueva preferencia en `localStorage` bajo la clave `theme`.

## R9
CUANDO la aplicación carga, el sistema DEBE leer `localStorage["theme"]` y aplicar
la clase correspondiente (`theme-dark` o `theme-light`) al elemento `<html>` antes
de que el primer frame sea visible.

## R10
El sistema DEBE mostrar en la parte superior de la barra lateral el nombre del
perfil activo y un indicador de tipo chevron.

## R11
CUANDO el usuario hace clic en el selector de perfil, el sistema DEBE mostrar un
menú desplegable que liste todos los perfiles devueltos por
`window.api.invoke('profiles:list')` y una opción "New profile".

## R12
CUANDO el usuario selecciona un perfil distinto en el desplegable, el sistema DEBE
invocar `window.api.invoke('profiles:switch', id)` y luego llamar
`window.location.reload()`.

## R13
El sistema DEBE renderizar en el área de contenido un componente `<Outlet />` de
React Router que muestre el contenido de la ruta activa.

## R14
El sistema DEBE renderizar un placeholder `<div>` con el nombre de la pantalla
(por ejemplo `<div>Scout screen</div>`) para cada una de las seis rutas:
`/`, `/results`, `/pipeline`, `/boards`, `/resume`, `/settings`.

## R15
El sistema DEBE establecer `-webkit-app-region: drag` en la zona superior de la
barra lateral (por encima del primer ítem de navegación) para que el usuario pueda
arrastrar la ventana desde esa área.

## R16
El sistema DEBE cargar la fuente Inter para texto de UI y JetBrains Mono para
texto de código, selectores y URLs, usando las variables CSS `--font-sans` y
`--font-mono` ya definidas en `tokens.css`.

## R17
El sistema DEBE implementar los estilos de layout y componentes usando Tailwind CSS v3 y componentes de shadcn/ui. NO DEBE usar CSS Modules ni CSS-in-JS. Los tokens de diseño de `tokens.css` (colores, fuentes) DEBEN mantenerse como variables CSS en `globals.css` siguiendo la convención de shadcn (`--background`, `--foreground`, `--accent`, etc.).

## R18
El sistema DEBE mostrar cada ítem de navegación con un icono y una etiqueta de texto.
