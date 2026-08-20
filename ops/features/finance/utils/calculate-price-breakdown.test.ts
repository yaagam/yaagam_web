import assert from "node:assert/strict";
import test from "node:test";
import { calculatePriceBreakdown } from "./calculate-price-breakdown.ts";

test("extracts included GST from a normal 18% margin", () => { const value=calculatePriceBreakdown({listPrice:118,effectiveCustomerPrice:118,templeAmount:100}); assert.equal(value.platformFeeBeforeGst,15.25); assert.equal(value.platformFeeGst,2.75); });
test("uses base price for a zero-discount offering", () => { const value=calculatePriceBreakdown({listPrice:150,effectiveCustomerPrice:150,templeAmount:100}); assert.equal(value.customerPays,150); assert.equal(value.discountAmount,0); });
test("reports a discounted offering", () => { const value=calculatePriceBreakdown({listPrice:200,effectiveCustomerPrice:150,templeAmount:100}); assert.equal(value.discountAmount,50); assert.equal(value.discountPercentage,25); });
test("supports zero margin", () => { const value=calculatePriceBreakdown({listPrice:100,effectiveCustomerPrice:100,templeAmount:100}); assert.equal(value.grossPlatformMargin,0); assert.equal(value.platformFeeGst,0); });
test("makes negative margins unavailable", () => { const value=calculatePriceBreakdown({listPrice:100,effectiveCustomerPrice:90,templeAmount:100}); assert.equal(value.available,false); assert.match(value.error??"",/cannot be less/); });
test("rounds decimal results safely to two places", () => { const value=calculatePriceBreakdown({listPrice:110,effectiveCustomerPrice:110,templeAmount:100}); assert.equal(value.platformFeeBeforeGst,8.47); assert.equal(value.platformFeeGst,1.53); });
