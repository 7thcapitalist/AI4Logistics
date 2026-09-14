# Brazilian freight fiscal glossary

> ## UNVERIFIED DRAFT. DO NOT CODE AGAINST THIS FILE.
>
> Every entry without a **Source** link is a hint about what to look up, not a rule.
>
> This warning is here because agents invent Brazilian fiscal rules with complete
> confidence. Deadlines, fine values, validation rules: all plausible, all specific,
> all wrong, and all survive review because they look exactly like the real thing.
>
> **The standing rule:** when you learn a real rule, add it here with its source in
> the same PR as the code that depends on it. Until then, treat the entry as a
> question.

---

## Documents

### CT-e (Conhecimento de Transporte Eletronico)

The electronic bill of lading. Issued per shipment, it is the fiscal document for
the transport service itself and carries the freight value that feeds settlement.

- Model 57. Authorised by the state SEFAZ.
- MVP scope is interstate only, CFOP 6351/5351 per the PRD. Intra-state ICMS
  complexity is explicitly Phase 2.
- **Unverified:** cancellation window after authorisation. Commonly stated as a
  small number of hours. **Source before implementing cancellation.**

### MDF-e (Manifesto Eletronico de Documentos Fiscais)

The manifest covering a vehicle's journey, grouping the CT-e documents on board. One
per trip per vehicle.

**This is the document the product exists to protect.** It must be closed
("encerrado") after the journey ends, and an MDF-e left open is the routine,
expensive, entirely preventable fine that the alert prevents.

- **UNVERIFIED AND LOAD-BEARING:** the closure deadline is currently assumed to be
  24 hours in `MDFE_CLOSURE_ALERT_HOURS`. **That number is a guess.** The core
  feature of this product is built on it. Source it against ANTT or SEFAZ
  documentation before the first pilot.
- **Unverified:** the penalty for late or missing closure.

### CIOT (Codigo Identificador da Operacao de Transporte)

Required when contracting an autonomous driver (TAC). Registers the freight payment
operation with ANTT.

- **Unverified:** exactly which operations require it, and the penalty for operating
  without one.

### Vale-pedagio

Toll advance the contractor must provide to the driver separately from freight
payment. Mandatory on the routes it applies to.

- PRD open question: whether this is a real integration at MVP or a manual step.
- **Unverified:** the penalty for non-provision.

---

## Parties

| Term | Meaning |
|---|---|
| **Transportadora** | The carrier. Our customer. 5-50 trucks is our ICP |
| **TAC** | Autonomous driver, owns the truck, contracted per trip. Triggers CIOT |
| **Embarcador** | Shipper. Our customer's customer |
| **Destinatario** | Consignee, who receives the cargo |

## Bodies

| Term | What it does |
|---|---|
| **ANTT** | Federal land transport regulator. CIOT, vale-pedagio, the fines |
| **SEFAZ** | State finance authority. Authorises CT-e and MDF-e |
| **SEFAZ rejection** | A rejection code plus message. Must be translated to a clear owner-facing error, per P0 requirement 5. Never show the raw code |

## Operations

| Term | Meaning |
|---|---|
| **Settlement (acerto)** | Freight minus fuel, tolls and advances. The driver payout. Integer centavos, always |
| **Adiantamento** | Advance paid to the driver before the trip. Subtracted at settlement |
| **POD (canhoto)** | Proof of delivery. Photo, timestamp, GPS. The evidence in a delivery dispute |
| **A1 certificate** | Digital certificate used to sign fiscal documents. Who holds it is an open question in ADR 0003 |

---

## Sourcing checklist

The entries that need a source most urgently, in order of how much damage a wrong
value does:

- [ ] **MDF-e closure deadline.** The alert threshold. The product
- [ ] **MDF-e late-closure penalty.** The number the sales pitch quotes
- [ ] CIOT requirement conditions and penalty
- [ ] CT-e cancellation window
- [ ] Vale-pedagio applicability and penalty
