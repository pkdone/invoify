import { NextRequest, NextResponse } from "next/server";

// JSON2CSV
import { AsyncParser } from "@json2csv/node";

// XML2JS
import { Builder } from "xml2js";

// XLSX
import * as XLSX from "xlsx";

// Types
import { ExportTypes } from "@/types";

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
                const sender = body.sender ?? {};
                const receiver = body.receiver ?? {};
                const details = body.details ?? {};
                const items = details.items ?? [];

                const baseRow = {
                    "Invoice Number": details.invoiceNumber,
                    "Invoice Date": details.invoiceDate,
                    "Due Date": details.dueDate,
                    "Currency": details.currency,
                    "Purchase Order": details.purchaseOrderNumber,
                    "Payment Terms": details.paymentTerms,
                    "Sub Total": details.subTotal,
                    "Total Amount": details.totalAmount,
                    "Total In Words": details.totalAmountInWords,
                    "Sender Name": sender.name,
                    "Sender Address": sender.address,
                    "Sender City": sender.city,
                    "Sender Country": sender.country,
                    "Sender Email": sender.email,
                    "Sender Phone": sender.phone,
                    "Receiver Name": receiver.name,
                    "Receiver Address": receiver.address,
                    "Receiver City": receiver.city,
                    "Receiver Country": receiver.country,
                    "Receiver Email": receiver.email,
                    "Receiver Phone": receiver.phone,
                };

                const rows =
                    items.length > 0
                        ? items.map(
                              (item: {
                                  name?: string;
                                  description?: string;
                                  quantity?: number;
                                  unitPrice?: number;
                                  total?: number;
                              }) => ({
                                  ...baseRow,
                                  "Item Name": item.name,
                                  "Item Description": item.description ?? "",
                                  "Quantity": item.quantity,
                                  "Unit Price": item.unitPrice,
                                  "Item Total": item.total,
                              })
                          ) : [baseRow];

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
                    status: 200,
                });
            }
            default:
                return NextResponse.json(
                    { error: "Unsupported export format" },
                    { status: 400 }
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
