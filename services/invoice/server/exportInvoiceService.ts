import { NextRequest, NextResponse } from "next/server";

// JSON2CSV
import { AsyncParser } from "@json2csv/node";

// XML2JS
import { Builder } from "xml2js";

// Schemas
import { InvoiceSchema } from "@/lib/schemas";

// Types
import { ExportTypes } from "@/types";

const SUPPORTED_EXPORT_FORMATS: ReadonlySet<string> = new Set([
    ExportTypes.JSON,
    ExportTypes.CSV,
    ExportTypes.XML,
]);

/**
 * Export an invoice in selected format.
 *
 * @param {NextRequest} req - The Next.js request object.
 * @returns {NextResponse} A response object containing the exported data in the requested format.
 */
export async function exportInvoiceService(req: NextRequest) {
    const format = req.nextUrl.searchParams.get("format");

    if (!format || !SUPPORTED_EXPORT_FORMATS.has(format)) {
        return new NextResponse(
            JSON.stringify({ error: "Unsupported or missing export format" }),
            {
                status: 400,
                headers: { "Content-Type": "application/json" },
            }
        );
    }

    let parsed;
    try {
        parsed = InvoiceSchema.safeParse(await req.json());
    } catch {
        return new NextResponse(
            JSON.stringify({ error: "Invalid JSON body" }),
            {
                status: 400,
                headers: { "Content-Type": "application/json" },
            }
        );
    }

    if (!parsed.success) {
        return new NextResponse(
            JSON.stringify({ error: "Invalid invoice data" }),
            {
                status: 400,
                headers: { "Content-Type": "application/json" },
            }
        );
    }

    const body = parsed.data;

    try {
        switch (format) {
            case ExportTypes.JSON:
                return new NextResponse(JSON.stringify(body), {
                    headers: {
                        "Content-Type": "application/json",
                        "Content-Disposition":
                            "attachment; filename=invoice.json",
                    },
                    status: 200,
                });
            case ExportTypes.CSV: {
                const parser = new AsyncParser();
                const csv = await parser.parse(body).promise();
                return new NextResponse(csv, {
                    headers: {
                        "Content-Type": "text/csv",
                        "Content-Disposition":
                            "attachment; filename=invoice.csv",
                    },
                });
            }
            case ExportTypes.XML: {
                const builder = new Builder();
                const xml = builder.buildObject(body);
                return new NextResponse(xml, {
                    headers: {
                        "Content-Type": "application/xml",
                        "Content-Disposition":
                            "attachment; filename=invoice.xml",
                    },
                });
            }
            default:
                return new NextResponse(
                    JSON.stringify({ error: "Unsupported export format" }),
                    {
                        status: 400,
                        headers: { "Content-Type": "application/json" },
                    }
                );
        }
    } catch (error) {
        console.error("Export error:", error);

        return new NextResponse(
            JSON.stringify({ error: "Failed to export invoice" }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
}
