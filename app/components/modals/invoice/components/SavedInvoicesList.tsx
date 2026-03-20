"use client";

import React from "react";

// RHF
import { useFormContext } from "react-hook-form";

// ShadCn
import { Card, CardContent } from "@/components/ui/card";

// Components
import { BaseButton } from "@/app/components";

// Contexts
import { useInvoiceContext } from "@/contexts/InvoiceContext";

// Helpers
import { formatNumberWithCommas } from "@/lib/helpers";

// Variables
import { DATE_OPTIONS } from "@/lib/variables";

// Types
import { InvoiceType } from "@/types";

/** Saved JSON may have ISO date strings before `updateFields` normalizes to Date for the form. */
type InvoiceWithLooseDates = Omit<InvoiceType, "details"> & {
    details: Omit<InvoiceType["details"], "invoiceDate" | "dueDate"> & {
        invoiceDate: InvoiceType["details"]["invoiceDate"] | Date;
        dueDate: InvoiceType["details"]["dueDate"] | Date;
    };
};

type SavedInvoicesListProps = {
    setModalState: React.Dispatch<React.SetStateAction<boolean>>;
};

const SavedInvoicesList = ({ setModalState }: SavedInvoicesListProps) => {
    const { savedInvoices, onFormSubmit, deleteInvoice } = useInvoiceContext();

    const { reset } = useFormContext<InvoiceType>();

    // Update fields when selected invoice is changed (saved data may use string dates from JSON).
    const updateFields = (selected: InvoiceWithLooseDates) => {
        // Normalize dates when loading from storage so the form receives Date objects.
        selected.details.dueDate = new Date(
            selected.details.dueDate as string | Date
        );
        selected.details.invoiceDate = new Date(
            selected.details.invoiceDate as string | Date
        );

        selected.details.invoiceLogo = "";
        selected.details.signature = {
            data: "",
        };
    };

    /**
     * Transform date values for next submission
     *
     * @param {InvoiceType} selected - The selected invoice
     */
    const transformDates = (selected: InvoiceType) => {
        selected.details.dueDate = new Date(
            selected.details.dueDate
        ).toLocaleDateString("en-US", DATE_OPTIONS);
        selected.details.invoiceDate = new Date(
            selected.details.invoiceDate
        ).toLocaleDateString("en-US", DATE_OPTIONS);
    };

    /**
     * Loads a given invoice into the form.
     *
     * @param {InvoiceType} selectedInvoice - The selected invoice
     */
    const load = (selectedInvoice: InvoiceType) => {
        if (selectedInvoice) {
            updateFields(selectedInvoice as InvoiceWithLooseDates);
            reset(selectedInvoice);
            transformDates(selectedInvoice);

            // Close modal
            setModalState(false);
        }
    };

    /**
     * Loads a given invoice into the form and generates a pdf by submitting the form.
     *
     * @param {InvoiceType} selectedInvoice - The selected invoice
     */
    const loadAndGeneratePdf = (selectedInvoice: InvoiceType) => {
        load(selectedInvoice);

        // Submit form
        onFormSubmit(selectedInvoice);
    };

    return (
        <>
            <div className="flex flex-col gap-5 overflow-y-auto max-h-72">
                {savedInvoices.map((invoice, idx) => (
                    <Card
                        key={idx}
                        className="p-2 border rounded-sm hover:border-blue-500 hover:shadow-lg cursor-pointer"
                        // onClick={() => handleSelect(invoice)}
                    >
                        <CardContent className="flex justify-between">
                            <div>
                                {/* <FileText /> */}
                                <p className="font-semibold">
                                    Invoice #{invoice.details.invoiceNumber}{" "}
                                </p>
                                <small className="text-gray-500">
                                    Updated at: {invoice.details.updatedAt}
                                </small>

                                <div>
                                    <p>Sender: {invoice.sender.name}</p>
                                    <p>Receiver: {invoice.receiver.name}</p>
                                    <p>
                                        Total:{" "}
                                        <span className="font-semibold">
                                            {formatNumberWithCommas(
                                                Number(
                                                    invoice.details.totalAmount
                                                )
                                            )}{" "}
                                            {invoice.details.currency}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <BaseButton
                                    tooltipLabel="Load invoice details into the form"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => load(invoice)}
                                >
                                    Load
                                </BaseButton>

                                <BaseButton
                                    tooltipLabel="Load invoice and generate PDF"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => loadAndGeneratePdf(invoice)}
                                >
                                    Load & Generate
                                </BaseButton>
                                {/* Remove Invoice Button */}
                                <BaseButton
                                    variant="destructive"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteInvoice(idx);
                                    }}
                                >
                                    Delete
                                </BaseButton>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {savedInvoices.length === 0 && (
                    <div>
                        <p>No saved invoices</p>
                    </div>
                )}
            </div>
        </>
    );
};

export default SavedInvoicesList;
