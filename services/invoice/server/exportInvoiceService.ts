import { NextRequest, NextResponse } from "next/server";

// JSON2CSV
import { AsyncParser } from "@json2csv/node";

// XML2JS
import { Builder } from "xml2js";

// XLSX
import * as XLSX from "xlsx";

// Types
import { ExportTypes, ItemType } from "@/types";

/**
 * Export an invoice in selected format.
 *
 * @param {NextRequest} req - The Next.js request object.
 * @returns {NextResponse} A response object containing the exported data in the requested format.
 */
export async function exportInvoiceService(req: NextRequest) {
    const body = await req.json();
    const format = req.nextUrl.searchParams.get("format");

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
                const rows = (body.details?.items ?? []).map((item: ItemType) => ({
                    InvoiceNumber: body.details.invoiceNumber,
                    InvoiceDate: body.details.invoiceDate,
                    DueDate: body.details.dueDate,
                    Sender: body.sender?.name ?? "",
                    Receiver: body.receiver?.name ?? "",
                    ItemName: item.name,
                    Description: item.description ?? "",
                    Quantity: item.quantity,
                    UnitPrice: item.unitPrice,
                    Total: item.total,
                    Currency: body.details?.currency ?? "",
                    SubTotal: body.details?.subTotal ?? "",
                    TotalAmount: body.details?.totalAmount ?? "",
                }));
                const worksheet = XLSX.utils.json_to_sheet(rows);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(
                    workbook,
                    worksheet,
                    "invoice-worksheet"
                );
                const buffer = XLSX.write(workbook, {
                    bookType: "xlsx",
                    type: "buffer",
                });
                return new NextResponse(buffer, {
                    headers: {
                        "Content-Type":
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        "Content-Disposition":
                            "attachment; filename=invoice.xlsx",
                    },
                });
            }
            default:
                return new NextResponse(
                    JSON.stringify({
                        error: "Unsupported or missing export format",
                    }),
                    {
                        status: 400,
                        headers: { "Content-Type": "application/json" },
                    }
                );
        }
    } catch (error) {
        console.error(error);

        // Return an error response
        return new Response(`Error exporting: \n${error}`, {
            status: 500,
        });
    }
}
