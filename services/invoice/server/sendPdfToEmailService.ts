import { NextRequest } from "next/server";

// Nodemailer
import nodemailer, { SendMailOptions } from "nodemailer";

// React-email
import { render } from "@react-email/render";

// Zod
import { z } from "zod";

// Components
import { SendPdfEmail } from "@/app/components";

// Helpers
import { fileToBuffer } from "@/lib/helpers";

// Variables
import { NODEMAILER_EMAIL, NODEMAILER_PW } from "@/lib/variables";

import { ValidationError } from "@/lib/errors";

// Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: NODEMAILER_EMAIL,
        pass: NODEMAILER_PW,
    },
});

const MAX_PDF_ATTACHMENT_BYTES = 15 * 1024 * 1024;

const sendFormSchema = z.object({
    email: z.string().email().max(254),
    invoiceNumber: z.string().min(1).max(200),
});

// Check if email credentials are configured
const isEmailConfigured = () => {
    return !!(NODEMAILER_EMAIL && NODEMAILER_PW);
};

/**
 * Send a PDF as an email attachment.
 *
 * @param {NextRequest} req - The Next.js request object.
 * @returns {Promise<boolean>} A Promise that resolves to a boolean, indicating whether the email was sent successfully.
 * @throws {Error} Throws an error if there is an issue with sending the email.
 */
export async function sendPdfToEmailService(
    req: NextRequest
): Promise<boolean> {
    // Check if email service is configured
    if (!isEmailConfigured()) {
        console.error(
            "Email service not configured. Please set NODEMAILER_EMAIL and NODEMAILER_PW environment variables."
        );
        throw new Error(
            "Email service not configured. Please contact the administrator."
        );
    }

    const fd = await req.formData();

    const emailRaw = fd.get("email");
    const invoicePdf = fd.get("invoicePdf");
    const invoiceNumberRaw = fd.get("invoiceNumber");

    const parsed = sendFormSchema.safeParse({
        email: typeof emailRaw === "string" ? emailRaw : "",
        invoiceNumber:
            typeof invoiceNumberRaw === "string" ? invoiceNumberRaw : "",
    });

    if (!parsed.success) {
        throw new ValidationError("Invalid email or invoice number");
    }

    const { email, invoiceNumber } = parsed.data;

    if (!(invoicePdf instanceof File)) {
        throw new ValidationError("Invalid or missing PDF attachment");
    }

    if (invoicePdf.size === 0) {
        throw new ValidationError("PDF attachment is empty");
    }

    if (invoicePdf.size > MAX_PDF_ATTACHMENT_BYTES) {
        throw new ValidationError("PDF attachment is too large");
    }

    // Get email html content
    const emailHTML = render(SendPdfEmail({ invoiceNumber }));

    // Convert file to buffer
    const invoiceBuffer = await fileToBuffer(invoicePdf);

    try {
        const mailOptions: SendMailOptions = {
            from: "Invoify",
            to: email,
            subject: `Invoice Ready: #${invoiceNumber}`,
            html: emailHTML,
            attachments: [
                {
                    filename: "invoice.pdf",
                    content: invoiceBuffer,
                },
            ],
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error("Error sending email", error);
        return false;
    }
}
