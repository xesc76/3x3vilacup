# 3x3vilacup — 4a edició

Web del torneig de bàsquet 3x3 de Vilafranca del Penedès.
Diumenge 23 d'agost de 2026, Pavelló Poliesportiu Nou (La Gamba).

- **Públic** (sense registre): horaris, resultats en directe, classificacions,
  vista per pista amb QR i fotos, sponsors.
- **Organització** (`/admin`, amb login): equips, partits, pistes, sponsors,
  marcadors en directe i generació de cartells QR.

Stack: Next.js 14 (App Router) · TypeScript · Tailwind · Supabase
(Postgres + Auth + Realtime) · Vercel. Tot en capa gratuïta.

---

## Posada en marxa (primera vegada)

### 1. Crear el projecte de Supabase

1. Entra a <https://supabase.com> i crea un compte (gratuït).
2. **New project**. Nom: `vilacup`. Regió: **Frankfurt (eu-central-1)** o
   **London**, que són les més properes. Apunta't la contrasenya de la base de
   dades (no la faràs servir gaire, però guarda-la).
3. Espera ~2 minuts fins que el projecte estigui llest.

### 2. Crear les taules

1. Dins del projecte: menú lateral → **SQL Editor** → **New query**.
2. Obre el fitxer [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql),
   copia'n **tot** el contingut, enganxa'l a l'editor i prem **Run**.
3. Hauries de veure `Success. No rows returned`.

Això crea les taules (`teams`, `matches`, `courts`, `sponsors`, `settings`,
`admins`), les polítiques de seguretat (RLS), activa Realtime i dona d'alta
tres pistes.

### 3. Crear el teu usuari d'administrador

1. Menú lateral → **Authentication** → **Users** → **Add user** → **Create new user**.
2. Posa el teu email i una contrasenya. Marca **Auto Confirm User**.
3. Torna al **SQL Editor** i executa això, canviant l'email pel teu:

   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'EL_TEU_EMAIL@exemple.com';
   ```

4. **Important:** menú lateral → **Authentication** → **Sign In / Providers** →
   **Email** → desactiva **Allow new users to sign up**. Així ningú es pot
   registrar pel seu compte.

### 4. Configurar el projecte en local

1. Menú lateral de Supabase → **Project Settings** → **API**. Copia:
   - **Project URL**
   - **anon public** key
2. A la carpeta del projecte, crea el fitxer `.env.local` (pots copiar
   `.env.local.example`) amb aquest contingut:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi....
   ```

   > Aquestes dues claus són públiques: van al navegador. El que protegeix les
   > dades són les polítiques RLS, no les claus. No posis mai la `service_role`
   > en aquest fitxer.

3. Arrenca el projecte:

   ```powershell
   npm install
   npm run dev
   ```

4. Obre <http://localhost:3000> i <http://localhost:3000/admin>.

### 5. (Opcional) Dades d'exemple per provar

Executa [`supabase/seed_test.sql`](supabase/seed_test.sql) al SQL Editor per
omplir el torneig sencer de mentida: equips en grups, partits en tots els
estats, quadre de play-off, comunicats, concurs de triples i col·laboradors.
Al final del fitxer hi ha el bloc per esborrar-ho tot quan tinguis les dades
reals.

---

## Desplegar a Vercel

El repositori és <https://github.com/xesc76/3x3vilacup> i cada `git push` a
`main` desplega sol.

**Abans del primer desplegament**, a Vercel → el projecte → **Settings →
Environment Variables**, afegeix aquestes tres (marcades per a *Production*,
*Preview* i *Development*):

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxxxxx.supabase.co` (igual que a `.env.local`, **sense** `/rest/v1/` al final) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | igual que a `.env.local` |
| `NEXT_PUBLIC_SITE_URL` | la URL de Vercel, p. ex. `https://3x3vilacup.vercel.app` |

Sense aquestes variables el desplegament compila igualment però el web surt
buit: no sap a quina base de dades connectar-se.

Si les afegeixes després d'un desplegament, cal tornar-lo a llançar:
**Deployments → ⋯ → Redeploy**.

---

## Codis QR per al pavelló

1. Entra a `/admin/qr` **des de la web desplegada** (no des de localhost).
2. Comprova que l'adreça que surt a dalt és la de Vercel.
3. **Imprimir cartells**: surt un full per pista, amb el nom, el QR i el text
   d'instruccions, més un cartell general que porta a la home.
4. Enganxa cada cartell a la seva pista.

Qui escaneja el QR de la Pista 1 va a `/pista/<id>`, on veu només els partits
d'aquella pista, els marcadors en directe i el botó de fotos.

---

## El dia del torneig

- **Marcadors:** `/admin` → tria el partit → botons grossos `+1` i `+2`, més
  `−1` per corregir. Es desa sol i surt al web públic a l'instant.
  (En 3x3 no hi ha triple: per això no hi ha botó de `+3`.)
- **Estat:** cada partit té *Programat → En joc → Finalitzat*. La classificació
  només compta els finalitzats.
- **Play-off:** `/admin/playoff` → tria categoria → **Generar quadre** i, quan
  acabi la fase de grups, **Activar play-off**. A partir d'aquí la fase de
  grups queda congelada i el guanyador de cada creuament passa sol a la ronda
  següent.
- **Diverses persones alhora:** poden entrar amb el mateix usuari des de mòbils
  diferents. Si dues persones toquen el mateix partit, els canvis se
  sincronitzen sols.
- **Avisos:** `/admin/config` té un camp de missatge que surt destacat a la home
  (retards, canvis d'última hora...).

---

## Estructura del codi

```
app/
  page.tsx                 home pública
  horaris/                 llistat filtrable de partits
  classificacio/           classificació per categoria
  pistes/, pista/[id]/     vista per pista (destí dels QR)
  admin/
    login/                 login amb email i contrasenya
    page.tsx               llista de partits per posar marcador
    partit/[id]/           marcador en directe d'un partit
    partits/, equips/, pistes/, sponsors/, qr/, config/
components/                UI compartida (pública i admin/)
lib/
  supabase/                clients de Supabase (navegador, servidor, middleware)
  types.ts, constants.ts   model de dades i textos del torneig
  standings.ts             càlcul de la classificació
  useLiveMatches.ts        subscripció a Realtime
supabase/
  migrations/
    0001_init.sql          esquema base + RLS + Realtime
    0002_...playoff.sql    grups, comunicats, triples, play-off
    0003_...petita.sql     nivells de col·laborador, cistella petita
  seed_test.sql            torneig sencer de mentida per provar-ho tot
middleware.ts              protegeix /admin i refresca la sessió
```

Les migracions s'executen **en ordre** i una sola vegada, al SQL Editor de
Supabase. Estan escrites per no petar si les tornes a executar.

### Coses que potser voldràs tocar

- **Dades del torneig** (nom, data, pavelló): `lib/constants.ts`.
- **Criteris de classificació**: `lib/standings.ts`. Ara ordena per victòries,
  després punts a favor i, si segueix l'empat, enfrontament directe (amb
  mini-lliga si hi ha més de dos equips empatats).
- **Nivells de col·laborador**: `SPONSOR_TIERS` a `lib/constants.ts` controla
  el títol de cada secció i la mida dels logotips.
- **Categories**: `lib/constants.ts` **i** el tipus `category` de la base de
  dades. Per afegir-ne una de nova cal executar també
  `alter type public.category add value 'nova';`.

---

## Comandes

```powershell
npm run dev     # servidor de desenvolupament
npm run build   # comprova que compila (el mateix que fa Vercel)
npm run lint    # errors d'estil
```
