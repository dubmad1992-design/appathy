"use client";

import { useEffect, useState } from "react";

type CompanyOption = {
  id: string;
  name: string;
};

type ContactOption = {
  id: string;
  companyId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  isPrimary: boolean;
};

type CompanyContactSelectFieldsProps = {
  companies: CompanyOption[];
  contacts: ContactOption[];
  initialCompanyId?: string | null;
  initialContactId?: string | null;
  companyName?: string;
  contactName?: string;
  companyPlaceholder?: string;
  contactPlaceholder?: string;
  companyRequired?: boolean;
  contactRequired?: boolean;
  className?: string;
};

export function CompanyContactSelectFields({
  companies,
  contacts,
  initialCompanyId,
  initialContactId,
  companyName = "companyId",
  contactName = "contactId",
  companyPlaceholder = "Select company",
  contactPlaceholder = "Select contact",
  companyRequired = true,
  contactRequired = false,
  className = "h-11 rounded-2xl border border-border/70 bg-background/70 px-4 text-sm"
}: CompanyContactSelectFieldsProps) {
  const [companyId, setCompanyId] = useState(initialCompanyId ?? "");
  const [contactId, setContactId] = useState(initialContactId ?? "");

  const availableContacts = contacts.filter((contact) => contact.companyId === companyId);

  useEffect(() => {
    if (!companyId) {
      if (contactId) {
        setContactId("");
      }
      return;
    }

    const selectedContactIsValid = availableContacts.some((contact) => contact.id === contactId);
    if (selectedContactIsValid) {
      return;
    }

    const primaryContact = availableContacts.find((contact) => contact.isPrimary);
    setContactId(primaryContact?.id ?? "");
  }, [availableContacts, companyId, contactId]);

  return (
    <>
      <select className={className} name={companyName} onChange={(event) => setCompanyId(event.target.value)} required={companyRequired} value={companyId}>
        <option value="">{companyPlaceholder}</option>
        {companies.map((company) => (
          <option key={company.id} value={company.id}>
            {company.name}
          </option>
        ))}
      </select>
      <div className="space-y-2">
        <select className={className} name={contactName} onChange={(event) => setContactId(event.target.value)} required={contactRequired} value={contactId}>
          <option value="">{contactPlaceholder}</option>
          {availableContacts.map((contact) => (
            <option key={contact.id} value={contact.id}>
              {contact.firstName} {contact.lastName}
              {contact.isPrimary ? " (Primary)" : ""}
            </option>
          ))}
        </select>
        {companyId && !availableContacts.length ? (
          <p className="text-xs text-muted-foreground">No contacts are linked to this company yet.</p>
        ) : null}
      </div>
    </>
  );
}
