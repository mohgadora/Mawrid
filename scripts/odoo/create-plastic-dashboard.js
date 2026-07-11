#!/usr/bin/env node
/*
 * create-plastic-dashboard.js
 * Creates a professional Power-BI-style financial dashboard inside Odoo Spreadsheets.
 *
 * Usage:
 *   cd /opt/odoo-mcp        (or wherever odoo-core.js lives)
 *   node create-plastic-dashboard.js
 *
 * Result: a new "spreadsheet.dashboard" record visible in Odoo under
 *   Spreadsheet > Dashboards  →  "لوحة الأداء المالي والتشغيلي — مصنع البلاستيك ★"
 *
 * The dashboard contains:
 *   Sheet 1 – "البيانات"  : hidden data sheet with all ODOO.BALANCE live formulas
 *   Sheet 2 – "اللوحة"   : visual dashboard (scorecards, charts, P&L table)
 */

"use strict";
const { createClient } = require("./odoo-core.js");

// ─────────────────────────────────────────────
//  Budget constants (موازنة عطاء بكري أرسلان)
// ─────────────────────────────────────────────
const BUDGET = {
  revenue : 1_556_939,
  cogs    : 1_002_747,
  get gp()    { return this.revenue - this.cogs; },
  opex    : 330_000,          // estimated; update from actual budget
  get netProfit() { return this.gp - this.opex; },
  get gpPct()     { return this.gp / this.revenue; },
};

// ─────────────────────────────────────────────
//  Style palette  (indices = string keys in the
//  top-level "styles" object of o-spreadsheet)
// ─────────────────────────────────────────────
const STYLES = {
  // id : o-spreadsheet style object
  "1"  : { bold:true, fontSize:22, textColor:"#F9FAFB", fillColor:"#0B1120", align:"center", verticalAlign:"middle" },
  "2"  : { bold:true, fontSize:11, textColor:"#D1D5DB", fillColor:"#0B1120" },
  "3"  : { bold:true, fontSize:10, textColor:"#9CA3AF", fillColor:"#111827", align:"center" },
  "4"  : { fontSize:11, textColor:"#F9FAFB", fillColor:"#111827", align:"right" },
  "5"  : { fontSize:11, textColor:"#10B981", fillColor:"#111827", align:"right", bold:true },
  "6"  : { fontSize:11, textColor:"#EF4444", fillColor:"#111827", align:"right", bold:true },
  "7"  : { bold:true, fontSize:11, textColor:"#FBBF24", fillColor:"#1F2937", align:"right" },
  "8"  : { bold:true, fontSize:11, textColor:"#F9FAFB", fillColor:"#1F2937" },
  "9"  : { bold:true, fontSize:12, textColor:"#F9FAFB", fillColor:"#111827", align:"center", verticalAlign:"middle" },
  "10" : { fontSize:10, textColor:"#6B7280", fillColor:"#0B1120" },
  "11" : { bold:true, fontSize:10, textColor:"#F9FAFB", fillColor:"#374151", align:"center" },
};

const FORMATS = {
  "1" : "#,##0",
  "2" : "0.0%",
  "3" : '#,##0;[Red]-#,##0',
};

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────
function bal(code, period="year", offset=0) {
  return `=ODOO.BALANCE("${code}","${period}",${offset})`;
}

// ─────────────────────────────────────────────
//  Data sheet – all ODOO live formulas
// ─────────────────────────────────────────────
function buildDataSheet() {
  const cells = {
    // ── P&L summary ───────────────────────
    "A1": { content:"البند",                 style:"11" },
    "B1": { content:"الفعلي (USD)",           style:"11" },
    "C1": { content:"الموازنة (USD)",          style:"11" },
    "D1": { content:"الفرق",                  style:"11" },
    "E1": { content:"% الإنجاز",              style:"11" },

    "A2": { content:"الإيرادات الإجمالية",   style:"2" },
    "B2": { content: bal("4%"),              style:"4", format:"1" },
    "C2": { content: String(BUDGET.revenue), style:"4", format:"1" },
    "D2": { content:"=B2-C2",               style:"4", format:"3" },
    "E2": { content:"=IFERROR(B2/C2,\"\")", style:"4", format:"2" },

    "A3": { content:"تكلفة البضاعة المباعة", style:"2" },
    "B3": { content: bal("510101"),          style:"4", format:"1" },
    "C3": { content: String(BUDGET.cogs),    style:"4", format:"1" },
    "D3": { content:"=B3-C3",               style:"4", format:"3" },
    "E3": { content:"=IFERROR(B3/C3,\"\")", style:"4", format:"2" },

    "A4": { content:"إجمالي الربح الإجمالي", style:"8" },
    "B4": { content:"=B2-B3",               style:"7", format:"1" },
    "C4": { content: String(BUDGET.gp),      style:"7", format:"1" },
    "D4": { content:"=B4-C4",               style:"7", format:"3" },
    "E4": { content:"=IFERROR(B4/C4,\"\")", style:"7", format:"2" },

    "A5": { content:"المصروفات التشغيلية",   style:"2" },
    "B5": { content: bal("520%"),            style:"4", format:"1" },
    "C5": { content: String(BUDGET.opex),    style:"4", format:"1" },
    "D5": { content:"=B5-C5",               style:"4", format:"3" },
    "E5": { content:"=IFERROR(B5/C5,\"\")", style:"4", format:"2" },

    "A6": { content:"صافي الربح",            style:"8" },
    "B6": { content:"=B4-B5",               style:"7", format:"1" },
    "C6": { content: String(BUDGET.netProfit), style:"7", format:"1" },
    "D6": { content:"=B6-C6",               style:"7", format:"3" },
    "E6": { content:"=IFERROR(B6/C6,\"\")", style:"7", format:"2" },

    "A7": { content:"هامش الربح الإجمالي",   style:"2" },
    "B7": { content:"=IFERROR(B4/B2,0)",    style:"4", format:"2" },
    "C7": { content: String(BUDGET.gpPct.toFixed(4)), style:"4", format:"2" },

    "A8": { content:"هامش صافي الربح",       style:"2" },
    "B8": { content:"=IFERROR(B6/B2,0)",    style:"4", format:"2" },

    // ── OpEx breakdown (for pie chart) ────
    "A10": { content:"الرواتب والأجور",       style:"2" },
    "B10": { content: bal("520101"),         style:"4", format:"1" },
    "A11": { content:"وقود ومحروقات",         style:"2" },
    "B11": { content: bal("520201"),         style:"4", format:"1" },
    "A12": { content:"صيانة وإصلاح",         style:"2" },
    "B12": { content: bal("520301"),         style:"4", format:"1" },
    "A13": { content:"إيجارات",               style:"2" },
    "B13": { content: bal("520401"),         style:"4", format:"1" },
    "A14": { content:"مصروفات إدارية",        style:"2" },
    "B14": { content: bal("520501"),         style:"4", format:"1" },
    "A15": { content:"نقل وشحن",              style:"2" },
    "B15": { content: bal("520601"),         style:"4", format:"1" },
    "A16": { content:"إهلاك الأصول",          style:"2" },
    "B16": { content: bal("520701"),         style:"4", format:"1" },
    "A17": { content:"مصروفات بنكية",         style:"2" },
    "B17": { content: bal("520801"),         style:"4", format:"1" },
  };

  return {
    id          : "data_sheet",
    name        : "البيانات",
    cells,
    colNumber   : 6,
    rowNumber   : 20,
    merges      : [],
    figures     : [],
    tables      : [],
    areGridLinesVisible : true,
    isVisible   : true,          // set false after confirming it works
    headerGroups: { ROW:[], COL:[] },
    cols        : { "0":{"size":180}, "1":{"size":130}, "2":{"size":130}, "3":{"size":120}, "4":{"size":100} },
    rows        : {},
    filterTables: [],
    conditionalFormats: [],
  };
}

// ─────────────────────────────────────────────
//  Dashboard sheet
// ─────────────────────────────────────────────
function buildDashboardSheet() {

  // ── Scorecard figure factory ──────────────
  // Positions: 5 cards × 218px wide, 8px gap, y=65
  function scorecard({ id, x, title, keyCell, baseCell, baseDescr, invertColors=false }) {
    return {
      id,
      x,
      y            : 65,
      width        : 218,
      height       : 130,
      tag          : "chart",
      data: {
        type              : "scorecard",
        title             : { text: title, bold: true },
        keyValue          : `البيانات!${keyCell}`,
        baseline          : `البيانات!${baseCell}`,
        baselineDescr     : baseDescr,
        background        : "#111827",
        baselineColorUp   : invertColors ? "#EF4444" : "#10B981",
        baselineColorDown : invertColors ? "#10B981" : "#EF4444",
      },
    };
  }

  // ── Bar chart: P&L actual vs budget ───────
  const barChart = {
    id     : "chart_pl_bar",
    x      : 0,
    y      : 210,
    width  : 565,
    height : 295,
    tag    : "chart",
    data   : {
      type            : "bar",
      title           : { text: "الأداء المالي — الفعلي vs الموازنة" },
      dataSetsHaveTitle: true,
      stacked         : false,
      background      : "#111827",
      legendPosition  : "bottom",
      dataSets        : [
        { dataRange: "البيانات!B2:B6", label: "الفعلي" },
        { dataRange: "البيانات!C2:C6", label: "الموازنة" },
      ],
      labelRange      : "البيانات!A2:A6",
      verticalAxisPosition : "left",
      dataSetDesign   : [
        { color: "#3B82F6" },
        { color: "#6B7280" },
      ],
    },
  };

  // ── Pie chart: OpEx breakdown ─────────────
  const pieChart = {
    id     : "chart_opex_pie",
    x      : 585,
    y      : 210,
    width  : 565,
    height : 295,
    tag    : "chart",
    data   : {
      type            : "pie",
      title           : { text: "توزيع المصروفات التشغيلية" },
      dataSetsHaveTitle: false,
      background      : "#111827",
      legendPosition  : "right",
      dataSets        : [
        { dataRange: "البيانات!B10:B17" },
      ],
      labelRange      : "البيانات!A10:A17",
    },
  };

  const figures = [
    scorecard({ id:"sc_rev",    x:0,   title:"الإيرادات الإجمالية",   keyCell:"B2", baseCell:"C2", baseDescr:"الموازنة" }),
    scorecard({ id:"sc_cogs",   x:226, title:"تكلفة البضاعة المباعة", keyCell:"B3", baseCell:"C3", baseDescr:"الموازنة", invertColors:true }),
    scorecard({ id:"sc_gp_pct", x:452, title:"هامش الربح الإجمالي %", keyCell:"B7", baseCell:"C7", baseDescr:"الموازنة" }),
    scorecard({ id:"sc_opex",   x:678, title:"المصروفات التشغيلية",   keyCell:"B5", baseCell:"C5", baseDescr:"الموازنة", invertColors:true }),
    scorecard({ id:"sc_net",    x:904, title:"صافي الربح",             keyCell:"B6", baseCell:"C6", baseDescr:"الموازنة" }),
    barChart,
    pieChart,
  ];

  // ── P&L table cells ───────────────────────
  // Starts at row 28 (y ≈ 518, after charts end at y=505)
  const pnlStartRow = 28;
  const r = (n) => String(pnlStartRow + n); // row number as string offset

  const sectionHeader = (row, text) => ({
    [`A${row}`]: { content: text, style:"9" },
    [`B${row}`]: { content:"",   style:"9" },
    [`C${row}`]: { content:"",   style:"9" },
    [`D${row}`]: { content:"",   style:"9" },
    [`E${row}`]: { content:"",   style:"9" },
    [`F${row}`]: { content:"",   style:"9" },
  });

  const colHdr = (row) => ({
    [`B${row}`]: { content:"البند",           style:"11" },
    [`C${row}`]: { content:"الفعلي (USD)",    style:"11" },
    [`D${row}`]: { content:"الموازنة (USD)",  style:"11" },
    [`E${row}`]: { content:"الفرق",           style:"11" },
    [`F${row}`]: { content:"% الإنجاز",       style:"11" },
  });

  const pnlRow = (row, label, bCell, cCell, dCell, eCell, styleId="4") => ({
    [`B${row}`]: { content: label, style:"2" },
    [`C${row}`]: { content:`=البيانات!${bCell}`, style: styleId, format:"1" },
    [`D${row}`]: { content:`=البيانات!${cCell}`, style: styleId, format:"1" },
    [`E${row}`]: { content:`=البيانات!${dCell}`, style: styleId, format:"3" },
    [`F${row}`]: { content:`=البيانات!${eCell}`, style: styleId, format:"2" },
  });

  const R = pnlStartRow;
  const cells = {
    // ── Title row (row 1)
    "A1": { content: "لوحة الأداء المالي والتشغيلي — مصنع البلاستيك", style:"1" },

    // ── Subtitle
    "A2": { content: "السنة المالية الحالية  |  الموازنة: عطاء بكري أرسلان  |  العملة: USD", style:"10" },

    // ── P&L section header
    ...sectionHeader(R,   "قائمة الدخل المقارنة — السنة المالية الحالية"),
    ...colHdr(R + 1),

    // Revenue
    ...pnlRow(R+2, "الإيرادات الإجمالية",    "B2","C2","D2","E2", "4"),

    // COGS
    ...pnlRow(R+3, "تكلفة البضاعة المباعة",  "B3","C3","D3","E3", "4"),

    // Gross Profit (highlight)
    ...pnlRow(R+4, "إجمالي الربح الإجمالي",  "B4","C4","D4","E4", "7"),
    [`B${R+4}`]: { content:"إجمالي الربح الإجمالي", style:"8" },

    // GP%
    [`B${R+5}`]: { content:"هامش الربح الإجمالي %",  style:"2" },
    [`C${R+5}`]: { content:"=البيانات!B7", style:"4", format:"2" },
    [`D${R+5}`]: { content:"=البيانات!C7", style:"4", format:"2" },
    [`E${R+5}`]: { content:"",             style:"4" },
    [`F${R+5}`]: { content:"",             style:"4" },

    // OpEx total
    ...pnlRow(R+6, "إجمالي المصروفات التشغيلية", "B5","C5","D5","E5", "4"),

    // OpEx breakdown (no budget for sub-items)
    [`B${R+7}`]:  { content:"  الرواتب والأجور",      style:"10" },
    [`C${R+7}`]:  { content:"=البيانات!B10", style:"4", format:"1" },
    [`B${R+8}`]:  { content:"  وقود ومحروقات",        style:"10" },
    [`C${R+8}`]:  { content:"=البيانات!B11", style:"4", format:"1" },
    [`B${R+9}`]:  { content:"  صيانة وإصلاح",         style:"10" },
    [`C${R+9}`]:  { content:"=البيانات!B12", style:"4", format:"1" },
    [`B${R+10}`]: { content:"  إيجارات",               style:"10" },
    [`C${R+10}`]: { content:"=البيانات!B13", style:"4", format:"1" },
    [`B${R+11}`]: { content:"  مصروفات إدارية",        style:"10" },
    [`C${R+11}`]: { content:"=البيانات!B14", style:"4", format:"1" },
    [`B${R+12}`]: { content:"  نقل وشحن",              style:"10" },
    [`C${R+12}`]: { content:"=البيانات!B15", style:"4", format:"1" },
    [`B${R+13}`]: { content:"  إهلاك الأصول",          style:"10" },
    [`C${R+13}`]: { content:"=البيانات!B16", style:"4", format:"1" },
    [`B${R+14}`]: { content:"  مصروفات بنكية",         style:"10" },
    [`C${R+14}`]: { content:"=البيانات!B17", style:"4", format:"1" },

    // Net Profit (highlighted)
    ...pnlRow(R+15, "صافي الربح",            "B6","C6","D6","E6", "7"),
    [`B${R+15}`]: { content:"صافي الربح", style:"8" },

    // Net margin
    [`B${R+16}`]: { content:"هامش صافي الربح %", style:"2" },
    [`C${R+16}`]: { content:"=البيانات!B8", style:"4", format:"2" },
  };

  // Merge the title row across columns A–L
  const merges = [
    "A1:L1",
    "A2:L2",
    `A${R}:L${R}`,
  ];

  return {
    id          : "dashboard_sheet",
    name        : "اللوحة",
    cells,
    colNumber   : 13,
    rowNumber   : R + 20,
    merges,
    figures,
    tables      : [],
    areGridLinesVisible : false,
    isVisible   : true,
    headerGroups: { ROW:[], COL:[] },
    cols        : {
      "0" : { size: 15  },   // A – narrow gutter
      "1" : { size: 200 },   // B – label
      "2" : { size: 130 },   // C – actual
      "3" : { size: 130 },   // D – budget
      "4" : { size: 120 },   // E – diff
      "5" : { size: 100 },   // F – %
    },
    rows        : {
      "0" : { size: 60  },   // title
      "1" : { size: 22  },   // subtitle
      // rows 2-27 provide space for scorecards (y=65,h=130) and charts (y=210,h=295)
      // we set them all to ~19px to total ~500px
      ...Object.fromEntries(
        Array.from({ length: 26 }, (_, i) => [String(i + 2), { size: 19 }])
      ),
      // P&L rows
      ...Object.fromEntries(
        Array.from({ length: 20 }, (_, i) => [String(R - 1 + i), { size: 26 }])
      ),
    },
    filterTables: [],
    conditionalFormats: [],
  };
}

// ─────────────────────────────────────────────
//  Assemble complete spreadsheet JSON
// ─────────────────────────────────────────────
function buildSpreadsheet() {
  return {
    version          : 17,
    sheets           : [ buildDataSheet(), buildDashboardSheet() ],
    styles           : STYLES,
    formats          : FORMATS,
    borders          : {},
    globalFilters    : [],
    pivotDefinitions : {},
    listDefinitions  : {},
  };
}

// ─────────────────────────────────────────────
//  Main
// ─────────────────────────────────────────────
async function main() {
  const client = createClient();

  // 1. Authenticate
  const uid = await client.auth();
  console.log(`✅ Connected to Odoo  uid=${uid}  (${client.C.username})`);
  console.log(`   URL: ${client.C.url}`);

  // 2. Check for duplicate
  const DASH_NAME = "لوحة الأداء المالي والتشغيلي — مصنع البلاستيك ★";
  const existing = await client.ex("spreadsheet.dashboard", "search_read",
    [[["name", "=", DASH_NAME]]],
    { fields: ["id", "name"], limit: 1 }
  );
  if (existing.length) {
    console.log(`ℹ️  Dashboard already exists with id=${existing[0].id}. Deleting and re-creating…`);
    await client.ex("spreadsheet.dashboard", "unlink", [[existing[0].id]]);
    console.log("   Deleted old version.");
  }

  // 3. Build JSON
  console.log("⚙️  Building spreadsheet JSON…");
  const spreadsheetData = buildSpreadsheet();
  const dataStr = JSON.stringify(spreadsheetData);
  console.log(`   JSON size: ${(dataStr.length / 1024).toFixed(1)} KB`);

  // 4. Create dashboard
  console.log("📊 Creating dashboard record…");
  const newId = await client.ex("spreadsheet.dashboard", "create", [{
    name           : DASH_NAME,
    spreadsheet_data: dataStr,
  }]);
  console.log(`✅ Dashboard created!  id=${newId}`);
  console.log(`   Open in Odoo:  ${client.C.url}/web#action=spreadsheet&spreadsheet_id=${newId}&spreadsheet_type=dashboard`);

  // 5. Attempt to add to a group so all internal users can see it
  try {
    const groups = await client.ex("res.groups", "search_read",
      [[["full_name", "ilike", "Internal User"]]],
      { fields: ["id","full_name"], limit: 1 }
    );
    if (groups.length) {
      await client.ex("spreadsheet.dashboard", "write",
        [[newId], { group_ids: [[4, groups[0].id]] }]
      );
      console.log(`   Shared with: ${groups[0].full_name}`);
    }
  } catch(e) {
    console.log("   (Could not set group_ids — not critical)");
  }

  return newId;
}

main().catch(err => {
  console.error("❌ Error:", err.message || err);
  process.exit(1);
});
