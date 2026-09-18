export * from "./settlement";
export * from "./trip-state";
export * from "./money";
/**
 * The domain model, in Portuguese, is the product's vocabulary. It goes last so
 * the collision rule is explicit rather than accidental: ./trip-state re-exports
 * TripStatus/canTransition as aliases over ViagemStatus/podeTransicionar, and
 * deliberately does NOT re-export the domain names themselves, so `export *`
 * below is the single source of each of them.
 */
export * from "./domain";
