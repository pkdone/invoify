import { NextRequest, NextResponse } from "next/server";

// JSON2CSV
import { AsyncParser } from "@json2csv/node";

// XML2JS
import { Builder } from "xml2js";

// XLSX (no default export in ESM/Next bundler)
import * as XLSX from "xlsx";

// Helpers
import { flattenObject } from "@/lib/helpers";

// Types
import { ExportTypes } from "@/types";

const SUPPORTED_EXPORT_FORMATS = new Set<string>([
    ExportTypes.JSON,
    ExportTypes.CSV,
    ExportTypes.XML,
    ExportTypes.XLSX,
]);

/**
 * Export an invoice in selected format.
 *
 * @param {NextRequest} req - The Next.js request object.
 * @returns {NextResponse} A response object containing the exported data in the requested format.
 */
export async function exportInvoiceService(req: NextRequest) {
    const body = await req.json();
    const format = req.nextUrl.searchParams.get("format");

    if (!format || !SUPPORTED_EXPORT_FORMATS.has(format)) {
        return NextResponse.json(
            { error: "Unsupported export format" },
            { status: 400 }
        );
    }

    try {
        switch (format) {
            case ExportTypes.JSON:
                const jsonData = JSON.stringify(body);
                return new NextResponse(jsonData, {
                    headers: {
                        "Content-Type": "application/json",
                        "Content-Disposition":
                            "attachment; filename=invoice.json",
                    },
                    status: 200,
                });
            case ExportTypes.CSV:
                //? Can pass specific fields to async parser. Empty = All
                const parser = new AsyncParser();
                const csv = await parser.parse(body).promise();
                return new NextResponse(csv, {
                    headers: {
                        "Content-Type": "text/csv",
                        "Content-Disposition":
                            "attachment; filename=invoice.csv",
                    },
                });
            case ExportTypes.XML:
                // Convert JSON to XML
                const builder = new Builder();
                const xml = builder.buildObject(body);
                return new NextResponse(xml, {
                    headers: {
                        "Content-Type": "application/xml",
                        "Content-Disposition":
                            "attachment; filename=invoice.xml",
                    },
                });
            case ExportTypes.XLSX: {
                const flat = flattenObject(
                    body as Record<string, unknown>
                );
                const summaryRow: Record<
                    string,
                    string | number | boolean
                > = {};
                for (const key of Object.keys(flat)) {
                    const v = flat[key];
                    if (v === null || v === undefined) {
                        summaryRow[key] = "";
                    } else if (typeof v === "object") {
                        summaryRow[key] = JSON.stringify(v);
                    } else {
                        summaryRow[key] = v as string | number | boolean;
                    }
                }
                const worksheet = XLSX.utils.json_to_sheet([summaryRow]);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Summary");

                const items = (
                    body as {
                        details?: { items?: unknown };
                    }
                ).details?.items;
                if (Array.isArray(items) && items.length > 0) {
                    const itemsSheet = XLSX.utils.json_to_sheet(
                        items as Record<string, unknown>[]
                    );
                    XLSX.utils.book_append_sheet(
                        workbook,
                        itemsSheet,
                        "Items"
                    );
                }

                const buffer = XLSX.write(workbook, {
                    bookType: "xlsx",
                    type: "buffer",
                });

                return new NextResponse(buffer, {
                    status: 200,
                    headers: {
                        "Content-Type":
                            "text/csv",
                        "Content-Disposition":
                            "attachment; filename=invoice.csv",
                    },
                });
            }
        }
    } catch (error) {
        console.error(error);

        // Return an error response
        return new Response(`Error exporting: \n${error}`, {
            status: 500,
        });
    }
}
