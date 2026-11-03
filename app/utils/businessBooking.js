/**
 * Private or business booking, as the booker answers it in the checkout's
 * contact data. Until the booker sets the checkbox, the answer follows the
 * company: with a company a business booking, without one a private
 * booking. The backend stores it as `isBusiness`; only a private booking is
 * offered the withdrawal.
 */

/**
 * @param {{ company?: string }} contact
 * @returns {boolean}
 */
function hasCompany(contact) {
  return String(contact?.company ?? "").trim() !== "";
}

/**
 * The answer the checkout sends: the booker's choice where they made one
 * (`contact.isBusiness` a boolean), the company's reading otherwise.
 * @param {{ isBusiness?: boolean | null, company?: string }} contact
 * @returns {boolean}
 */
export function isBusinessContact(contact) {
  return typeof contact?.isBusiness === "boolean"
    ? contact.isBusiness
    : hasCompany(contact);
}
