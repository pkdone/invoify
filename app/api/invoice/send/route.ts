import { NextRequest, NextResponse } from "next/server";

// Services
import { sendPdfToEmailService } from "@/services/invoice/server/sendPdfToEmailService";

import { ValidationError } from "@/lib/errors";

export async function POST(req: NextRequest) {
    try {
        const emailSent = await sendPdfToEmailService(req);

        if (emailSent) {
            return new NextResponse("Email sent successfully", {
                status: 200,
            });
        } else {
            return new NextResponse("Failed to send email", {
                status: 500,
            });
        }
    } catch (err) {
        console.error("Email service error:", err);

        if (err instanceof ValidationError) {
            return new NextResponse(err.message, { status: 400 });
        }

        const message =
            err instanceof Error ? err.message : "Failed to send email";
        const isConfigError = message.includes("Email service not configured");

        return new NextResponse(
            isConfigError
                ? "Email service is not available"
                : "Failed to send email",
            { status: isConfigError ? 503 : 500 }
        );
    }
}
