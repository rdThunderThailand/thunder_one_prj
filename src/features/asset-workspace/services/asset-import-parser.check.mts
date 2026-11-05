/** Suite helper. Run: node src/features/asset-workspace/services/asset-import-services.check.mts */
import assert from "node:assert/strict";
import { parseImportFile, ParseError } from "./asset-import-parse.ts";
import { OPTIONS } from "./asset-import-fixtures.check.mts";

function csv(text: string, name = "assets.csv") {
  return new File([text], name, { type: "text/csv" });
}
async function parseFails(file: File, code: ParseError["code"]) {
  await assert.rejects(
    () => parseImportFile(file, OPTIONS),
    (error) => error instanceof ParseError && error.code === code,
  );
}
export async function parserChecks() {
  const parsed = await parseImportFile(
    csv(
      '\uFEFFAsset Name,Category,Location,Notes\r\n"จอ, ชั้น 1",DISPLAY,HQ,"A ""quoted"" note"\r\n,,,\r\nDesk,OFFICE,HQ,"Two\nlines"\r\nChair,OFFICE,HQ,',
    ),
    OPTIONS,
  );
  assert.deepEqual(parsed.headers, ["Asset Name", "Category", "Location", "Notes"]);
  assert.deepEqual(
    parsed.rows.map((row) => row.rowIndex),
    [2, 4, 5],
  );
  assert.equal(parsed.rows[0].cells[0], "จอ, ชั้น 1");
  assert.equal(parsed.rows[0].cells[3], 'A "quoted" note');
  assert.equal(parsed.rows[1].cells[3], "Two\nlines");
  assert.equal(parsed.rows[2].cells[3], "");
  assert.equal(parsed.kind, "csv");
  assert.equal(parsed.reimport, null);
  const semicolon = await parseImportFile(
    csv("Name;Category;Location\n Desk ; OFFICE ; HQ\n"),
    OPTIONS,
  );
  assert.deepEqual(semicolon.rows[0].cells, ["Desk", "OFFICE", "HQ"]);
  const leadingSemicolon = await parseImportFile(csv("\n\r\nName;Notes\nDesk;ไทย"), OPTIONS);
  assert.deepEqual(leadingSemicolon.headers, ["Name", "Notes"]);
  assert.equal(leadingSemicolon.rows[0].rowIndex, 4);
  const leading = await parseImportFile(
    csv('\n\r\nName,Notes\nDesk,"CR\r\nLF"\n'),
    OPTIONS,
  );
  assert.equal(leading.rows[0].rowIndex, 4);
  assert.equal(leading.rows[0].cells[1], "CR\r\nLF");
  await parseFails(csv("Name\nDesk", "assets.xls"), "TYPE");
  await parseFails(csv("Name\nDesk", "assets.pdf"), "TYPE");
  await parseFails(new File([new Uint8Array(10485761)], "big.csv"), "SIZE");
  await parseFails(new File([new Uint8Array([0xff, 0xfe])], "bad.csv"), "ENCODING");
  await parseFails(csv("Name,Category\n,\n"), "EMPTY");
  const tooMany =
    "Name\n" + Array.from({ length: 5001 }, (_, index) => `Item ${index}`).join("\n");
  await assert.rejects(
    () => parseImportFile(csv(tooMany), OPTIONS),
    (error) =>
      error instanceof ParseError &&
      error.code === "TOO_MANY_ROWS" &&
      error.message.includes("5,001"),
  );
  const idA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const idB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  await parseFails(
    csv(`Name,Import ID,Source Row\nA,${idA},2\nB,${idB},3`),
    "MIXED_IMPORT",
  );
  const reimport = await parseImportFile(
    csv(`Name,Import ID,Source Row\nA,${idA.toUpperCase()},2`),
    OPTIONS,
  );
  assert.deepEqual(reimport.reimport, { originalImportId: idA, sourceRowColumn: 2 });
  await parseFails(new File(["binary"], "sample.xlsx"), "UNREADABLE");
  await parseFails(csv('Name,Notes\nDesk,"unfinished'), "UNREADABLE");
  await parseFails(csv("Name,Import ID,Source Row\nDesk,,2"), "MIXED_IMPORT");
}
