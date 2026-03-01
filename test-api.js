#!/usr/bin/env node
/**
 * test-api.js — Prueba integral de todos los endpoints de VauCher API
 *
 * Uso:
 *   node test-api.js
 *   node test-api.js --base-url=http://localhost:3000
 *
 * Requiere Node.js 18+ (fetch nativo).
 */

// ──────────────────────────────────────────────────────────────
// Config
// ──────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const baseUrlArg = args.find((a) => a.startsWith("--base-url="));
const BASE_URL = baseUrlArg
  ? baseUrlArg.split("=")[1]
  : "http://localhost:3000/api";

const RUN_ID = Date.now();
const TEST_USER = {
  name: "Test Usuario",
  email: `test_${RUN_ID}@vaucher.com`,
  password: "Password123",
};

let token = "";
let gastoId = "";
let _reqLog = []; // captura todas las llamadas HTTP del test en curso

// ──────────────────────────────────────────────────────────────
// Colores + contadores
// ──────────────────────────────────────────────────────────────
const C = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  gray: (s) => `\x1b[90m${s}\x1b[0m`,
};

let passed = 0;
let failed = 0;
let skipped = 0;

function section(title) {
  console.log(`\n${C.bold(C.cyan(`━━━ ${title} ━━━`))}`);
}

function printResponses(responses, isError) {
  for (const r of responses) {
    const statusColor =
      r.status < 300 ? C.green : r.status < 500 ? C.yellow : C.red;
    const prefix = C.gray("     │ ");
    console.log(C.gray(`     ┌ ${r.method} ${r.path}`));
    console.log(`${prefix}${C.bold("Status:")} ${statusColor(r.status)}`);
    if (r.body !== null) {
      const pretty = JSON.stringify(r.body, null, 2);
      const lines = pretty.split("\n");
      if (lines.length === 1) {
        console.log(
          `${prefix}${C.bold("Body  :")} ${isError ? C.red(pretty) : C.gray(pretty)}`,
        );
      } else {
        console.log(`${prefix}${C.bold("Body  :")}`);
        for (const line of lines) {
          console.log(`${prefix}  ${isError ? C.red(line) : C.gray(line)}`);
        }
      }
    }
    console.log(C.gray("     └─"));
  }
}

function printResult(label, status, responses = [], errorMsg) {
  if (status === "pass") {
    passed++;
    console.log(`  ${C.green("✔")}  ${label}`);
    printResponses(responses, false);
  } else if (status === "fail") {
    failed++;
    console.log(`  ${C.red("✘")}  ${label}`);
    if (Array.isArray(responses) && responses.length)
      printResponses(responses, true);
    if (errorMsg) console.log(C.red(`     ✖ ${errorMsg}`));
  } else {
    skipped++;
    console.log(
      `  ${C.yellow("⊘")}  ${C.yellow(label)} ${C.gray("(omitido)")}`,
    );
  }
}

// ──────────────────────────────────────────────────────────────
// HTTP helper + test runner
// ──────────────────────────────────────────────────────────────
async function req(method, path, body, useToken = true) {
  const url = `${BASE_URL}${path}`;
  const headers = { "Content-Type": "application/json" };
  if (useToken && token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let json = null;
  try {
    json = await res.json();
  } catch {
    /* body vacío */
  }

  const result = { method, path, status: res.status, body: json };
  _reqLog.push(result);
  return result;
}

// skip=true → marca como omitido; critical=true → lanza si falla (aborta sección)
async function test(label, fn, { skip = false, critical = false } = {}) {
  if (skip) {
    printResult(label, "skip");
    return null;
  }
  _reqLog = [];
  try {
    const result = await fn();
    printResult(label, "pass", _reqLog);
    return result;
  } catch (err) {
    printResult(label, "fail", err.message, _reqLog);
    if (critical) throw new Error(`CRÍTICO: falló "${label}"`);
    return null;
  }
}

function expect(cond, msg) {
  if (!cond) throw new Error(msg);
}

function fmt500(body) {
  if (!body) return "sin body";
  const msg = body.message;
  if (typeof msg === "string" && msg !== "Internal server error") return msg;
  return JSON.stringify(body);
}

// ──────────────────────────────────────────────────────────────
// PRE-FLIGHT: Health check
// ──────────────────────────────────────────────────────────────
async function checkHealth() {
  section("PRE-FLIGHT");

  let dbOk = false;
  await test(
    "GET /health → DB conectada",
    async () => {
      const { status, body } = await req("GET", "/health", undefined, false);
      expect(
        status === 200,
        `API no responde (status ${status}). ¿Está corriendo el servidor en ${BASE_URL}?`,
      );
      dbOk = body?.db === "ok";
      expect(
        dbOk,
        `Base de datos NO conectada.\n` +
          `     Error: ${body?.dbError ?? "desconocido"}\n` +
          `     Verifica que PostgreSQL esté corriendo y que DATABASE_URL en .env sea correcto.`,
      );
      return { api: body.api, db: body.db };
    },
    { critical: true },
  );

  return dbOk;
}

// ──────────────────────────────────────────────────────────────
// TESTS
// ──────────────────────────────────────────────────────────────

async function testAuth() {
  section("AUTH");

  await test(
    "POST /auth/register → 201",
    async () => {
      const { status, body } = await req(
        "POST",
        "/auth/register",
        TEST_USER,
        false,
      );
      expect(
        status === 201,
        `Esperado 201, obtenido ${status}: ${fmt500(body)}`,
      );
      expect(body?.token, "La respuesta no contiene token");
      token = body.token;
      return { userId: body.user?.id, email: body.user?.email };
    },
    { critical: true },
  );

  await test("POST /auth/register → 409 (email duplicado)", async () => {
    const { status, body } = await req(
      "POST",
      "/auth/register",
      TEST_USER,
      false,
    );
    expect(status === 409, `Esperado 409, obtenido ${status}: ${fmt500(body)}`);
    return "Conflicto detectado";
  });

  await test("POST /auth/register → 400 (email inválido)", async () => {
    const { status } = await req(
      "POST",
      "/auth/register",
      { name: "X", email: "no-es-email", password: "123456" },
      false,
    );
    expect(status === 400, `Esperado 400, obtenido ${status}`);
    return "Validación funcionando";
  });

  await test(
    "POST /auth/login → 200",
    async () => {
      const { status, body } = await req(
        "POST",
        "/auth/login",
        { email: TEST_USER.email, password: TEST_USER.password },
        false,
      );
      expect(
        status === 200,
        `Esperado 200, obtenido ${status}: ${fmt500(body)}`,
      );
      expect(body?.token, "La respuesta no contiene token");
      token = body.token;
      return { token: body.token.slice(0, 20) + "…" };
    },
    { critical: true },
  );

  await test("POST /auth/login → 401 (contraseña incorrecta)", async () => {
    const { status, body } = await req(
      "POST",
      "/auth/login",
      { email: TEST_USER.email, password: "wrong!" },
      false,
    );
    expect(status === 401, `Esperado 401, obtenido ${status}: ${fmt500(body)}`);
    return "Rechazado correctamente";
  });

  await test("GET /configuracion → 401 (sin token)", async () => {
    const { status } = await req("GET", "/configuracion", undefined, false);
    expect(status === 401, `Esperado 401, obtenido ${status}`);
    return "Ruta protegida";
  });
}

async function testConfiguracion() {
  section("CONFIGURACIÓN");
  const noToken = !token;

  await test(
    "POST /configuracion → 201",
    async () => {
      const { status, body } = await req("POST", "/configuracion", {
        salario: 15000,
        frecuencia: "Mensual",
        diaInicio: 1,
        saldoActual: 8000,
        ahorroHistorico: 3000,
      });
      expect(
        status === 201,
        `Esperado 201, obtenido ${status}: ${fmt500(body)}`,
      );
      expect(body?.userId, "Sin userId en respuesta");
      return { id: body.id, salario: body.salario };
    },
    { skip: noToken, critical: true },
  );

  await test(
    "GET /configuracion → 200",
    async () => {
      const { status, body } = await req("GET", "/configuracion");
      expect(
        status === 200,
        `Esperado 200, obtenido ${status}: ${fmt500(body)}`,
      );
      expect(body?.salario === 15000, `Salario incorrecto: ${body?.salario}`);
      return { salario: body.salario, saldoActual: body.saldoActual };
    },
    { skip: noToken },
  );

  await test(
    "POST /configuracion → 201 (upsert actualiza)",
    async () => {
      const { status, body } = await req("POST", "/configuracion", {
        salario: 20000,
        frecuencia: "Quincenal",
        diaInicio: 15,
        saldoActual: 10000,
        ahorroHistorico: 5000,
      });
      expect(
        [200, 201].includes(status),
        `Esperado 200/201, obtenido ${status}: ${fmt500(body)}`,
      );
      expect(
        body?.salario === 20000,
        `Salario no actualizado: ${body?.salario}`,
      );
      return { salario: body.salario };
    },
    { skip: noToken },
  );

  await test(
    "POST /configuracion → 400 (frecuencia inválida)",
    async () => {
      const { status } = await req("POST", "/configuracion", {
        salario: 10000,
        frecuencia: "Diario",
        diaInicio: 1,
        saldoActual: 0,
        ahorroHistorico: 0,
      });
      expect(status === 400, `Esperado 400, obtenido ${status}`);
      return "Validación correcta";
    },
    { skip: noToken },
  );
}

async function testGastos() {
  section("GASTOS");
  const noToken = !token;

  await test(
    "POST /gastos → 201",
    async () => {
      const { status, body } = await req("POST", "/gastos", {
        nombre: "Renta",
        monto: 4000,
        categoria: "Vital",
        frecuencia: "Mensual",
        pagado: false,
      });
      expect(
        status === 201,
        `Esperado 201, obtenido ${status}: ${fmt500(body)}`,
      );
      expect(body?.id, "Sin id en respuesta");
      gastoId = body.id;
      return { id: body.id, nombre: body.nombre };
    },
    { skip: noToken, critical: true },
  );

  await test(
    "POST /gastos/lote → 201",
    async () => {
      const { status, body } = await req("POST", "/gastos/lote", [
        {
          nombre: "Internet",
          monto: 500,
          categoria: "Recurrente",
          frecuencia: "Mensual",
          pagado: false,
        },
        {
          nombre: "Gasolina",
          monto: 800,
          categoria: "Recurrente",
          frecuencia: "Quincenal",
          pagado: false,
        },
        {
          nombre: "Luz",
          monto: 300,
          categoria: "Vital",
          frecuencia: "Mensual",
          pagado: true,
        },
      ]);
      expect(
        status === 201,
        `Esperado 201, obtenido ${status}: ${fmt500(body)}`,
      );
      expect(
        body?.creados === 3,
        `Esperado 3 creados, obtenido ${body?.creados}`,
      );
      return { creados: body.creados };
    },
    { skip: noToken },
  );

  await test(
    "GET /gastos → 200",
    async () => {
      const { status, body } = await req("GET", "/gastos");
      expect(
        status === 200,
        `Esperado 200, obtenido ${status}: ${fmt500(body)}`,
      );
      expect(Array.isArray(body), "La respuesta no es un array");
      expect(body.length >= 4, `Esperado ≥4 gastos, obtenido ${body.length}`);
      return { total: body.length };
    },
    { skip: noToken },
  );

  await test(
    "PATCH /gastos/:id/pagado → 200 (marcar pagado)",
    async () => {
      const { status, body } = await req("PATCH", `/gastos/${gastoId}/pagado`, {
        pagado: true,
      });
      expect(
        status === 200,
        `Esperado 200, obtenido ${status}: ${fmt500(body)}`,
      );
      expect(body?.pagado === true, "No se marcó como pagado");
      return { pagado: body.pagado };
    },
    { skip: noToken || !gastoId },
  );

  await test(
    "PATCH /gastos/:id/pagado → 200 (desmarcar)",
    async () => {
      const { status, body } = await req("PATCH", `/gastos/${gastoId}/pagado`, {
        pagado: false,
      });
      expect(
        status === 200,
        `Esperado 200, obtenido ${status}: ${fmt500(body)}`,
      );
      expect(body?.pagado === false, "No se desmarcó");
      return { pagado: body.pagado };
    },
    { skip: noToken || !gastoId },
  );

  await test(
    "PATCH /gastos/id-inexistente/pagado → 404",
    async () => {
      const { status } = await req("PATCH", "/gastos/id_que_no_existe/pagado", {
        pagado: true,
      });
      expect(status === 404, `Esperado 404, obtenido ${status}`);
      return "Not found correcto";
    },
    { skip: noToken },
  );

  await test(
    "POST /gastos → 400 (monto 0)",
    async () => {
      const { status } = await req("POST", "/gastos", {
        nombre: "Test",
        monto: 0,
        categoria: "Vital",
        frecuencia: "Mensual",
        pagado: false,
      });
      expect(status === 400, `Esperado 400, obtenido ${status}`);
      return "Validación correcta";
    },
    { skip: noToken },
  );
}

async function testDashboard() {
  section("DASHBOARD");
  const noToken = !token;

  await test(
    "GET /dashboard/resumen → 200",
    async () => {
      const { status, body } = await req("GET", "/dashboard/resumen");
      expect(
        status === 200,
        `Esperado 200, obtenido ${status}: ${fmt500(body)}`,
      );
      expect(typeof body?.saldoActual === "number", "saldoActual no es número");
      expect(typeof body?.saldoTotal === "number", "saldoTotal no es número");
      expect(
        typeof body?.gastosPendientesTotales === "number",
        "gastosPendientesTotales no es número",
      );
      expect(body?.metaCrecimiento, "metaCrecimiento no presente");
      expect(
        Array.isArray(body?.gastosRegistrados),
        "gastosRegistrados no es array",
      );
      return {
        saldoActual: body.saldoActual,
        gastosPendientes: body.gastosPendientesTotales,
        metaPct: body.metaCrecimiento.porcentajeActual,
      };
    },
    { skip: noToken },
  );

  await test(
    "POST /dashboard/gasto → 201 (Variable)",
    async () => {
      const { status, body } = await req("POST", "/dashboard/gasto", {
        nombre: "Café",
        monto: 50,
        categoria: "Variable",
      });
      expect(
        status === 201,
        `Esperado 201, obtenido ${status}: ${fmt500(body)}`,
      );
      return { message: body?.message };
    },
    { skip: noToken },
  );

  await test(
    "POST /dashboard/gasto → 201 (Vital)",
    async () => {
      const { status, body } = await req("POST", "/dashboard/gasto", {
        nombre: "Doctor",
        monto: 600,
        categoria: "Vital",
        frecuencia: "Mensual",
      });
      expect(
        status === 201,
        `Esperado 201, obtenido ${status}: ${fmt500(body)}`,
      );
      return { message: body?.message };
    },
    { skip: noToken },
  );

  await test(
    "POST /dashboard/ingreso-extra → 201 (no reservado)",
    async () => {
      const { status, body } = await req("POST", "/dashboard/ingreso-extra", {
        monto: 2000,
        origen: "Freelance",
        reservar: false,
      });
      expect(
        status === 201,
        `Esperado 201, obtenido ${status}: ${fmt500(body)}`,
      );
      return { message: body?.message };
    },
    { skip: noToken },
  );

  await test(
    "POST /dashboard/ingreso-extra → 201 (reservado)",
    async () => {
      const { status, body } = await req("POST", "/dashboard/ingreso-extra", {
        monto: 500,
        origen: "Bono",
        reservar: true,
      });
      expect(
        status === 201,
        `Esperado 201, obtenido ${status}: ${fmt500(body)}`,
      );
      return { message: body?.message };
    },
    { skip: noToken },
  );

  await test(
    "GET /dashboard/resumen → reservadoSiguienteCiclo = 500",
    async () => {
      const { status, body } = await req("GET", "/dashboard/resumen");
      expect(status === 200, `Esperado 200, obtenido ${status}`);
      expect(
        body?.reservadoSiguienteCiclo === 500,
        `Reservado esperado 500, obtenido ${body?.reservadoSiguienteCiclo}`,
      );
      return {
        saldoActual: body.saldoActual,
        reservado: body.reservadoSiguienteCiclo,
      };
    },
    { skip: noToken },
  );

  await test(
    "GET /dashboard/resumen → fórmula: saldoActual = saldoTotal - pendientes - reservado",
    async () => {
      const { status, body } = await req("GET", "/dashboard/resumen");
      expect(status === 200, `Esperado 200, obtenido ${status}`);
      const esperado =
        body.saldoTotal -
        body.gastosPendientesTotales -
        body.reservadoSiguienteCiclo;
      expect(
        Math.abs(body.saldoActual - esperado) < 0.01,
        `Fórmula incorrecta: saldoActual=${body.saldoActual} pero esperado=${esperado} ` +
          `(${body.saldoTotal} - ${body.gastosPendientesTotales} - ${body.reservadoSiguienteCiclo})`,
      );
      return {
        saldoTotal: body.saldoTotal,
        gastosPendientes: body.gastosPendientesTotales,
        reservado: body.reservadoSiguienteCiclo,
        saldoActual: body.saldoActual,
      };
    },
    { skip: noToken },
  );
}

async function testEliminar() {
  section("GASTOS — SOFT DELETE");
  const noToken = !token;
  const noId = !gastoId;

  await test(
    "DELETE /gastos/:id → 200 (soft delete, no borrado físico)",
    async () => {
      const { status, body } = await req("DELETE", `/gastos/${gastoId}`);
      expect(
        status === 200,
        `Esperado 200, obtenido ${status}: ${fmt500(body)}`,
      );
      expect(
        body?.message?.toLowerCase().includes("cancelado"),
        `Mensaje inesperado: ${body?.message}`,
      );
      return { message: body.message };
    },
    { skip: noToken || noId },
  );

  await test(
    "GET /gastos → gasto cancelado sigue en lista (soft delete)",
    async () => {
      const { status, body } = await req("GET", `/gastos`);
      expect(status === 200, `Esperado 200, obtenido ${status}`);
      const cancelado = body?.find((g) => g.id === gastoId);
      expect(
        cancelado !== undefined,
        "El gasto debería seguir existiendo en BD (soft delete)",
      );
      expect(
        cancelado?.canceladoParaElFuturo === true,
        `canceladoParaElFuturo debería ser true, obtenido ${cancelado?.canceladoParaElFuturo}`,
      );
      return { canceladoParaElFuturo: cancelado.canceladoParaElFuturo };
    },
    { skip: noToken || noId },
  );

  await test(
    "GET /dashboard/resumen → gasto cancelado NO aparece en gastosRegistrados",
    async () => {
      const { status, body } = await req("GET", "/dashboard/resumen");
      expect(status === 200, `Esperado 200, obtenido ${status}`);
      const aparece = body?.gastosRegistrados?.some((g) => g.id === gastoId);
      expect(
        aparece === false,
        "El gasto cancelado NO debería aparecer en el resumen del dashboard",
      );
      return { gastosEnResumen: body?.gastosRegistrados?.length };
    },
    { skip: noToken || noId },
  );

  await test(
    "DELETE /gastos/id-inexistente → 404",
    async () => {
      const { status } = await req("DELETE", "/gastos/id_que_no_existe");
      expect(status === 404, `Esperado 404, obtenido ${status}`);
      return "Not found correcto";
    },
    { skip: noToken },
  );
}

async function testPerfil() {
  section("PERFIL — PRÓXIMO CICLO");
  const noToken = !token;

  await test(
    "PATCH /perfil/proximo-ciclo → 200 (guarda cambios diferidos)",
    async () => {
      const { status, body } = await req("PATCH", "/perfil/proximo-ciclo", {
        salario: 25000,
        frecuencia: "Quincenal",
        diaInicio: 10,
      });
      expect(
        status === 200,
        `Esperado 200, obtenido ${status}: ${fmt500(body)}`,
      );
      expect(body?.pendingConfig, "La respuesta debe incluir pendingConfig");
      expect(
        body.pendingConfig?.salario === 25000,
        `salario en pending incorrecto: ${body.pendingConfig?.salario}`,
      );
      expect(
        body.pendingConfig?.diaInicio === 10,
        `diaInicio en pending incorrecto: ${body.pendingConfig?.diaInicio}`,
      );
      return { pendingConfig: body.pendingConfig };
    },
    { skip: noToken },
  );

  await test(
    "GET /configuracion → salario actual NO cambia (diferido)",
    async () => {
      const { status, body } = await req("GET", "/configuracion");
      expect(status === 200, `Esperado 200, obtenido ${status}`);
      expect(
        body?.salario !== 25000,
        `El salario NO debería haberse aplicado aún al ciclo actual (obtenido ${body?.salario})`,
      );
      return { salarioActual: body.salario };
    },
    { skip: noToken },
  );

  await test(
    "GET /perfil/pendiente → devuelve pendingConfig guardado",
    async () => {
      const { status, body } = await req("GET", "/perfil/pendiente");
      expect(
        status === 200,
        `Esperado 200, obtenido ${status}: ${fmt500(body)}`,
      );
      expect(body?.pendingConfig !== null, "pendingConfig debería existir");
      expect(
        body.pendingConfig?.salario === 25000,
        `salario pendiente incorrecto: ${body.pendingConfig?.salario}`,
      );
      return { pendingConfig: body.pendingConfig };
    },
    { skip: noToken },
  );

  await test(
    "PATCH /perfil/proximo-ciclo → 200 (actualización parcial, solo diaInicio)",
    async () => {
      const { status, body } = await req("PATCH", "/perfil/proximo-ciclo", {
        diaInicio: 5,
      });
      expect(
        status === 200,
        `Esperado 200, obtenido ${status}: ${fmt500(body)}`,
      );
      // El salario previo (25000) debe conservarse en el pending
      expect(
        body.pendingConfig?.salario === 25000,
        `salario previo no conservado: ${body.pendingConfig?.salario}`,
      );
      expect(
        body.pendingConfig?.diaInicio === 5,
        `diaInicio no actualizado: ${body.pendingConfig?.diaInicio}`,
      );
      return { pendingConfig: body.pendingConfig };
    },
    { skip: noToken },
  );

  await test(
    "PATCH /perfil/proximo-ciclo → 400 (frecuencia inválida)",
    async () => {
      const { status } = await req("PATCH", "/perfil/proximo-ciclo", {
        frecuencia: "Diario",
      });
      expect(status === 400, `Esperado 400, obtenido ${status}`);
      return "Validación correcta";
    },
    { skip: noToken },
  );
}

// ──────────────────────────────────────────────────────────────
// RUNNER
// ──────────────────────────────────────────────────────────────
async function run() {
  console.log(`\n${C.bold("VauCher API — Test Suite")}`);
  console.log(C.cyan(`Base URL : ${BASE_URL}`));
  console.log(C.cyan(`Usuario  : ${TEST_USER.email}`));

  try {
    const dbOk = await checkHealth();
    if (!dbOk) {
      console.log(
        C.red(
          "\n⛔  BD no disponible. Corrige la conexión antes de continuar.\n",
        ),
      );
      process.exit(1);
    }

    await testAuth();
    await testConfiguracion();
    await testGastos();
    await testDashboard();
    await testEliminar();
    await testPerfil();
  } catch (err) {
    console.log(C.red(`\n⛔  ${err.message}`));
  }

  const total = passed + failed + skipped;
  console.log(`\n${C.bold("━━━ Resultado ━━━")}`);
  console.log(`  Total   : ${total}`);
  console.log(C.green(`  Pasados : ${passed}`));
  console.log(
    skipped > 0 ? C.yellow(`  Omitidos: ${skipped}`) : `  Omitidos: ${skipped}`,
  );
  console.log(
    failed > 0 ? C.red(`  Fallidos: ${failed}`) : C.green(`  Fallidos: 0`),
  );
  console.log("");

  if (failed > 0) process.exit(1);
}

run();
